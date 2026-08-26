import type { ReactNode } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('size-5 animate-spin text-brand-600', className)} />
}

/** Bloque de carga con altura estable, para que la página no salte al llegar los datos. */
export function Loading({ label = 'Cargando...', className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-3 py-16 text-sm text-carbon-500', className)}>
      <Spinner />
      {label}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-danger-50 px-6 py-10 text-center">
      <AlertTriangle className="size-8 text-danger-500" />
      <p className="text-sm font-medium text-danger-700">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-ghost btn-sm">
          Reintentar
        </button>
      )}
    </div>
  )
}

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-3xl border border-dashed border-carbon-200 px-6 py-14 text-center',
        className,
      )}
    >
      {icon && (
        <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          {icon}
        </span>
      )}
      <div>
        <h4 className="text-base">{title}</h4>
        {description && <p className="mx-auto mt-1 max-w-sm text-sm text-carbon-500">{description}</p>}
      </div>
      {action}
    </div>
  )
}

/** Bloque gris animado que ocupa el espacio del contenido mientras carga. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-carbon-100', className)} />
}
