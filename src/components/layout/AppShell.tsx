import { NavLink, Outlet } from 'react-router-dom'
import { History, LayoutDashboard, LogOut, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { useDashboardSocketStatus } from '@/context/DashboardSocketContext'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/history', label: 'History', icon: History, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
]

function DesktopNav() {
  return (
    <nav className="hidden items-center gap-1 rounded-full bg-muted/70 p-1 md:flex">
      {navItems.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
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

function BottomTabBar() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      aria-label="Main"
    >
      <div className="mx-auto grid max-w-md grid-cols-3 px-2">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'group flex flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors',
                isActive ? 'text-foreground' : 'text-muted-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'flex h-8 w-14 items-center justify-center rounded-full transition-all',
                    isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'group-active:bg-muted'
                  )}
                >
                  <Icon className="size-5" strokeWidth={isActive ? 2.25 : 1.75} />
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

function SocketIndicator() {
  const status = useDashboardSocketStatus()
  const isOpen = status === 'open'
  return (
    <div
      className="flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground"
      title={isOpen ? 'Live updates connected' : 'Reconnecting to live updates…'}
    >
      <span className="relative flex size-2">
        {isOpen && (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-status-good opacity-60" />
        )}
        <span
          className={cn(
            'relative inline-flex size-2 rounded-full',
            isOpen ? 'bg-status-good' : 'bg-status-warning'
          )}
        />
      </span>
      {isOpen ? 'Live' : 'Reconnecting'}
    </div>
  )
}

export function AppShell() {
  const { logout, user } = useAuth()

  return (
    <div className="min-h-svh bg-muted/40 dark:bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-2.5">
            <BrandLogo size="sm" showText title="Power Monitor" subtitle="ESP32 Hub" glow={false} />
          </div>

          <DesktopNav />

          <div className="flex items-center gap-1.5">
            <SocketIndicator />
            <ThemeToggle />
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

      {/* Bottom padding clears the mobile tab bar (plus the home-indicator inset). */}
      <main className="mx-auto max-w-6xl px-4 py-5 pb-[calc(6rem+env(safe-area-inset-bottom))] md:py-8 md:pb-10">
        <Outlet />
      </main>

      <BottomTabBar />
    </div>
  )
}
