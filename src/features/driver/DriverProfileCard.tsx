import {
  BadgeCheck,
  CalendarClock,
  CircleAlert,
  History,
  IdCard,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState, Loading } from '@/components/ui/feedback'
import { cn } from '@/lib/cn'
import { date as formatDate, relativeDays } from '@/lib/format'
import { useDriverProfile } from '@/features/vehicles/lookupHooks'
import type { DriverProfile } from '@/lib/types'

/**
 * El conductor: sus categorías, los certificados que las respaldan y sus trámites.
 *
 * Vive en el perfil y no en la ficha de un vehículo porque no es del vehículo: quien tiene tres
 * carros tiene una sola licencia. Los datos los trae la consulta por placa —el registro la
 * resuelve por documento de la persona—, así que mientras no se haya consultado ninguna placa
 * esto está vacío y se explica por qué en vez de dejar la sección muda.
 */
export function DriverProfileCard() {
  const { data: driver, isLoading, isError, refetch } = useDriverProfile()

  if (isLoading) return <Loading />

  // Un fallo de red no es "no tienes licencia": decirlo así hace que el usuario crea que perdió
  // sus datos cuando lo único que pasó es que el servidor no contestó.
  if (isError) {
    return (
      <section className="card card-pad">
        <EmptyState
          icon={<CircleAlert className="size-6" />}
          title="No pudimos cargar tu licencia"
          description="El servidor no respondió. Tus datos siguen guardados; vuelve a intentarlo."
          action={
            <button type="button" className="btn-ghost btn-md" onClick={() => refetch()}>
              <RefreshCw className="size-4" />
              Reintentar
            </button>
          }
        />
      </section>
    )
  }

  if (!driver) {
    return (
      <section className="card card-pad">
        <EmptyState
          icon={<IdCard className="size-6" />}
          title="Sin datos de tu licencia"
          description="Tu licencia y tus trámites llegan con la consulta oficial de una placa a tu nombre. Consulta un vehículo y aparecen aquí."
          action={
            <Link to="/app/garaje" className="btn-primary btn-md">
              <RefreshCw className="size-4" />
              Ir al garaje
            </Link>
          }
        />
      </section>
    )
  }

  return (
    <div className="space-y-4">
      <LicensesCard driver={driver} />
      <ProceduresCard driver={driver} />
    </div>
  )
}

/**
 * Las categorías vigentes, que es lo que se muestra en un retén.
 *
 * El servidor ya filtró las que el registro dio de baja, así que lo que llegue aquí habilita a
 * conducir. Si no llega ninguna, se dice: una lista vacía sin explicación se lee como un error.
 */
function LicensesCard({ driver }: { driver: DriverProfile }) {
  const blocked = driver.identityStatus && !/activ/i.test(driver.identityStatus)

  return (
    <section className="card card-pad">
      <div className="flex items-center gap-2.5">
        <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <BadgeCheck className="size-5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-base">Tu licencia de conducción</h3>
          <p className="truncate text-xs text-carbon-500">
            {driver.holderName ? `${driver.holderName} · ` : ''}
            {driver.documentType} {driver.documentNumber} · Conductor{' '}
            {driver.driverStatus?.toLowerCase() ?? 'sin estado'}
          </p>
        </div>
      </div>

      {blocked && (
        <p className="mt-4 flex items-start gap-2 rounded-2xl bg-danger-50 px-4 py-3 text-sm text-danger-700">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" />
          Tu identidad está {driver.identityStatus?.toLowerCase()} en el RUNT
          {driver.identityUnblockDate ? ` hasta el ${formatDate(driver.identityUnblockDate)}` : ''}. No
          puedes hacer trámites mientras tanto.
        </p>
      )}

      {/* Tener las categorías retiradas y no tener ninguna son cosas distintas: en el primer
          caso el dato puede estar viejo y lo que hace falta es volver a consultar. */}
      {driver.licenses.length === 0 && (
        <p className="mt-4 rounded-2xl bg-carbon-50 px-4 py-3 text-sm text-carbon-600">
          {driver.retiredCount > 0
            ? `La última consulta dejó tus ${driver.retiredCount} categoría${driver.retiredCount === 1 ? '' : 's'} como retirada${driver.retiredCount === 1 ? '' : 's'}. Si renovaste, vuelve a consultar la placa desde el detalle del vehículo.`
            : 'El RUNT no reporta ninguna categoría vigente a tu nombre.'}
        </p>
      )}

      {/* --- Categorías --- */}
      <ul className="mt-4 space-y-2">
        {driver.licenses.map((license) => (
          <li key={license.id} className="rounded-2xl bg-carbon-50 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-carbon-900">
                  Categoría {license.category}
                  {license.status ? ` · ${license.status.toLowerCase()}` : ''}
                </p>
                <p className="mt-0.5 text-xs text-carbon-500">
                  {license.issuedBy}
                  {license.issuedOn ? ` · Expedida el ${formatDate(license.issuedOn)}` : ''}
                </p>
              </div>

              {/* Sin fecha legible se dice, en vez de inventar un vencimiento. */}
              {license.expiresOn == null || license.daysToExpire == null ? (
                <span className="chip-neutral">
                  <CalendarClock className="size-3" />
                  Sin fecha de vencimiento
                </span>
              ) : (
                <span
                  className={
                    license.daysToExpire < 0
                      ? 'chip-danger'
                      : license.daysToExpire <= 60
                        ? 'chip-warn'
                        : 'chip-neutral'
                  }
                >
                  <CalendarClock className="size-3" />
                  Vence {formatDate(license.expiresOn)} ({relativeDays(license.daysToExpire)})
                </span>
              )}
            </div>

            <dl className="mt-3 grid gap-3 border-t border-carbon-200/60 pt-3 sm:grid-cols-3">
              <Fact label="Número" value={license.number} mono />
              <Fact label="Resolución" value={license.resolutionNumber} mono />
              <Fact
                label="Examen médico"
                value={license.examExpiresOn ? formatDate(license.examExpiresOn) : null}
              />
            </dl>

            {license.suspendedUntil && (
              <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-danger-50 px-3 py-2 text-xs font-semibold text-danger-700">
                <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
                Suspendida
                {license.suspendedFrom ? ` desde el ${formatDate(license.suspendedFrom)}` : ''} hasta
                el {formatDate(license.suspendedUntil)}. No puedes conducir en ese periodo.
              </p>
            )}

            {license.restrictions && (
              <p className="mt-2 text-xs text-warn-700">Restricciones: {license.restrictions}</p>
            )}
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs text-carbon-500">
        {driver.hasInfractions
          ? 'Tienes multas pendientes como conductor.'
          : `Sin multas pendientes${driver.clearanceNumber ? ` · Paz y salvo ${driver.clearanceNumber}` : ''}.`}
        {driver.inscriptionNumber
          ? ` · Inscrito en el RUNT con el ${driver.inscriptionNumber}${driver.inscriptionDate ? ` el ${formatDate(driver.inscriptionDate)}` : ''}.`
          : ''}
      </p>
    </section>
  )
}

/** Historial de trámites de la persona ante los organismos de tránsito. */
function ProceduresCard({ driver }: { driver: DriverProfile }) {
  const procedures = driver.procedures
  if (procedures.length === 0) return null

  return (
    <section className="card card-pad">
      <div className="flex items-center gap-2.5">
        <span className="flex size-10 items-center justify-center rounded-xl bg-carbon-50 text-carbon-500">
          <History className="size-5" />
        </span>
        <div>
          <h3 className="text-base">Trámites</h3>
          <p className="text-xs text-carbon-500">Lo que has hecho ante los organismos de tránsito.</p>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {procedures.map((procedure, index) => (
          <li
            key={`${procedure.number ?? index}`}
            className="flex flex-wrap items-start justify-between gap-2 border-b border-carbon-50 pb-2 last:border-0 last:pb-0"
          >
            <div className="min-w-0">
              <p className="text-sm text-carbon-800">{procedure.name}</p>
              <p className="text-xs text-carbon-500">
                {procedure.entity}
                {procedure.number ? ` · Solicitud ${procedure.number}` : ''}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs font-medium text-carbon-600">
                {procedure.date ? formatDate(procedure.date) : '—'}
              </p>
              <p className="text-[0.7rem] text-carbon-400">
                {procedure.procedureStatus ?? procedure.requestStatus}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Fact({
  label,
  value,
  mono,
}: {
  label: string
  value?: string | null
  mono?: boolean
}) {
  return (
    <div>
      <dt className="text-[0.7rem] font-semibold uppercase tracking-wide text-carbon-400">{label}</dt>
      <dd className={cn('mt-0.5 truncate text-sm text-carbon-700', mono && 'font-mono text-xs')}>
        {value ?? '—'}
      </dd>
    </div>
  )
}
