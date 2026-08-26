import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { CalendarCheck, CircleDot, Gauge, ShieldCheck, Wrench } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { VehicleAvatar } from '@/components/VehicleAvatar'
import { ErrorState, Loading } from '@/components/ui/feedback'
import { api, apiError } from '@/lib/api'
import { cn } from '@/lib/cn'
import { date as formatDate, distance, num } from '@/lib/format'
import { fuelTypeLabels, maintenanceTypeLabels, transmissionLabels } from '@/lib/labels'
import type { PublicVehicle } from '@/lib/types'

export default function PublicVehiclePage() {
  const { slug = '' } = useParams<{ slug: string }>()

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-vehicle', slug],
    queryFn: async () => (await api.get<PublicVehicle>(`/public/vehicles/${slug}`)).data,
    enabled: !!slug,
  })

  if (isLoading) return <Loading label="Cargando hoja de vida..." className="min-h-screen" />

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20">
        <ErrorState message={apiError(error, 'Esta hoja de vida no existe o ya no es pública.')} />
        <div className="mt-6 text-center">
          <Link to="/" className="btn-ghost btn-md">
            Ir a Rueda Al Día
          </Link>
        </div>
      </div>
    )
  }

  if (!data) return null

  const validDocuments = data.documents.filter((document) => document.isValid).length

  return (
    <div className="min-h-screen bg-carbon-50">
      {/* --- Encabezado oscuro --- */}
      <header className="relative overflow-hidden bg-carbon-950 pb-16 pt-6 text-white">
        <div className="grid-noise absolute inset-0 opacity-60" />
        <div
          className="absolute -right-20 -top-24 size-[26rem] rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, #a90b0b 0%, transparent 65%)' }}
        />

        <div className="container-app relative">
          <div className="flex items-center justify-between">
            <Link to="/">
              <Logo variant="light" />
            </Link>
            <span className="chip bg-white/10 text-brand-200 ring-white/15">
              <ShieldCheck className="size-3.5" />
              Hoja de vida verificada
            </span>
          </div>

          <div className="mt-10 flex flex-col gap-5 sm:flex-row sm:items-center">
            <VehicleAvatar type={data.type} photoUrl={data.photoUrl} size="lg" className="ring-white/20" />
            <div className="min-w-0">
              <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
                {data.brand} {data.model} {data.year}
              </h1>
              <p className="mt-1 text-carbon-300">
                {data.trim ? `${data.trim} · ` : ''}
                Placa {data.maskedPlate}
                {data.color ? ` · ${data.color}` : ''}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* --- Cifras --- */}
      <div className="container-app -mt-10">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <PublicStat
            icon={<Gauge className="size-5" />}
            label="Kilometraje"
            value={distance(data.currentOdometer, data.distanceUnit)}
            hint={data.kmPerYear ? `${num(data.kmPerYear)} km por año` : undefined}
          />
          <PublicStat
            icon={<Wrench className="size-5" />}
            label="Servicios registrados"
            value={String(data.serviceCount)}
            hint={data.lastServiceDate ? `Último: ${formatDate(data.lastServiceDate)}` : undefined}
          />
          <PublicStat
            icon={<CalendarCheck className="size-5" />}
            label="Documentos vigentes"
            value={`${validDocuments} de ${data.documents.length}`}
            hint="Al día de hoy"
          />
          <PublicStat
            icon={<CircleDot className="size-5" />}
            label="Llantas"
            value={data.tireBrand ?? '—'}
            hint={data.tireLifeUsedPercent != null ? `${data.tireLifeUsedPercent}% de vida usada` : undefined}
          />
        </section>

        <div className="mt-6 grid gap-6 pb-16 lg:grid-cols-[0.85fr_1.15fr]">
          {/* --- Ficha y documentos --- */}
          <div className="space-y-6">
            <section className="card card-pad">
              <h2 className="text-lg">Ficha técnica</h2>
              <dl className="mt-4 space-y-3">
                <Row label="Combustible" value={fuelTypeLabels[data.fuelType]} />
                <Row label="Transmisión" value={transmissionLabels[data.transmission]} />
                {data.engineDisplacementCc && <Row label="Cilindraje" value={`${num(data.engineDisplacementCc)} cc`} />}
                {data.firstRecordDate && <Row label="Historial desde" value={formatDate(data.firstRecordDate)} />}
              </dl>
            </section>

            <section className="card card-pad">
              <h2 className="text-lg">Documentos</h2>
              <p className="mt-1 text-sm text-carbon-500">Estado al día de hoy.</p>

              <ul className="mt-4 space-y-2.5">
                {data.documents.length === 0 ? (
                  <li className="text-sm text-carbon-500">Sin documentos publicados.</li>
                ) : (
                  data.documents.map((document) => (
                    <li
                      key={`${document.type}-${document.expiryDate}`}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-carbon-50 px-3.5 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-carbon-800">{document.name}</p>
                        <p className="text-xs text-carbon-500">Vence {formatDate(document.expiryDate)}</p>
                      </div>
                      <span className={document.isValid ? 'chip-ok' : 'chip-danger'}>
                        {document.isValid ? 'Vigente' : 'Vencido'}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </section>
          </div>

          {/* --- Historial --- */}
          <section>
            <h2 className="mb-3 text-lg">Historial de mantenimiento</h2>

            {data.history.length === 0 ? (
              <div className="card card-pad text-sm text-carbon-500">Aún no hay servicios registrados.</div>
            ) : (
              <ol className="relative space-y-3 border-l border-carbon-200 pl-6">
                {data.history.map((service, index) => (
                  <li key={`${service.date}-${index}`} className="relative">
                    <span
                      className={cn(
                        'absolute -left-[31px] top-5 size-3 rounded-full ring-4 ring-carbon-50',
                        index === 0 ? 'bg-brand-500' : 'bg-carbon-300',
                      )}
                    />

                    <article className="card card-pad">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate text-base">{service.title}</h3>
                          <p className="mt-0.5 text-sm text-carbon-500">
                            {formatDate(service.date)} · {num(service.odometer)} km
                            {service.workshopName ? ` · ${service.workshopName}` : ''}
                          </p>
                        </div>
                        <span className="chip-neutral">{maintenanceTypeLabels[service.type]}</span>
                      </div>

                      {service.items.length > 0 && (
                        <ul className="mt-3 flex flex-wrap gap-1.5 border-t border-carbon-100 pt-3">
                          {service.items.map((item, itemIndex) => (
                            <li key={itemIndex} className="chip-neutral">
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </article>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>

      <footer className="border-t border-carbon-100 bg-white py-10">
        <div className="container-app text-center">
          <Logo size="lg" className="mx-auto" />
          <p className="mt-3 text-sm text-carbon-500">
            Esta hoja de vida la publica el propietario del vehículo desde Rueda Al Día.
          </p>
          <Link to="/registro" className="btn-primary btn-md mt-5">
            Crear la hoja de vida de mi vehículo
          </Link>
        </div>
      </footer>
    </div>
  )
}

function PublicStat({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="card card-pad flex items-start gap-4">
      <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-carbon-400">{label}</p>
        <p className="mt-1 truncate font-display text-xl font-semibold text-carbon-900">{value}</p>
        {hint && <p className="text-xs text-carbon-500">{hint}</p>}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-carbon-100 pb-2.5 last:border-0 last:pb-0">
      <dt className="text-sm text-carbon-500">{label}</dt>
      <dd className="text-sm font-semibold text-carbon-800">{value}</dd>
    </div>
  )
}
