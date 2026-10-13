import { apiClient } from './client'

export interface PushConfig {
  enabled: boolean
  publicKey: string | null
  // env vars the server is missing; absent on backends deployed before it existed
  missing?: string[]
}

export async function getPushPublicKey(): Promise<PushConfig> {
  const { data } = await apiClient.get<PushConfig>('/push/public-key')
  return data
}

export async function savePushSubscription(subscription: PushSubscriptionJSON): Promise<void> {
  await apiClient.post('/push/subscribe', subscription)
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  await apiClient.post('/push/unsubscribe', { endpoint })
}

/** Fires a fake power alert through the real pipeline (push + dashboard sound/toast). */
export async function sendTestAlert(
  kind: 'cut' | 'restored'
): Promise<{ pushEnabled: boolean; subscriptions: number }> {
  const { data } = await apiClient.post<{ pushEnabled: boolean; subscriptions: number }>(
    '/push/test',
    { kind }
  )
  return data
}
