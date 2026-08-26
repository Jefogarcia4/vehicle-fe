import { Link } from 'react-router-dom'
import { CalendarClock, CircleAlert, CircleDot, FileWarning, Wrench } from 'lucide-react'
import { cn } from '@/lib/cn'
import { severityAccent, severityLabels } from '@/lib/labels'
import type { AlertKind, VehicleAlert } from '@/lib/types'

const icons: Record<AlertKind, typeof CircleAlert> = {
  Document: FileWarning,
  Service: Wrench,
  Tire: CircleDot,
  Reminder: CalendarClock,
  Fine: CircleAlert,
}

interface Props {
  alerts: VehicleAlert[]
  /** Muestra a qué vehículo pertenece cada alerta. Se usa en el tablero, no en el detalle. */
  showVehicle?: boolean
  limit?: number
  className?: string
}

export function AlertList({ alerts, showVehicle, limit, className }: Props) {
  const visible = limit ? alerts.slice(0, limit) : alerts

  return (
    <ul className={cn('space-y-2', className)}>
      {visible.map((alert, index) => {
        const Icon = icons[alert.kind] ?? CircleAlert
        const isOverdue = alert.severity === 'Expired'

        return (
          <li key={`${alert.relatedId ?? alert.title}-${index}`}>
            <Link
              to={`/app/vehiculos/${alert.vehicleId}`}
              className={cn(
                'group flex items-center gap-3 rounded-2xl bg-white px-4 py-3 ring-1 transition',
                isOverdue ? 'ring-danger-100 hover:ring-danger-200' : 'ring-carbon-100 hover:ring-brand-200',
              )}
            >
              <span className={cn('h-9 w-1 shrink-0 rounded-full', severityAccent[alert.severity])} />

              <span
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-xl',
                  isOverdue ? 'bg-danger-50 text-danger-600' : 'bg-carbon-50 text-carbon-500',
                )}
              >
                <Icon className="size-[18px]" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-carbon-900">{alert.title}</p>
                <p className="truncate text-xs text-carbon-500">
                  {showVehicle && <span className="font-medium text-carbon-600">{alert.vehicleName} · </span>}
                  {alert.subtitle}
                </p>
              </div>

              <span
                className={cn(
                  'hidden shrink-0 sm:inline-flex',
                  isOverdue || alert.severity === 'Critical' ? 'chip-danger' : 'chip-warn',
                )}
              >
                {severityLabels[alert.severity]}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
