import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface BrandLogoProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  title?: string
  subtitle?: string
  glow?: boolean
}

const sizeMap = {
  sm: 'size-7',
  md: 'size-9',
  lg: 'size-11',
  xl: 'size-14',
}

export function BrandLogo({
  size = 'md',
  showText = false,
  title,
  subtitle,
  glow = true,
  className,
  ...props
}: BrandLogoProps) {
  return (
    <div className={cn('inline-flex items-center gap-3 select-none', className)} {...props}>
      <div
        className={cn(
          'relative flex items-center justify-center shrink-0 rounded-2xl overflow-hidden transition-transform duration-300 hover:scale-105',
          sizeMap[size],
          glow && 'shadow-[0_0_20px_rgba(6,182,212,0.35)]'
        )}
      >
        <svg
          viewBox="0 0 512 512"
          className="size-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="brandBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#070c18" />
              <stop offset="50%" stopColor="#0a1224" />
              <stop offset="100%" stopColor="#050812" />
            </linearGradient>

            <linearGradient id="brandBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.6" />
            </linearGradient>

            <linearGradient id="brandCyanNeon" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5bfaff" />
              <stop offset="50%" stopColor="#00e5ff" />
              <stop offset="100%" stopColor="#0091ff" />
            </linearGradient>

            <linearGradient id="brandPulsePin" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#5bfaff" />
              <stop offset="100%" stopColor="#00b4d8" />
            </linearGradient>

            <radialGradient id="brandAmbientGlow" cx="50%" cy="52%" r="45%">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.4" />
              <stop offset="60%" stopColor="#0284c7" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>

            <filter id="brandNeonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="10" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="brandCoreGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="18" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Squircle Tile */}
          <rect
            x="16"
            y="16"
            width="480"
            height="480"
            rx="116"
            fill="url(#brandBgGrad)"
            stroke="url(#brandBorderGrad)"
            strokeWidth="10"
          />

          {/* Ambient Glow */}
          <circle cx="256" cy="270" r="190" fill="url(#brandAmbientGlow)" />

          {/* Microchip / Circuit Traces */}
          <g
            stroke="#00f0ff"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.5"
            filter="url(#brandNeonGlow)"
          >
            <path d="M 120 200 L 80 200 L 64 216" strokeWidth="6" />
            <circle cx="64" cy="216" r="6" fill="#00f0ff" stroke="none" />

            <path d="M 110 270 L 60 270" strokeWidth="7" />
            <circle cx="56" cy="270" r="7" fill="#00f0ff" stroke="none" />

            <path d="M 126 340 L 86 340 L 72 354" strokeWidth="6" />
            <circle cx="72" cy="354" r="6" fill="#00f0ff" stroke="none" />

            <path d="M 392 200 L 432 200 L 448 216" strokeWidth="6" />
            <circle cx="448" cy="216" r="6" fill="#00f0ff" stroke="none" />

            <path d="M 402 270 L 452 270" strokeWidth="7" />
            <circle cx="456" cy="270" r="7" fill="#00f0ff" stroke="none" />

            <path d="M 386 340 L 426 340 L 440 354" strokeWidth="6" />
            <circle cx="440" cy="354" r="6" fill="#00f0ff" stroke="none" />

            <path d="M 170 120 L 150 100 L 110 100" strokeWidth="6" />
            <circle cx="106" cy="100" r="6" fill="#00f0ff" stroke="none" />

            <path d="M 342 120 L 362 100 L 402 100" strokeWidth="6" />
            <circle cx="406" cy="100" r="6" fill="#00f0ff" stroke="none" />
          </g>

          {/* High-Power Glow Underlayer */}
          <g filter="url(#brandCoreGlow)" opacity="0.85">
            <path
              d="M 334 186 A 118 118 0 1 1 178 186"
              stroke="#00f0ff"
              strokeWidth="34"
              strokeLinecap="round"
            />
            <line
              x1="256"
              y1="126"
              x2="256"
              y2="260"
              stroke="#5bfaff"
              strokeWidth="34"
              strokeLinecap="round"
            />
          </g>

          {/* Crisp Foreground Power Symbol */}
          <g>
            <path
              d="M 334 186 A 118 118 0 1 1 178 186"
              stroke="url(#brandCyanNeon)"
              strokeWidth="32"
              strokeLinecap="round"
            />
            <line
              x1="256"
              y1="126"
              x2="256"
              y2="260"
              stroke="url(#brandPulsePin)"
              strokeWidth="32"
              strokeLinecap="round"
            />
            <circle cx="256" cy="126" r="8" fill="#ffffff" />
            <circle cx="256" cy="270" r="14" fill="#5bfaff" opacity="0.9" />
            <circle cx="256" cy="270" r="6" fill="#ffffff" />
          </g>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="font-bold tracking-wider text-sm leading-tight uppercase text-foreground">
            {title ?? 'PC Boot Control'}
          </span>
          <span className="text-[11px] text-muted-foreground leading-tight">
            {subtitle ?? 'ESP32 Workstation Hub'}
          </span>
        </div>
      )}
    </div>
  )
}
