import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { useAuth } from '@/context/AuthContext'
import heroImage from '@/assets/login-hero.jpg'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

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
    <div className="relative isolate min-h-svh overflow-hidden bg-background text-foreground">
      {/* Background photo, kept faint so it sets a mood without competing with the form. */}
      <img
        src={heroImage}
        alt=""
        aria-hidden
        className="absolute inset-0 -z-20 size-full object-cover object-[center_40%] opacity-[0.16] saturate-[0.85] dark:opacity-30"
      />
      {/* Fade the photo into the page: solid behind the form, open on the right (desktop) or at the top (mobile). */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-linear-to-b from-background/40 via-background/85 to-background lg:bg-linear-to-r lg:from-background lg:via-background/80 lg:to-background/10"
      />

      <div className="grid min-h-svh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <section className="flex flex-col px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-6 sm:px-10">
          <header className="flex items-center justify-between">
            <BrandLogo size="sm" showText title="Power Monitor" subtitle="ESP32 Hub" glow />
            <ThemeToggle />
          </header>

          <div className="flex flex-1 items-center py-12">
            <div className="mx-auto w-full max-w-sm rounded-2xl border bg-background/70 p-6 shadow-xl shadow-black/5 backdrop-blur-xl sm:p-8 dark:bg-background/60 dark:shadow-black/40">
              <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                See whether the power’s on at home, when it last went out, and for how long.
              </p>

              <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    aria-invalid={Boolean(errors.email)}
                    className="h-11"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-pressed={showPassword}
                      className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    aria-invalid={Boolean(errors.password)}
                    className="h-11"
                    {...register('password')}
                  />
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password.message}</p>
                  )}
                </div>

                {serverError && (
                  <p
                    role="alert"
                    className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
                  >
                    <AlertCircle className="size-4 shrink-0" />
                    {serverError}
                  </p>
                )}

                <Button type="submit" disabled={isSubmitting} className="h-11 w-full text-sm">
                  {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                  {isSubmitting ? 'Signing in…' : 'Sign in'}
                </Button>
              </form>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">Only the owner’s account can sign in.</p>
        </section>

        <aside className="hidden flex-col justify-end p-10 lg:flex xl:p-16">
          <div className="max-w-lg space-y-4 rounded-3xl border border-border/40 bg-background/60 p-8 shadow-2xl backdrop-blur-xl dark:bg-background/40">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-cyan-500" />
              </span>
              <span>ESP32 Hardware Monitor</span>
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-balance xl:text-4xl text-foreground">
              Know when the power went out, and for how long.
            </h2>
            <p className="leading-relaxed text-pretty text-sm text-muted-foreground">
              An ESP32 at home checks in every few seconds. When it goes quiet, the gap is logged —
              and when it boots back up, it tells you whether that was a real power cut or just the
              Wi-Fi.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
