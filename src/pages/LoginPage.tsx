import { useState, type ComponentProps, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  History,
  Loader2,
  Lock,
  Mail,
  Power,
  Timer,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import heroImage from '@/assets/login-hero.jpg'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Timer,
    title: 'Live status timer',
    body: 'Connected, unreachable or power cut — counting from the second it changed.',
  },
  {
    icon: History,
    title: 'Every outage on record',
    body: 'How often the power went, and exactly how long each cut lasted.',
  },
  {
    icon: Power,
    title: 'Wake your PC remotely',
    body: 'Send a Wake-on-LAN signal through the ESP32 from anywhere.',
  },
]

/** Input with a leading icon and an optional trailing control. */
function IconInput({
  icon: Icon,
  trailing,
  className,
  ...props
}: ComponentProps<typeof Input> & { icon: LucideIcon; trailing?: ReactNode }) {
  return (
    <div className="group relative">
      <Icon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-cyan-600 dark:group-focus-within:text-cyan-400" />
      <Input
        className={cn(
          'h-12 rounded-xl border-border/70 bg-background/60 pl-10 text-sm shadow-xs transition-[border-color,box-shadow,background-color] focus-visible:border-cyan-500/60 focus-visible:bg-background focus-visible:ring-4 focus-visible:ring-cyan-500/15 dark:bg-white/[0.03] dark:focus-visible:bg-white/[0.05]',
          trailing && 'pr-11',
          className,
        )}
        {...props}
      />
      {trailing && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-1.5">{trailing}</div>
      )}
    </div>
  )
}

export function LoginPage() {
  const { login, status } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  if (status === 'authenticated') {
    const redirectTo = (location.state as { from?: string } | null)?.from ?? '/'
    return <Navigate to={redirectTo} replace />
  }

  async function onSubmit(values: LoginForm) {
    setServerError(null)
    try {
      await login(values.email, values.password)
      navigate('/', { replace: true })
    } catch {
      setServerError('That email and password don’t match.')
    }
  }

  return (
    <div className="grid min-h-svh bg-background text-foreground lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Left: the sign-in form, nothing else. */}
      <section className="flex flex-col px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-10 xl:px-14">
        <header className="flex items-center justify-between">
          <BrandLogo size="sm" showText title="Power Monitor" subtitle="ESP32 Hub" glow />
          <ThemeToggle />
        </header>

        <div className="flex flex-1 items-center py-10">
          <div className="mx-auto w-full max-w-sm animate-in duration-700 fade-in slide-in-from-bottom-4">
            <div className="space-y-2">
              <h1 className="text-3xl leading-tight font-semibold tracking-tight">Welcome back</h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Sign in to see whether the power’s on at home — and how long it’s been.
              </p>
            </div>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">
                  Email
                </Label>
                <IconInput
                  id="email"
                  icon={Mail}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  aria-invalid={Boolean(errors.email)}
                  {...register('email')}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">
                  Password
                </Label>
                <IconInput
                  id="password"
                  icon={Lock}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Your password"
                  aria-invalid={Boolean(errors.password)}
                  trailing={
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                      className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  }
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              {serverError && (
                <p
                  role="alert"
                  className="flex animate-in items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-3.5 py-3 text-sm text-destructive duration-200 fade-in slide-in-from-top-1"
                >
                  <AlertCircle className="size-4 shrink-0" />
                  {serverError}
                </p>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="group mt-2 h-12 w-full rounded-xl text-sm font-semibold shadow-lg shadow-black/10 transition-all active:scale-[0.99] dark:shadow-black/40"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </Button>
            </form>

            <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="size-3" />
              Only the owner’s account can sign in.
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground/80">
          © {new Date().getFullYear()} Power Monitor
        </p>
      </section>

      {/* Right: the photo in its own panel, with the pitch over a dark fade.
          The photo is dark in both themes, so the text here is always light. */}
      <aside className="relative m-3 ml-0 hidden overflow-hidden rounded-3xl bg-zinc-900 lg:block">
        <img
          src={heroImage}
          alt=""
          aria-hidden
          className="absolute inset-0 size-full animate-in object-cover object-[center_40%] duration-1000 fade-in zoom-in-[1.03]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-black/10"
        />

        <div className="relative flex h-full flex-col justify-end p-10 text-white xl:p-14">
          <div className="max-w-lg animate-in delay-150 duration-700 fill-mode-backwards fade-in slide-in-from-bottom-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-cyan-200 uppercase backdrop-blur-md">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-cyan-300 opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-cyan-400" />
              </span>
              ESP32 power monitor
            </div>

            <h2 className="mt-5 text-4xl font-semibold tracking-tight text-balance xl:text-5xl">
              Know when the power went out, and for how long.
            </h2>

            <ul className="mt-8 grid gap-4 xl:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, body }) => (
                <li
                  key={title}
                  className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-md"
                >
                  <Icon className="size-4 text-cyan-300" />
                  <p className="mt-3 text-sm font-medium">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/65">{body}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>
    </div>
  )
}
