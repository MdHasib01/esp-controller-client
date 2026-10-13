import axios, { type InternalAxiosRequestConfig } from 'axios'
import { getAccessToken, setAccessToken } from './tokenStore'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api'
export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL ?? 'ws://localhost:4000'

export const apiClient = axios.create({ baseURL: API_BASE_URL, withCredentials: true })

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  try {
    const { data } = await axios.post<{ accessToken: string }>(
      `${API_BASE_URL}/auth/refresh`,
      null,
      { withCredentials: true }
    )
    setAccessToken(data.accessToken)
    return data.accessToken
  } catch {
    setAccessToken(null)
    return null
  }
}

// One refresh at a time, shared by every caller that needs it.
function sharedRefresh(): Promise<string | null> {
  refreshPromise =
    refreshPromise ??
    refreshAccessToken().finally(() => {
      refreshPromise = null
    })
  return refreshPromise
}

function tokenExpiresAt(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

/**
 * The access token, refreshed first if it has expired or is about to — for
 * the dashboard socket, which can't ride the 401-retry below. `force`
 * refreshes regardless (the server rejected the token, e.g. a phone whose
 * clock is behind so it looked valid here).
 */
export async function getFreshAccessToken(force = false): Promise<string | null> {
  const token = getAccessToken()
  const expiresAt = token ? tokenExpiresAt(token) : null
  if (!force && token && (expiresAt === null || expiresAt - Date.now() > 30_000)) return token
  return sharedRefresh()
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as RetriableConfig | undefined
    const isAuthRoute = original?.url?.includes('/auth/')

    if (error.response?.status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true
      const token = await sharedRefresh()

      if (token) {
        original.headers.set('Authorization', `Bearer ${token}`)
        return apiClient(original)
      }
    }

    return Promise.reject(error)
  }
)
