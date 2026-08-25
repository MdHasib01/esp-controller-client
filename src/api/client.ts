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

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as RetriableConfig | undefined
    const isAuthRoute = original?.url?.includes('/auth/')

    if (error.response?.status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true
      refreshPromise = refreshPromise ?? refreshAccessToken()
      const token = await refreshPromise
      refreshPromise = null

      if (token) {
        original.headers.set('Authorization', `Bearer ${token}`)
        return apiClient(original)
      }
    }

    return Promise.reject(error)
  }
)
