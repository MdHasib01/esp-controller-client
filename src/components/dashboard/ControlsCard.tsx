import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { WakeButton } from '@/components/dashboard/WakeButton'
import { CheckupToggle } from '@/components/dashboard/CheckupToggle'
import { LedToggle } from '@/components/dashboard/LedToggle'
import type { Device } from '@/lib/types'

export function ControlsCard({ device }: { device: Device }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Controls</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2.5">
        <WakeButton device={device} className="w-full" />
        <CheckupToggle device={device} className="w-full" />
        <LedToggle device={device} />
        {device.wakeTarget.label && (
          <p className="mt-auto pt-1 text-xs text-muted-foreground">
            Wake target: {device.wakeTarget.label}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
