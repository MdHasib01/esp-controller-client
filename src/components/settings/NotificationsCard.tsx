import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { BellRing, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { sendTestAlert } from '@/api/push'
import { isAlertSoundEnabled, playAlertSound, setAlertSoundEnabled } from '@/lib/alertSound'
import {
  disablePush,
  enablePush,
  getPushSupport,
  syncPush,
  type PushSupport,
} from '@/lib/pushNotifications'

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong'
}

export function NotificationsCard() {
  const [support, setSupport] = useState<PushSupport>(() => getPushSupport())
  const [pushOn, setPushOn] = useState(false)
  const [pushBusy, setPushBusy] = useState(true)
  const [soundOn, setSoundOn] = useState(() => isAlertSoundEnabled())

  useEffect(() => {
    syncPush()
      .then(setPushOn)
      .finally(() => setPushBusy(false))
  }, [])

  async function togglePush(next: boolean) {
    setPushBusy(true)
    try {
      if (next) {
        await enablePush()
        toast.success('Push notifications enabled on this device')
      } else {
        await disablePush()
        toast('Push notifications turned off on this device')
      }
      setPushOn(next)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSupport(getPushSupport())
      setPushBusy(false)
    }
  }

  function toggleSound(next: boolean) {
    setSoundOn(next)
    setAlertSoundEnabled(next)
    if (next) playAlertSound('restored', { force: true })
  }

  // The alert itself (sound + toast here, push on every subscribed device)
  // arrives back over the dashboard socket, exactly like a real outage.
  async function sendTest(kind: 'cut' | 'restored') {
    try {
      const { pushEnabled, subscriptions } = await sendTestAlert(kind)
      if (!pushEnabled) toast.warning('Push is not configured on the server — VAPID keys are missing')
      else if (!subscriptions) toast.warning('No device has push turned on yet')
    } catch {
      toast.error('Failed to send test alert')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>
          Get alerted once when the power goes out and once when it comes back, with the time.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="push-toggle" className="flex items-center gap-2">
              <BellRing className="size-4" /> Push notifications
            </Label>
            <p className="text-xs text-muted-foreground">
              {support === 'unsupported'
                ? "This browser doesn't support push. On iPhone, add this site to your Home Screen first, then enable it from there."
                : support === 'denied'
                  ? 'Notifications are blocked for this site — allow them in your browser settings.'
                  : 'Arrive even when this tab is closed. Enable on each phone or computer you want alerted.'}
            </p>
          </div>
          <Switch
            id="push-toggle"
            checked={pushOn}
            disabled={pushBusy || support !== 'supported'}
            onCheckedChange={togglePush}
          />
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="sound-toggle" className="flex items-center gap-2">
              <Volume2 className="size-4" /> Alert sound
            </Label>
            <p className="text-xs text-muted-foreground">
              Plays an alarm on power cut and a chime when power is back, while the dashboard is
              open.
            </p>
          </div>
          <Switch id="sound-toggle" checked={soundOn} onCheckedChange={toggleSound} />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => sendTest('cut')}>
            Test power cut alert
          </Button>
          <Button variant="outline" size="sm" onClick={() => sendTest('restored')}>
            Test power back alert
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Sends a test alert to every device with push on, and plays the sound here.
        </p>
      </CardContent>
    </Card>
  )
}
