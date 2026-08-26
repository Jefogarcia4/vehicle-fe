import { Link } from 'react-router-dom'
import { ChevronRight, Gauge, ShieldAlert } from 'lucide-react'
import { VehicleAvatar } from '@/components/VehicleAvatar'
import { HealthRing } from '@/components/ui/indicators'
import { cn } from '@/lib/cn'
import { distance, plate as formatPlate, relativeDays } from '@/lib/format'
import { roleLabels } from '@/lib/labels'
import type { VehicleListItem } from '@/lib/types'

export function VehicleCard({ vehicle, className }: { vehicle: VehicleListItem; className?: string }) {
  return (
    <Link
      to={`/app/vehiculos/${vehicle.id}`}
      className={cn(
        'card card-pad group flex items-center gap-4 transition hover:-translate-y-0.5 hover:shadow-float',
        className,
      )}
    >
      <VehicleAvatar type={vehicle.type} photoUrl={vehicle.photoUrl} name={vehicle.nickname} size="lg" />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-lg">{vehicle.nickname}</h3>
          {!vehicle.isOwner && <span className="chip-neutral">{roleLabels[vehicle.role]}</span>}
        </div>

        <p className="truncate text-sm text-carbon-500">
          {vehicle.brand} {vehicle.model} {vehicle.year} · {formatPlate(vehicle.plate)}
        </p>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-carbon-500">
          <span className="inline-flex items-center gap-1.5">
            <Gauge className="size-3.5" />
            {distance(vehicle.currentOdometer, vehicle.distanceUnit)}
          </span>

          {vehicle.nextAlertLabel ? (
            <span className="inline-flex min-w-0 items-center gap-1.5 font-medium text-danger-600">
              <ShieldAlert className="size-3.5 shrink-0" />
              <span className="truncate">
                {vehicle.nextAlertLabel}
                {vehicle.nextAlertDays != null && ` · ${relativeDays(vehicle.nextAlertDays)}`}
              </span>
            </span>
          ) : (
            <span className="font-medium text-ok-600">Todo al día</span>
          )}
        </div>
      </div>

      <div className="hidden shrink-0 items-center gap-2 sm:flex">
        <HealthRing score={vehicle.healthScore} size={64} strokeWidth={6} showLabel={false} />
        <ChevronRight className="size-5 text-carbon-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500" />
      </div>
    </Link>
  )
}
