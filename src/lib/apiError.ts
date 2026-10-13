import { isAxiosError } from 'axios'

/** The backend's `{ error }` message when there is one, else the fallback. */
export function apiErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err) && typeof err.response?.data?.error === 'string') {
    return err.response.data.error
  }
  return fallback
}
