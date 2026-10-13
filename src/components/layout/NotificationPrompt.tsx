import { useState } from 'react'
import { toast } from 'sonner'
import { BellRing, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { enablePush } from '@/lib/pushNotifications'

const DISMISS_KEY = 'notification-prompt-dismissed'

function wasDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === 'true'
  } catch {
    return false
  }
}

/**
 * Asks for browser notification permission until it's been answered.
 * Permission alone is enough for native alerts while the dashboard is open;
 * push (alerts with the tab closed) is set up on top of it when possible.
 */
export function NotificationPrompt() {
  const [visible, setVisible] = useState(
    () => 'Notification' in window && Notification.permission === 'default' && !wasDismissed()
  )
  const [busy, setBusy] = useState(false)

  if (!visible) return null

  async function turnOn() {
    setBusy(true)
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      try {
        await enablePush()
        toast.success('Notifications on — you’ll be alerted even with this tab closed')
      } catch (err) {
        toast.warning('Notifications on while the dashboard is open', {
          description: `Background push couldn't be set up: ${err instanceof Error ? err.message : err}`,
        })
      }
    } else if (permission === 'denied') {
      toast.error('Notifications are blocked — allow them in your browser’s site settings')
    }
    setBusy(false)
    setVisible(Notification.permission === 'default')
  }

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, 'true')
    } catch {
      // storage blocked — the banner will just come back next visit
    }
    setVisible(false)
  }

  return (
    <div className="mb-5 flex items-center gap-3 rounded-xl border bg-background p-3 shadow-sm">
      <BellRing className="size-5 shrink-0 text-primary" />
      <p className="flex-1 text-sm">
        Get a notification when the power goes out and when it comes back.
      </p>
      <Button size="sm" onClick={turnOn} disabled={busy}>
        Turn on
      </Button>
      <Button variant="ghost" size="icon" onClick={dismiss} title="Not now">
        <X className="size-4" />
      </Button>
    </div>
  )
}
