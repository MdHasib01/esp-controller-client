import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EventFilterBar, type EventFilters } from '@/components/history/EventFilterBar'
import { EventList } from '@/components/history/EventList'
import { useDeviceEventsQuery, useDevicesQuery } from '@/hooks/useDeviceQueries'

const EMPTY_FILTERS: EventFilters = { type: 'all', from: '', to: '' }
const PAGE_SIZE = 20

export function HistoryPage() {
  const [searchParams] = useSearchParams()
  const devicesQuery = useDevicesQuery()
  const deviceId = searchParams.get('deviceId') ?? devicesQuery.data?.[0]?.id

  const [filters, setFilters] = useState<EventFilters>(EMPTY_FILTERS)
  const [page, setPage] = useState(1)

  const eventsQuery = useDeviceEventsQuery(deviceId, {
    page,
    limit: PAGE_SIZE,
    type: filters.type === 'all' ? undefined : filters.type,
    from: filters.from || undefined,
    to: filters.to || undefined,
  })

  function updateFilters(next: EventFilters) {
    setFilters(next)
    setPage(1)
  }

  const total = eventsQuery.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">History</h1>

      <EventFilterBar filters={filters} onChange={updateFilters} />

      <EventList events={eventsQuery.data?.events ?? []} isLoading={eventsQuery.isPending} />

      {total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} · {total} events
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
