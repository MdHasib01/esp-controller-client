import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { BellRing, Play, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { sendTestAlert } from '@/api/push'
import {
  getAlertSoundChoice,
  getAlertVolume,
  isAlertSoundEnabled,
  playAlertSound,
  previewSound,
  setAlertSoundChoice,
  setAlertSoundEnabled,
  setAlertVolume,
  SOUND_OPTIONS,
  VOLUME_OPTIONS,
  type AlertKind,
  type SoundId,
  type VolumeLevel,
} from '@/lib/alertSound'
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
  const [sounds, setSounds] = useState<Record<AlertKind, SoundId>>(() => ({
    cut: getAlertSoundChoice('cut'),
    restored: getAlertSoundChoice('restored'),
  }))
  const [volume, setVolume] = useState<VolumeLevel>(() => getAlertVolume())

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

  function chooseSound(kind: AlertKind, sound: SoundId) {
    setSounds((prev) => ({ ...prev, [kind]: sound }))
    setAlertSoundChoice(kind, sound)
    previewSound(sound, volume)
  }

  function chooseVolume(level: VolumeLevel) {
    setVolume(level)
    setAlertVolume(level)
    previewSound(sounds.cut === 'none' ? sounds.restored : sounds.cut, level)
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

        {soundOn && (
          <div className="space-y-3 rounded-lg border p-3">
            <SoundPicker
              label="Power cut sound"
              value={sounds.cut}
              volume={volume}
              onChange={(sound) => chooseSound('cut', sound)}
            />
            <SoundPicker
              label="Power back sound"
              value={sounds.restored}
              volume={volume}
              onChange={(sound) => chooseSound('restored', sound)}
            />
            <div className="flex items-center justify-between gap-3">
              <Label className="text-xs text-muted-foreground">Volume</Label>
              <Select
                items={VOLUME_OPTIONS}
                value={volume}
                onValueChange={(value) => chooseVolume(value as VolumeLevel)}
              >
                <SelectTrigger size="sm" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VOLUME_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

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

function SoundPicker({
  label,
  value,
  volume,
  onChange,
}: {
  label: string
  value: SoundId
  volume: VolumeLevel
  onChange: (sound: SoundId) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-1">
        <Select
          items={SOUND_OPTIONS}
          value={value}
          onValueChange={(next) => onChange(next as SoundId)}
        >
          <SelectTrigger size="sm" className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SOUND_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Preview ${label.toLowerCase()}`}
          disabled={value === 'none'}
          onClick={() => previewSound(value, volume)}
        >
          <Play />
        </Button>
      </div>
    </div>
  )
}
