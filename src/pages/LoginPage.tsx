import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Power,
  Cpu,
  Wifi,
  ShieldCheck,
  Activity,
  ArrowRight,
  Radio,
  Sparkles,
  Loader2,
  AlertCircle,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
      setServerError('Invalid email or password')
    }
  }

  return (
    <div className="min-h-svh w-full bg-zinc-950 text-zinc-100 flex flex-col lg:grid lg:grid-cols-12 overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Left Column: Modern Authentication Console */}
      <div className="lg:col-span-5 xl:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 relative z-10 border-b lg:border-b-0 lg:border-r border-white/10 bg-zinc-950/95 backdrop-blur-xl">
        {/* Ambient background glows */}
        <div className="pointer-events-none absolute -top-28 -left-28 size-96 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-28 size-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px]" />

        {/* Top Header / Branding */}
        <div className="relative z-10 flex items-center justify-between pb-8 sm:pb-12">
          <div className="flex items-center gap-3">
            <div className="relative flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-transparent border border-cyan-500/30 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)]">
              <Power className="size-5" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-widest text-white uppercase flex items-center gap-1.5">
                PC Boot Control
              </div>
              <p className="text-xs text-zinc-400">ESP32 Workstation Hub</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            <span>Online</span>
          </div>
        </div>

        {/* Center: Sign In Form */}
        <div className="relative z-10 mx-auto w-full max-w-sm py-4 lg:py-8">
          <div className="mb-6 space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-cyan-300">
              <Sparkles className="size-3 text-cyan-400" />
              <span>SECURE ACCESS CONSOLE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Welcome back
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Sign in to manage workstation power states, automated wake schedules, and live telemetry.
            </p>
          </div>

          {serverError && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive animate-in fade-in duration-200">
              <AlertCircle className="size-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {/* Email Field */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-zinc-300">
                Email address
              </Label>
              <div className="group relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400 group-focus-within:text-cyan-400 transition-colors">
                  <Mail className="size-4" />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@pccontrol.local"
                  autoComplete="email"
                  className="h-11 rounded-xl border-white/10 bg-white/[0.04] pl-10 pr-3 text-sm text-white placeholder:text-zinc-500 focus-visible:border-cyan-500/60 focus-visible:ring-2 focus-visible:ring-cyan-500/25 transition-all"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-medium text-zinc-300">
                  Password
                </Label>
                <span className="text-[11px] text-zinc-500 font-mono">Protected by JWT</span>
              </div>
              <div className="group relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400 group-focus-within:text-cyan-400 transition-colors">
                  <Lock className="size-4" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="h-11 rounded-xl border-white/10 bg-white/[0.04] pl-10 pr-10 text-sm text-white placeholder:text-zinc-500 focus-visible:border-cyan-500/60 focus-visible:ring-2 focus-visible:ring-cyan-500/25 transition-all"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-zinc-400 hover:text-white transition-colors focus-visible:outline-none"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 h-11 w-full rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:via-sky-400 hover:to-blue-500 text-white font-semibold text-sm shadow-[0_0_20px_rgba(6,182,212,0.35)] hover:shadow-[0_0_28px_rgba(6,182,212,0.5)] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer border-0"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin text-white" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign in to Dashboard</span>
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>

          {/* Quick Hardware Spec Pills */}
          <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 flex flex-col items-center gap-1">
              <Cpu className="size-3.5 text-cyan-400" />
              <span className="text-[10px] text-zinc-400 font-medium">ESP32 Dual Core</span>
            </div>
            <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 flex flex-col items-center gap-1">
              <Wifi className="size-3.5 text-sky-400" />
              <span className="text-[10px] text-zinc-400 font-medium">2.4GHz Wi-Fi</span>
            </div>
            <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 flex flex-col items-center gap-1">
              <ShieldCheck className="size-3.5 text-emerald-400" />
              <span className="text-[10px] text-zinc-400 font-medium">Isolated Relay</span>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="relative z-10 pt-8 flex items-center justify-between text-xs text-zinc-500 border-t border-white/5">
          <div className="flex items-center gap-2">
            <Zap className="size-3.5 text-cyan-400" />
            <span>Power & Boot Daemon v2.4</span>
          </div>
          <span>TLS 1.3 • FreeRTOS</span>
        </div>
      </div>

      {/* Right Column: High-Tech Battlestation Showcase */}
      <div className="lg:col-span-7 xl:col-span-7 p-4 sm:p-6 lg:p-8 xl:p-10 flex flex-col justify-between relative bg-zinc-950 overflow-hidden min-h-[500px] lg:min-h-svh">
        <div className="relative h-full w-full rounded-2xl lg:rounded-3xl overflow-hidden border border-white/15 shadow-2xl flex flex-col justify-between p-6 sm:p-8 lg:p-10 group">
          {/* Main Visual Image */}
          <img
            src={heroImage}
            onError={(e) => {
              e.currentTarget.src = '/login-hero.jpg'
            }}
            alt="PC Boot Control Battlestation"
            className="absolute inset-0 h-full w-full object-cover object-center transform transition-transform duration-1000 ease-out group-hover:scale-[1.02]"
          />

          {/* Moody Vignette & Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/95 via-zinc-950/40 to-zinc-950/20 pointer-events-none" />
          <div className="absolute inset-0 bg-cyan-950/10 mix-blend-color pointer-events-none" />

          {/* Top Floating Glass Badges */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2.5 rounded-xl border border-white/20 bg-zinc-900/75 px-3.5 py-2 text-xs text-white shadow-xl backdrop-blur-md">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-cyan-400" />
              </span>
              <span className="font-semibold tracking-wider text-cyan-300 uppercase">
                ESP32 CONTROLLER
              </span>
              <span className="text-white/20">|</span>
              <span className="font-mono text-zinc-300 text-[11px]">OPTICAL RELAY ARMED</span>
            </div>

            <div className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-zinc-900/75 px-3.5 py-2 text-xs text-zinc-300 shadow-xl backdrop-blur-md">
              <Activity className="size-3.5 text-emerald-400" />
              <span>
                Telemetry: <strong className="text-white font-mono">60 Hz</strong>
              </span>
            </div>
          </div>

          {/* Bottom Floating Glassmorphism Telemetry Card */}
          <div className="relative z-10 rounded-2xl border border-white/15 bg-zinc-900/80 p-6 sm:p-7 text-white shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wider text-cyan-400 uppercase">
              <Radio className="size-3.5 animate-pulse" />
              <span>Next-Gen Workstation Remote Boot</span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white mb-2">
              Hardware-Level Control from Anywhere
            </h2>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-4 max-w-xl">
              Power on, force restart, or safely sleep your desktop through isolated optocoupler relays.
              Integrated continuous power telemetry and instant low-latency WebSocket communication.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-zinc-200">
                <Power className="size-3 text-cyan-400" />
                <span>Cold Boot & Power Rail Monitor</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-zinc-200">
                <Wifi className="size-3 text-sky-400" />
                <span>Zero-Lag WebSocket Bridge</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-zinc-200">
                <ShieldCheck className="size-3 text-emerald-400" />
                <span>Hardware Optocoupler Safe</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
