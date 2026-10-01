import type { ConnectionEndReason } from '@/lib/types'

export const END_REASON_LABEL: Record<ConnectionEndReason, string> = {
  planned_restart: 'Scheduled restart',
  timeout: 'Went silent',
  replaced: 'Reconnected',
  disconnected: 'Disconnected',
  server_restart: 'Server restarted',
}

export const END_REASON_HINT: Record<ConnectionEndReason, string> = {
  planned_restart: 'Board announced its 5-minute anti-freeze reboot',
  timeout: 'No heartbeat — likely a power cut or network loss',
  replaced: 'Board came back before the old session timed out',
  disconnected: 'Socket closed',
  server_restart: 'The server restarted while this session was open',
}

const RESET_REASON_LABEL: Record<string, string> = {
  power_on: 'Power on',
  brownout: 'Brownout',
  software: 'Scheduled restart',
  watchdog: 'Watchdog reset',
  panic: 'Crash',
  external: 'Reset button',
  deep_sleep: 'Deep sleep wake',
  unknown: 'Unknown',
}

export function resetReasonLabel(reason: string | null): string {
  if (!reason) return '—'
  return RESET_REASON_LABEL[reason] ?? reason
}

// A power-on or brownout boot means the board itself lost power.
export function isPowerLossBoot(reason: string | null): boolean {
  return reason === 'power_on' || reason === 'brownout'
}
