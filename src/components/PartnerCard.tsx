import { Link } from 'react-router-dom'
import { BadgeCheck, CalendarCheck, MapPin, Phone, Truck } from 'lucide-react'
import { assetUrl } from '@/lib/api'
import { cn } from '@/lib/cn'
import { CategoryIcon } from '@/features/partners/CategoryIcon'
import type { PartnerCard as Partner } from '@/lib/types'

interface Props {
  partner: Partner
  /** Versión reducida para el bloque de recomendaciones, donde el espacio es poco. */
  compact?: boolean
  className?: string
}

/** Tarjeta del aliado. Se usa igual en el directorio y en las recomendaciones. */
export function PartnerCard({ partner, compact, className }: Props) {
  const logo = assetUrl(partner.logoUrl)

  return (
    <Link
      to={`/aliados/${partner.publicSlug}`}
      className={cn(
        'group flex gap-3 rounded-2xl bg-white ring-1 ring-carbon-100 transition hover:-translate-y-px hover:ring-brand-200 hover:shadow-card',
        compact ? 'p-3' : 'p-4',
        className,
      )}
    >
      <span
        className={cn(
          'flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-carbon-50 text-carbon-500',
          compact ? 'size-11' : 'size-14',
        )}
      >
        {logo ? (
          <img src={logo} alt="" className="size-full object-cover" />
        ) : (
          <CategoryIcon
            icon={partner.categories[0]?.icon}
            className={compact ? 'size-5' : 'size-6'}
          />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-semibold text-carbon-900 group-hover:text-brand-700">
            {partner.name}
          </p>
          {partner.isVerified && (
            <BadgeCheck className="size-4 shrink-0 text-brand-600" aria-label="Aliado verificado" />
          )}
        </div>

        <p className="mt-0.5 flex items-center gap-1 text-xs text-carbon-500">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">{partner.cities.join(' · ') || 'Sin ciudad registrada'}</span>
        </p>

        {!compact && partner.description && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-carbon-500">
            {partner.description}
          </p>
        )}

        <div className="mt-2 flex flex-wrap gap-1.5">
          {partner.categories.slice(0, compact ? 2 : 3).map((category) => (
            <span key={category.id} className="chip-neutral">
              {category.name}
            </span>
          ))}
          {partner.categories.length > (compact ? 2 : 3) && (
            <span className="chip-neutral">+{partner.categories.length - (compact ? 2 : 3)}</span>
          )}
        </div>

        {!compact && (partner.acceptsAppointments || partner.offersHomeService || partner.phone) && (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-carbon-500">
            {partner.phone && (
              <span className="flex items-center gap-1">
                <Phone className="size-3.5" />
                {partner.phone}
              </span>
            )}
            {partner.acceptsAppointments && (
              <span className="flex items-center gap-1 text-brand-600">
                <CalendarCheck className="size-3.5" />
                Agenda cita
              </span>
            )}
            {partner.offersHomeService && (
              <span className="flex items-center gap-1 text-ok-600">
                <Truck className="size-3.5" />
                A domicilio
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
