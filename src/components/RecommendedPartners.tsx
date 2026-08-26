import { Link } from 'react-router-dom'
import { ArrowRight, HeartHandshake } from 'lucide-react'
import { PartnerCard } from '@/components/PartnerCard'
import { Skeleton } from '@/components/ui/feedback'
import { cn } from '@/lib/cn'
import { severityAccent, severityLabels } from '@/lib/labels'
import type { PartnerRecommendation } from '@/lib/types'

interface Props {
  recommendations?: PartnerRecommendation[]
  isLoading?: boolean
  /** Muestra a qué vehículo pertenece cada alerta. Se usa en el tablero, no en el detalle. */
  showVehicle?: boolean
  className?: string
}

/**
 * Bloque "quién te lo resuelve": toma lo que está por vencerse y, para cada cosa, propone
 * aliados de la categoría que la atiende. Si no hay nada por vencer o todavía no hay aliados
 * en esa categoría, no se dibuja: un bloque vacío solo ocuparía el tablero.
 */
export function RecommendedPartners({ recommendations, isLoading, showVehicle, className }: Props) {
  if (isLoading) {
    return (
      <section className={cn('card card-pad', className)}>
        <Skeleton className="h-5 w-48" />
        <div className="mt-4 space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </section>
    )
  }

  if (!recommendations?.length) return null

  return (
    <section className={cn('card card-pad', className)}>
      <header className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <HeartHandshake className="size-[18px]" />
          </span>
          <div>
            <h3 className="text-base">Quién te lo resuelve</h3>
            <p className="text-xs text-carbon-500">Aliados para lo que se te está venciendo.</p>
          </div>
        </div>

        <Link
          to="/aliados"
          className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-brand-600 transition hover:text-brand-700 sm:flex"
        >
          Directorio
          <ArrowRight className="size-4" />
        </Link>
      </header>

      <div className="space-y-4">
        {recommendations.map((recommendation, index) => {
          const { alert, categories, partners } = recommendation

          return (
            <article key={`${alert.relatedId ?? alert.title}-${index}`}>
              <div className="flex items-center gap-2.5">
                <span className={cn('h-8 w-1 shrink-0 rounded-full', severityAccent[alert.severity])} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-carbon-900">{alert.title}</p>
                  <p className="truncate text-xs text-carbon-500">
                    {showVehicle && (
                      <span className="font-medium text-carbon-600">{alert.vehicleName} · </span>
                    )}
                    {alert.subtitle}
                  </p>
                </div>
                <span
                  className={cn(
                    'shrink-0',
                    alert.severity === 'Expired' || alert.severity === 'Critical'
                      ? 'chip-danger'
                      : 'chip-warn',
                  )}
                >
                  {severityLabels[alert.severity]}
                </span>
              </div>

              <p className="mt-2 pl-3.5 text-xs text-carbon-400">
                Lo atiende: {categories.map((category) => category.name).join(', ')}
              </p>

              <div className="mt-2 grid gap-2 pl-3.5 sm:grid-cols-2 xl:grid-cols-3">
                {partners.map((partner) => (
                  <PartnerCard key={partner.id} partner={partner} compact />
                ))}
              </div>
            </article>
          )
        })}
      </div>

      <Link to="/aliados" className="btn-ghost btn-md mt-4 w-full sm:hidden">
        Ver todo el directorio
        <ArrowRight className="size-4" />
      </Link>
    </section>
  )
}
