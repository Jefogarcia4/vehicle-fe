import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

interface Props {
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
  backTo?: string
  backLabel?: string
}

export function PageHeader({ title, subtitle, actions, backTo, backLabel = 'Volver' }: Props) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {backTo && (
          <Link
            to={backTo}
            className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-carbon-500 transition hover:text-brand-600"
          >
            <ChevronLeft className="size-4" />
            {backLabel}
          </Link>
        )}
        <h1 className="truncate text-2xl sm:text-3xl">{title}</h1>
        {subtitle && <div className="mt-1 text-sm text-carbon-500">{subtitle}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  )
}
