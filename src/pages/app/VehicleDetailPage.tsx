import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  CalendarClock,
  CircleDot,
  FileText,
  Fuel,
  Gauge,
  LayoutList,
  Pencil,
  Receipt,
  ScrollText,
  Share2,
  TriangleAlert,
  Wrench,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { VehicleAvatar } from '@/components/VehicleAvatar'
import { Button } from '@/components/ui/Button'
import { ErrorState, Loading } from '@/components/ui/feedback'
import { HealthRing } from '@/components/ui/indicators'
import { OdometerModal } from '@/features/vehicles/OdometerModal'
import { apiError } from '@/lib/api'
import { cn } from '@/lib/cn'
import { distance, plate as formatPlate } from '@/lib/format'
import { fuelTypeLabels, transmissionLabels, vehicleTypeLabels } from '@/lib/labels'
import { useVehicle } from '@/features/vehicles/hooks'
import { OverviewTab } from './tabs/OverviewTab'
import { ServicePlanTab } from './tabs/ServicePlanTab'
import { MaintenanceTab } from './tabs/MaintenanceTab'
import { DocumentsTab } from './tabs/DocumentsTab'
import { FuelTab } from './tabs/FuelTab'
import { ExpensesTab } from './tabs/ExpensesTab'
import { TiresTab } from './tabs/TiresTab'
import { FinesTab } from './tabs/FinesTab'
import { RemindersTab } from './tabs/RemindersTab'
import { ShareTab } from './tabs/ShareTab'
import { OfficialTab } from './tabs/OfficialTab'

const tabs = [
  { key: 'resumen', label: 'Resumen', icon: LayoutList },
  { key: 'plan', label: 'Plan', icon: Gauge },
  { key: 'servicios', label: 'Servicios', icon: Wrench },
  { key: 'documentos', label: 'Documentos', icon: FileText },
  { key: 'combustible', label: 'Combustible', icon: Fuel },
  { key: 'gastos', label: 'Gastos', icon: Receipt },
  { key: 'llantas', label: 'Llantas', icon: CircleDot },
  { key: 'multas', label: 'Multas', icon: TriangleAlert },
  { key: 'recordatorios', label: 'Recordatorios', icon: CalendarClock },
  { key: 'oficial', label: 'Oficial', icon: ScrollText },
  { key: 'compartir', label: 'Compartir', icon: Share2 },
] as const

type TabKey = (typeof tabs)[number]['key']

export default function VehicleDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const [odometerOpen, setOdometerOpen] = useState(false)

  const { data: vehicle, isLoading, error, refetch } = useVehicle(id)

  // La pestaña vive en la URL: así se puede compartir un enlace directo al historial o al plan.
  const active = (searchParams.get('tab') ?? 'resumen') as TabKey

  const setTab = (tab: TabKey) => {
    setSearchParams(tab === 'resumen' ? {} : { tab }, { replace: true })
  }

  if (isLoading) return <Loading />
  // Un id que no existe da un 404 sin cuerpo, así que apiError caería en el texto de axios.
  if (error)
    return (
      <ErrorState
        message={apiError(error, 'Este vehículo no existe o no tienes acceso a él.')}
        onRetry={refetch}
      />
    )
  if (!vehicle) return null

  return (
    <>
      <PageHeader
        title={vehicle.nickname}
        backTo="/app/garaje"
        backLabel="Mis vehículos"
        subtitle={
          <span>
            {vehicle.brand} {vehicle.model} {vehicle.year} · {formatPlate(vehicle.plate)} ·{' '}
            {vehicleTypeLabels[vehicle.type]}
          </span>
        }
        actions={
          <>
            <Button variant="ghost" icon={<Gauge className="size-4" />} onClick={() => setOdometerOpen(true)}>
              Actualizar km
            </Button>
            {vehicle.isOwner && (
              <Link to={`/app/vehiculos/${id}/editar`} className="btn-dark btn-md">
                <Pencil className="size-4" />
                Editar
              </Link>
            )}
          </>
        }
      />

      {/* --- Ficha resumida --- */}
      <section className="card card-pad mb-5 flex flex-col gap-5 sm:flex-row sm:items-center">
        <VehicleAvatar type={vehicle.type} photoUrl={vehicle.photoUrl} name={vehicle.nickname} size="lg" />

        <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          <Detail label="Kilometraje" value={distance(vehicle.currentOdometer, vehicle.distanceUnit)} />
          <Detail label="Uso diario" value={`${vehicle.averageKmPerDay.toFixed(1)} km/día`} />
          <Detail label="Combustible" value={fuelTypeLabels[vehicle.fuelType]} />
          <Detail label="Transmisión" value={transmissionLabels[vehicle.transmission]} />
        </dl>

        <div className="flex items-center justify-center">
          <HealthRing score={vehicle.healthScore} size={92} />
        </div>
      </section>

      {/* --- Pestañas --- */}
      <nav className="scrollbar-thin -mx-4 mb-5 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition',
              active === key
                ? 'bg-carbon-900 text-white shadow-float'
                : 'bg-white text-carbon-600 ring-1 ring-carbon-100 hover:text-brand-600 hover:ring-brand-200',
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </nav>

      <div className="animate-rise">
        {active === 'resumen' && <OverviewTab vehicle={vehicle} onTabChange={setTab} />}
        {active === 'plan' && <ServicePlanTab vehicle={vehicle} />}
        {active === 'servicios' && <MaintenanceTab vehicle={vehicle} />}
        {active === 'documentos' && <DocumentsTab vehicle={vehicle} />}
        {active === 'combustible' && <FuelTab vehicle={vehicle} />}
        {active === 'gastos' && <ExpensesTab vehicle={vehicle} />}
        {active === 'llantas' && <TiresTab vehicle={vehicle} />}
        {active === 'multas' && <FinesTab vehicle={vehicle} />}
        {active === 'recordatorios' && <RemindersTab vehicle={vehicle} />}
        {active === 'oficial' && <OfficialTab vehicle={vehicle} />}
        {active === 'compartir' && <ShareTab vehicle={vehicle} />}
      </div>

      <OdometerModal
        key={`odometer-${odometerOpen}-${vehicle.currentOdometer}`}
        vehicle={vehicle}
        open={odometerOpen}
        onClose={() => setOdometerOpen(false)}
      />
    </>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-carbon-400">{label}</dt>
      <dd className="mt-0.5 font-display text-base font-semibold text-carbon-900">{value}</dd>
    </div>
  )
}
