import { useState } from 'react'
import { Wrench } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useEndCheckupMutation, useStartCheckupMutation } from '@/hooks/useDeviceQueries'
import type { Device } from '@/lib/types'

export function CheckupToggle({ device }: { device: Device }) {
  const [note, setNote] = useState('')
  const [open, setOpen] = useState(false)
  const startCheckup = useStartCheckupMutation(device.id)
  const endCheckup = useEndCheckupMutation(device.id)

  if (device.checkup.active) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400">
          <Wrench className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">Checkup mode — outage detection paused</p>
            {device.checkup.note && <p className="text-amber-700/80 dark:text-amber-400/80">{device.checkup.note}</p>}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={endCheckup.isPending}
          onClick={async () => {
            try {
              await endCheckup.mutateAsync()
              toast('Checkup ended')
            } catch {
              toast.error('Failed to end checkup')
            }
          }}
        >
          End Checkup
        </Button>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="lg" className="w-full sm:w-auto" />}>
        <Wrench className="size-4" />
        Start Checkup
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start manual checkup</DialogTitle>
          <DialogDescription>
            Pauses automatic power-cut detection for {device.name} while you work on it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="checkup-note">Note (optional)</Label>
          <Input
            id="checkup-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. testing new router"
          />
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          <Button
            disabled={startCheckup.isPending}
            onClick={async () => {
              try {
                await startCheckup.mutateAsync(note || undefined)
                toast('Checkup started')
                setNote('')
                setOpen(false)
              } catch {
                toast.error('Failed to start checkup')
              }
            }}
          >
            Start
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
