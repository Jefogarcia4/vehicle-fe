import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  CircleDollarSign,
  Fuel,
  Gauge,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Wrench,
} from 'lucide-react'
import { AlertList } from '@/components/AlertList'
import { RecommendedPartners } from '@/components/RecommendedPartners'
import { EmptyState, Loading } from '@/components/ui/feedback'
import { ProgressBar, StatTile } from '@/components/ui/indicators'
import { date as formatDate, dec, money, moneyShort, num } from '@/lib/format'
import { expenseCategoryLabels } from '@/lib/labels'
import { useCostSummary, useFuelStats, useServicePlan } from '@/features/records/hooks'
import { useVehicleAlerts } from '@/features/vehicles/hooks'
import { useVehicleRecommendations } from '@/features/partners/hooks'
import { useOfficialRecord } from '@/features/vehicles/lookupHooks'
import type { VehicleDetail } from '@/lib/types'

/**
 * Paleta de la torta de gastos: una serie categórica que se lee bien en claro.
 * Arranca con el rojo de marca y sigue con tonos que no se le parecen, para que
 * ninguna categoría se confunda con el color de la aplicación.
 */
const sliceColors = ['#a90b0b', '#f59e0b', '#10b981', '#0ea5e9', '#8b5cf6', '#6b6b6b', '#dd6a6a']

const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

interface Props {
  vehicle: VehicleDetail
  onTabChange: (tab: 'plan' | 'servicios' | 'documentos' | 'oficial') => void
}

export function OverviewTab({ vehicle, onTabChange }: Props) {
  const { data: alerts, isLoading: loadingAlerts } = useVehicleAlerts(vehicle.id)
  const { data: summary } = useCostSummary(vehicle.id, 12)
  const { data: fuel } = useFuelStats(vehicle.id)
  const { data: plan } = useServicePlan(vehicle.id)
  const { data: official } = useOfficialRecord(vehicle.id)
  const { data: recommendations, isLoading: loadingRecommendations } = useVehicleRecommendations(
    vehicle.id,
    vehicle.city,
  )

  const upcoming = (plan ?? [])
    .filter((item) => item.isActive)
    .sort((a, b) => b.progressPercent - a.progressPercent)
    .slice(0, 5)

  const monthly = (summary?.byMonth ?? []).map((point) => ({
    label: `${monthNames[point.month - 1]}`,
    amount: point.amount,
  }))

  const categories = (summary?.byCategory ?? []).slice(0, 7).map((item) => ({
    name: expenseCategoryLabels[item.category],
    value: item.amount,
  }))

  return (
    <div className="space-y-6">
      {/* --- Cifras clave --- */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Gasto 12 meses"
          value={moneyShort(summary?.total ?? 0)}
          hint={summary?.monthlyAverage ? `${money(summary.monthlyAverage)} al mes` : undefined}
          icon={<CircleDollarSign className="size-5" />}
          tone="brand"
        />
        <StatTile
          label="Costo por km"
          value={summary?.costPerDistance ? money(summary.costPerDistance) : '—'}
          hint={summary?.distance ? `${num(summary.distance)} km recorridos` : 'Registra más kilometraje'}
          icon={<Gauge className="size-5" />}
        />
        <StatTile
          label="Rendimiento"
          value={fuel?.averageEfficiency ? `${dec(fuel.averageEfficiency)} km/gal` : '—'}
          hint={
            fuel?.lastVsAveragePercent != null
              ? `Última tanqueada ${fuel.lastVsAveragePercent > 0 ? '+' : ''}${dec(fuel.lastVsAveragePercent)}% vs. promedio`
              : 'Necesita dos tanques llenos'
          }
          icon={<Fuel className="size-5" />}
          tone={fuel?.lastVsAveragePercent != null && fuel.lastVsAveragePercent < -10 ? 'warn' : 'default'}
        />
        {official?.valuations?.length ? (
          <StatTile
            label="Avalúo comercial"
            value={moneyShort(official.valuations[0].commercialValue)}
            hint={
              official.valuations[0].changeFromPrevious != null
                ? `${official.valuations[0].changeFromPrevious < 0 ? '' : '+'}${moneyShort(official.valuations[0].changeFromPrevious)} vs. el anterior`
                : `Al ${formatDate(official.valuations[0].date)}`
            }
            icon={
              (official.valuations[0].changeFromPrevious ?? 0) < 0 ? (
                <TrendingDown className="size-5" />
              ) : (
                <TrendingUp className="size-5" />
              )
            }
            tone="brand"
          />
        ) : (
          <StatTile
            label="Taller"
            value={moneyShort(summary?.maintenance ?? 0)}
            hint="Servicios en 12 meses"
            icon={<Wrench className="size-5" />}
          />
        )}
      </section>

      {/* Un gravamen vigente impide vender el carro: no puede quedar escondido en una pestaña. */}
      {official?.liens?.some((lien) => !lien.isReleased) && (
        <button
          type="button"
          onClick={() => onTabChange('oficial')}
          className="flex w-full items-start gap-3 rounded-2xl bg-warn-50 px-4 py-3.5 text-left ring-1 ring-warn-100 transition hover:ring-warn-300"
        >
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-warn-600" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-warn-800">
              Este vehículo tiene un gravamen vigente
            </span>
            <span className="mt-0.5 block text-xs text-warn-700">
              {official.liens.find((lien) => !lien.isReleased)!.holder} · No se puede traspasar
              hasta que se levante.
            </span>
          </span>
          <span className="chip-warn shrink-0">Ver detalle</span>
        </button>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* --- Pendientes --- */}
        <section>
          <h2 className="mb-3 text-lg">Qué necesita este vehículo</h2>

          {loadingAlerts ? (
            <Loading />
          ) : (alerts?.length ?? 0) === 0 ? (
            <EmptyState
              icon={<ShieldCheck className="size-6" />}
              title="Está al día"
              description="No hay documentos por vencer ni mantenimientos atrasados."
            />
          ) : (
            <AlertList alerts={alerts ?? []} />
          )}
        </section>

        {/* --- Próximos mantenimientos --- */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg">Próximos mantenimientos</h2>
            <button
              type="button"
              onClick={() => onTabChange('plan')}
              className="text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              Ver plan
            </button>
          </div>

          {upcoming.length === 0 ? (
            <div className="card card-pad text-sm text-carbon-500">
              Este vehículo aún no tiene plan de mantenimiento.
            </div>
          ) : (
            <ul className="card divide-y divide-carbon-100">
              {upcoming.map((item) => (
                <li key={item.id} className="px-5 py-3.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-sm font-medium text-carbon-800">{item.name}</p>
                    <span className="shrink-0 text-xs font-semibold text-carbon-500">
                      {item.kmRemaining != null
                        ? item.kmRemaining >= 0
                          ? `faltan ${num(item.kmRemaining)} km`
                          : `pasado ${num(-item.kmRemaining)} km`
                        : item.daysRemaining != null
                          ? `${item.daysRemaining} días`
                          : ''}
                    </span>
                  </div>
                  <ProgressBar percent={item.progressPercent} className="mt-2" />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <RecommendedPartners
        recommendations={recommendations}
        isLoading={loadingRecommendations}
      />

      {/* --- Gráficas --- */}
      {(summary?.total ?? 0) > 0 && (
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="card card-pad">
            <h2 className="text-lg">Gasto mensual</h2>
            <p className="text-sm text-carbon-500">Todo lo que has invertido en este vehículo, mes a mes.</p>

            <div className="mt-5 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthly} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
                  <defs>
                    <linearGradient id="spend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a90b0b" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#a90b0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ededed" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#949494' }} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: '#949494' }}
                    tickFormatter={(value: number) => moneyShort(value)}
                  />
                  <Tooltip
                    formatter={(value) => [money(Number(value)), 'Gasto']}
                    contentStyle={{ borderRadius: 14, border: '1px solid #ededed', fontSize: 13 }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#a90b0b" strokeWidth={2.5} fill="url(#spend)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="card card-pad">
            <h2 className="text-lg">En qué se va</h2>
            <p className="text-sm text-carbon-500">Distribución de los últimos 12 meses.</p>

            <div className="mt-4 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categories} dataKey="value" nameKey="name" innerRadius={44} outerRadius={68} paddingAngle={2}>
                    {categories.map((entry, index) => (
                      <Cell key={entry.name} fill={sliceColors[index % sliceColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => money(Number(value))}
                    contentStyle={{ borderRadius: 14, border: '1px solid #ededed', fontSize: 13 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <ul className="mt-3 space-y-1.5">
              {categories.map((entry, index) => (
                <li key={entry.name} className="flex items-center gap-2 text-xs">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: sliceColors[index % sliceColors.length] }}
                  />
                  <span className="flex-1 truncate text-carbon-600">{entry.name}</span>
                  <span className="font-semibold text-carbon-700">{moneyShort(entry.value)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  )
}
