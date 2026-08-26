import { Link } from 'react-router-dom'
import {
  CarFront,
  CircleDollarSign,
  Fuel,
  Plus,
  Receipt,
  ShieldCheck,
  TriangleAlert,
  Wrench,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { AlertList } from '@/components/AlertList'
import { RecommendedPartners } from '@/components/RecommendedPartners'
import { VehicleCard } from '@/components/VehicleCard'
import { EmptyState, ErrorState, Loading } from '@/components/ui/feedback'
import { HealthRing, StatTile } from '@/components/ui/indicators'
import { apiError } from '@/lib/api'
import { date, money, moneyShort, num } from '@/lib/format'
import { healthTone } from '@/lib/labels'
import { useAuth } from '@/features/auth/AuthContext'
import { useDashboard } from '@/features/vehicles/hooks'
import { useRecommendations } from '@/features/partners/hooks'
import type { Activity } from '@/lib/types'

const activityIcons = {
  maintenance: Wrench,
  fuel: Fuel,
  expense: Receipt,
  fine: TriangleAlert,
} as const

export default function DashboardPage() {
  const { user } = useAuth()
  const { data, isLoading, error, refetch } = useDashboard()

  // La ciudad del perfil solo desempata: manda la del vehículo cuando la tiene registrada.
  const { data: recommendations, isLoading: loadingRecommendations } = useRecommendations(user?.city)

  if (isLoading) return <Loading label="Preparando tu garaje..." />
  if (error) return <ErrorState message={apiError(error)} onRetry={refetch} />
  if (!data) return null

  const firstName = user?.fullName?.split(' ')[0] ?? ''
  const pending = data.expiredCount + data.criticalCount
  const tone = healthTone(data.overallHealth)

  return (
    <>
      <PageHeader
        title={firstName ? `Hola, ${firstName}` : 'Tu garaje'}
        subtitle={
          pending > 0
            ? `Tienes ${pending} asunto${pending === 1 ? '' : 's'} que necesita${pending === 1 ? '' : 'n'} tu atención.`
            : 'Todo tu garaje está al día. Buen trabajo.'
        }
        actions={
          <Link to="/app/vehiculos/nuevo" className="btn-primary btn-md">
            <Plus className="size-4" />
            Agregar vehículo
          </Link>
        }
      />

      {data.vehicleCount === 0 ? (
        <EmptyState
          icon={<CarFront className="size-6" />}
          title="Aún no tienes vehículos"
          description="Registra tu carro o tu moto para empezar a llevar su historial, sus documentos y sus gastos."
          action={
            <Link to="/app/vehiculos/nuevo" className="btn-primary btn-md">
              <Plus className="size-4" />
              Registrar mi primer vehículo
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* --- Resumen --- */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="card card-pad flex items-center gap-4">
              <HealthRing score={data.overallHealth} size={82} />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-carbon-400">Estado general</p>
                <p className={`mt-1 font-display text-lg font-semibold ${tone.text}`}>{tone.label}</p>
                <p className="text-xs text-carbon-500">
                  {data.vehicleCount} vehículo{data.vehicleCount === 1 ? '' : 's'} en tu garaje
                </p>
              </div>
            </div>

            <StatTile
              label="Vencidos"
              value={num(data.expiredCount)}
              hint={data.expiredCount > 0 ? 'Resuélvelos cuanto antes' : 'Nada vencido'}
              icon={<TriangleAlert className="size-5" />}
              tone={data.expiredCount > 0 ? 'danger' : 'ok'}
            />

            <StatTile
              label="Por vencer"
              value={num(data.criticalCount + data.warningCount)}
              hint="En los próximos días"
              icon={<ShieldCheck className="size-5" />}
              tone={data.criticalCount > 0 ? 'warn' : 'ok'}
            />

            <StatTile
              label="Gasto del mes"
              value={moneyShort(data.monthSpend)}
              hint={`${money(data.yearSpend)} en 12 meses`}
              icon={<CircleDollarSign className="size-5" />}
              tone="brand"
            />
          </section>

          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            {/* --- Qué sigue --- */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg">Qué sigue</h2>
                {data.alerts.length > 0 && (
                  <span className="text-xs font-medium text-carbon-400">
                    {data.alerts.length} pendiente{data.alerts.length === 1 ? '' : 's'}
                  </span>
                )}
              </div>

              {data.alerts.length === 0 ? (
                <EmptyState
                  icon={<ShieldCheck className="size-6" />}
                  title="Nada pendiente"
                  description="Ningún documento por vencer ni mantenimiento atrasado. Te avisamos cuando algo se acerque."
                />
              ) : (
                <AlertList alerts={data.alerts} showVehicle limit={8} />
              )}
            </section>

            {/* --- Movimiento reciente --- */}
            <section>
              <h2 className="mb-3 text-lg">Movimiento reciente</h2>

              {data.recentActivity.length === 0 ? (
                <div className="card card-pad text-sm text-carbon-500">
                  Aquí verás cada tanqueada, servicio y gasto que registres.
                </div>
              ) : (
                <ul className="card divide-y divide-carbon-100">
                  {data.recentActivity.slice(0, 8).map((item, index) => (
                    <ActivityRow key={`${item.date}-${index}`} item={item} />
                  ))}
                </ul>
              )}
            </section>
          </div>

          <RecommendedPartners
            recommendations={recommendations}
            isLoading={loadingRecommendations}
            showVehicle
          />

          {/* --- Vehículos --- */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg">Mis vehículos</h2>
              <Link to="/app/garaje" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
                Ver todos
              </Link>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {data.vehicles.slice(0, 4).map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  )
}

function ActivityRow({ item }: { item: Activity }) {
  const Icon = activityIcons[item.kind] ?? Receipt

  return (
    <li className="flex items-center gap-3 px-5 py-3.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-carbon-50 text-carbon-500">
        <Icon className="size-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-carbon-800">{item.title}</p>
        <p className="truncate text-xs text-carbon-500">
          {item.vehicleName} · {date(item.date, 'd MMM')}
        </p>
      </div>
      {item.amount != null && (
        <span className="shrink-0 text-sm font-semibold text-carbon-700">{moneyShort(item.amount)}</span>
      )}
    </li>
  )
}
