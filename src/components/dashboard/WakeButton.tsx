import { useState } from 'react'
import { Power } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useWakeDeviceMutation } from '@/hooks/useDeviceQueries'
import type { Device } from '@/lib/types'

export function WakeButton({ device }: { device: Device }) {
  const wake = useWakeDeviceMutation(device.id)
  const [open, setOpen] = useState(false)

  const canWake = device.status === 'online' && Boolean(device.wakeTarget.mac)
  const disabledReason = !device.wakeTarget.mac
    ? 'No wake target configured — set a MAC address in Settings'
    : device.status !== 'online'
      ? 'ESP32 is not connected — cannot relay the wake signal'
      : undefined

  async function handleConfirm() {
    try {
      await wake.mutateAsync()
      toast('Wake command sent to ESP32')
    } catch {
      toast.error('Failed to send wake command')
    } finally {
      setOpen(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            size="lg"
            className="w-full sm:w-auto"
            disabled={!canWake || wake.isPending}
            title={disabledReason}
          />
        }
      >
        <Power className="size-4" />
        Wake PC
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Wake {device.wakeTarget.label || 'the PC'}?</AlertDialogTitle>
          <AlertDialogDescription>
            This sends a Wake-on-LAN command to {device.name}, which relays it to{' '}
            {device.wakeTarget.mac} on the local network.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>Send</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
