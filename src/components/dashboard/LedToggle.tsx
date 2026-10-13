import { Lightbulb } from 'lucide-react'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useSetLedMutation } from '@/hooks/useDeviceQueries'
import { apiErrorMessage } from '@/lib/apiError'
import type { Device } from '@/lib/types'

export function LedToggle({ device }: { device: Device }) {
  const setLed = useSetLedMutation(device.id)

  const disabled = device.status !== 'online' || setLed.isPending
  const disabledReason = device.status !== 'online' ? 'ESP32 is not connected' : undefined

  async function handleChange(checked: boolean) {
    try {
      await setLed.mutateAsync(checked)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to update LED — device may have disconnected'))
    }
  }

  return (
    <div
      className="flex items-center gap-2 rounded-lg border px-3 py-2"
      title={disabledReason}
    >
      <Lightbulb className="size-4 text-muted-foreground" />
      <Label htmlFor="led-toggle" className="flex-1 text-sm font-normal">
        Blink LED
      </Label>
      <Switch
        id="led-toggle"
        checked={device.led.blinking}
        onCheckedChange={handleChange}
        disabled={disabled}
      />
    </div>
  )
}
