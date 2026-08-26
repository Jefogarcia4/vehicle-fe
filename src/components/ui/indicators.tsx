import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { healthTone } from '@/lib/labels'

interface HealthRingProps {
  score: number
  size?: number
  strokeWidth?: number
  showLabel?: boolean
  className?: string
}

/**
 * Anillo del puntaje de salud. Es el indicador principal de la app: resume en un número si el
 * vehículo está al día, y su color repite la escala de urgencia usada en las alertas.
 */
export function HealthRing({
  score,
  size = 88,
  strokeWidth = 8,
  showLabel = true,
  className,
}: HealthRingProps) {
  const tone = healthTone(score)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.max(0, Math.min(100, score)) / 100)

  return (
    <div className={cn('relative shrink-0', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="fill-none stroke-carbon-100"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn('fill-none transition-[stroke-dashoffset] duration-700', tone.ring)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('font-display font-bold leading-none', tone.text)} style={{ fontSize: size / 3.4 }}>
          {score}
        </span>
        {showLabel && <span className="mt-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-carbon-400">salud</span>}
      </div>
    </div>
  )
}

interface ProgressBarProps {
  /** Porcentaje consumido. Por encima de 100 se muestra lleno pero en rojo. */
  percent: number
  className?: string
  tone?: 'auto' | 'brand'
}

/** Barra de progreso de un intervalo de mantenimiento o de la vida de unas llantas. */
export function ProgressBar({ percent, className, tone = 'auto' }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percent))

  const color =
    tone === 'brand'
      ? 'bg-brand-500'
      : percent >= 100
        ? 'bg-danger-500'
        : percent >= 90
          ? 'bg-danger-400'
          : percent >= 75
            ? 'bg-warn-500'
            : 'bg-ok-500'

  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-carbon-100', className)}>
      <div className={cn('h-full rounded-full transition-[width] duration-700', color)} style={{ width: `${clamped}%` }} />
    </div>
  )
}

interface StatTileProps {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon?: ReactNode
  tone?: 'default' | 'ok' | 'warn' | 'danger' | 'brand'
  className?: string
}

const tones: Record<NonNullable<StatTileProps['tone']>, string> = {
  default: 'bg-carbon-50 text-carbon-600',
  ok: 'bg-ok-50 text-ok-600',
  warn: 'bg-warn-50 text-warn-600',
  danger: 'bg-danger-50 text-danger-600',
  brand: 'bg-brand-50 text-brand-600',
}

/** Cifra suelta con su etiqueta. Se repite en tablero, combustible y costos. */
export function StatTile({ label, value, hint, icon, tone = 'default', className }: StatTileProps) {
  return (
    <div className={cn('card card-pad flex items-start gap-4', className)}>
      {icon && <span className={cn('flex size-10 items-center justify-center rounded-xl', tones[tone])}>{icon}</span>}
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-carbon-400">{label}</p>
        <p className="mt-1 truncate font-display text-2xl font-semibold text-carbon-900">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-carbon-500">{hint}</p>}
      </div>
    </div>
  )
}
