import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DeleteRowButton } from '@/components/history/DeleteRowButton'
import { useDeleteConnectionMutation } from '@/hooks/useDeviceQueries'
import {
  END_REASON_HINT,
  END_REASON_LABEL,
  isPowerLossBoot,
  resetReasonLabel,
} from '@/lib/connectionDisplay'
import { formatDateTime, formatDuration } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ConnectionLog } from '@/lib/types'

function StatusBadge({ connection }: { connection: ConnectionLog }) {
  if (!connection.endReason) {
    return (
      <Badge
        variant="outline"
        className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      >
        connected
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" title={END_REASON_HINT[connection.endReason]}>
      {END_REASON_LABEL[connection.endReason]}
    </Badge>
  )
}

function BootCell({ connection }: { connection: ConnectionLog }) {
  // Only the first session after a boot says anything about that boot.
  if (!connection.firstSinceBoot) {
    return <span className="text-muted-foreground">Reconnect</span>
  }
  const powerLoss = isPowerLossBoot(connection.resetReason)
  return (
    <span className={cn(powerLoss && 'font-medium text-red-600 dark:text-red-400')}>
      {resetReasonLabel(connection.resetReason)}
    </span>
  )
}

function bootTiming(connection: ConnectionLog): string {
  if (!connection.firstSinceBoot || connection.bootToConnectMs == null) return '—'
  return `${(connection.bootToConnectMs / 1000).toFixed(1)}s`
}

function connectionDuration(connection: ConnectionLog): number {
  return connection.durationMs ?? Date.now() - new Date(connection.connectedAt).getTime()
}

// The open session can't be deleted; the server also refuses the latest one.
function DeleteConnectionButton({
  connection,
  onDelete,
}: {
  connection: ConnectionLog
  onDelete: (logId: string) => Promise<void>
}) {
  if (!connection.endReason) return null
  return (
    <DeleteRowButton
      title="Delete this connection?"
      description={`The connection from ${formatDateTime(connection.connectedAt)} will be removed. The status timeline is built from connections, so it may change too.`}
      onConfirm={() => onDelete(connection._id)}
    />
  )
}

export function ConnectionList({
  deviceId,
  connections,
  isLoading,
}: {
  deviceId: string | undefined
  connections: ConnectionLog[]
  isLoading: boolean
}) {
  const deleteConnection = useDeleteConnectionMutation(deviceId)
  const onDelete = async (logId: string) => {
    await deleteConnection.mutateAsync(logId)
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (connections.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No connections match these filters.
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Desktop */}
      <div className="hidden overflow-x-auto rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Connected</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Ended by</TableHead>
              <TableHead>Boot reason</TableHead>
              <TableHead title="Time from boot until the server connection opened">
                Boot → online
              </TableHead>
              <TableHead>Signal</TableHead>
              <TableHead className="w-10">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {connections.map((connection) => (
              <TableRow key={connection._id}>
                <TableCell className="text-sm">{formatDateTime(connection.connectedAt)}</TableCell>
                <TableCell className="text-sm">
                  {formatDuration(connectionDuration(connection))}
                </TableCell>
                <TableCell>
                  <StatusBadge connection={connection} />
                </TableCell>
                <TableCell className="text-sm">
                  <BootCell connection={connection} />
                </TableCell>
                <TableCell className="text-sm">{bootTiming(connection)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {connection.rssi != null ? `${connection.rssi} dBm` : '—'}
                </TableCell>
                <TableCell className="text-right">
                  <DeleteConnectionButton connection={connection} onDelete={onDelete} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile */}
      <div className="space-y-2 md:hidden">
        {connections.map((connection) => (
          <Card key={connection._id}>
            <CardContent className="space-y-2 py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm">{formatDateTime(connection.connectedAt)}</p>
                <div className="flex items-center gap-1">
                  <StatusBadge connection={connection} />
                  <DeleteConnectionButton connection={connection} onDelete={onDelete} />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Duration: {formatDuration(connectionDuration(connection))}
              </p>
              <p className="text-sm text-muted-foreground">
                Boot: <BootCell connection={connection} />
                {bootTiming(connection) !== '—' && ` · online after ${bootTiming(connection)}`}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}
