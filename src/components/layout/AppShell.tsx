import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { History, LayoutDashboard, LogOut, Menu, Settings, Wifi, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { useDashboardSocketStatus } from '@/context/DashboardSocketContext'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/history', label: 'History', icon: History, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
]

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
      {navItems.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-secondary text-secondary-foreground'
                : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
            )
          }
        >
          <Icon className="size-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

function SocketIndicator() {
  const status = useDashboardSocketStatus()
  const isOpen = status === 'open'
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        isOpen
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
      )}
      title={isOpen ? 'Live updates connected' : 'Reconnecting to live updates…'}
    >
      {isOpen ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}
      {isOpen ? 'Live' : 'Reconnecting'}
    </div>
  )
}

export function AppShell() {
  const { logout, user } = useAuth()
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-3">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger render={<Button variant="ghost" size="icon" className="sm:hidden" />}>
                <Menu className="size-5" />
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <SheetHeader>
                  <SheetTitle>Power Monitor</SheetTitle>
                </SheetHeader>
                <div className="px-4">
                  <NavLinks onNavigate={() => setSheetOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
            <span className="font-semibold tracking-tight">Power Monitor</span>
          </div>

          <div className="hidden sm:block">
            <NavLinks />
          </div>

          <div className="flex items-center gap-2">
            <SocketIndicator />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => logout()}
              title={user?.email ? `Log out (${user.email})` : 'Log out'}
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 pb-24 sm:pb-6">
        <Outlet />
      </main>
    </div>
  )
}
