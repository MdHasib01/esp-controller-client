import { apiClient } from './client'

export interface User {
  id: string
  email: string
}

export async function login(email: string, password: string) {
  const { data } = await apiClient.post<{ accessToken: string; user: User }>('/auth/login', {
    email,
    password,
  })
  return data
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout')
}

export async function fetchMe(): Promise<User> {
  const { data } = await apiClient.get<{ user: User }>('/auth/me')
  return data.user
}

export async function refreshSession(): Promise<string> {
  const { data } = await apiClient.post<{ accessToken: string }>('/auth/refresh')
  return data.accessToken
}
