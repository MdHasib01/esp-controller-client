import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/context/AuthContext'
import { DashboardSocketProvider } from '@/context/DashboardSocketContext'
import { AppRoutes } from '@/routes'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 10_000 } },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DashboardSocketProvider>
          <AppRoutes />
          <Toaster mobileOffset={{ bottom: 96 }} />
        </DashboardSocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
