import { useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Droplets, Fuel, Plus, Trash2, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { Field, Input, Textarea, Toggle } from '@/components/ui/form'
import { EmptyState, Loading } from '@/components/ui/feedback'
import { StatTile } from '@/components/ui/indicators'
import { apiError } from '@/lib/api'
import { date as formatDate, dateShort, dec, money, num, todayIso } from '@/lib/format'
import { useDeleteFuelLog, useFuelLogs, useFuelStats, useSaveFuelLog } from '@/features/records/hooks'
import type { FuelLog, VehicleDetail } from '@/lib/types'

export function FuelTab({ vehicle }: { vehicle: VehicleDetail }) {
  const { data, isLoading } = useFuelLogs(vehicle.id)
  const { data: stats } = useFuelStats(vehicle.id)
  const save = useSaveFuelLog(vehicle.id)
  const remove = useDeleteFuelLog(vehicle.id)

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<FuelLog | null>(null)
  const [toDelete, setToDelete] = useState<FuelLog | null>(null)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    date: todayIso(),
    odometer: String(vehicle.currentOdometer),
    volume: '',
    pricePerUnit: stats?.lastPricePerUnit ? String(stats.lastPricePerUnit) : '',
    totalCost: '',
    station: '',
    isFullTank: true,
    notes: '',
  })

  const openNew = () => {
    setEditing(null)
    setForm({
      date: todayIso(),
      odometer: String(vehicle.currentOdometer),
      volume: '',
      pricePerUnit: stats?.lastPricePerUnit ? String(stats.lastPricePerUnit) : '',
      totalCost: '',
      station: '',
      isFullTank: true,
      notes: '',
    })
    setError('')
    setOpen(true)
  }

  const openEdit = (log: FuelLog) => {
    setEditing(log)
    setForm({
      date: log.date,
      odometer: String(log.odometer),
      volume: String(log.volume),
      pricePerUnit: String(log.pricePerUnit),
      totalCost: String(log.totalCost),
      station: log.station ?? '',
      isFullTank: log.isFullTank,
      notes: log.notes ?? '',
    })
    setError('')
    setOpen(true)
  }

  const submit = async () => {
    setError('')

    if (!form.volume || Number(form.volume) <= 0) {
      setError('Escribe cuánto tanqueaste.')
      return
    }

    try {
      await save.mutateAsync({
        id: editing?.id,
        payload: {
          date: form.date,
          odometer: Number(form.odometer) || 0,
          volume: Number(form.volume),
          pricePerUnit: Number(form.pricePerUnit) || 0,
          totalCost: Number(form.totalCost) || 0,
          fuelType: vehicle.fuelType,
          station: form.station || null,
          isFullTank: form.isFullTank,
          notes: form.notes || null,
        },
      })
      setOpen(false)
    } catch (err) {
      setError(apiError(err))
    }
  }

  if (isLoading) return <Loading />

  const logs = data ?? []
  const unit = vehicle.volumeUnit === 'Liters' ? 'l' : 'gal'

  // La gráfica va del registro más viejo al más nuevo, al revés de la tabla.
  const chart = logs
    .filter((log) => log.efficiency != null)
    .slice()
    .reverse()
    .map((log) => ({ label: dateShort(log.date), efficiency: log.efficiency }))

  const dropping = stats?.lastVsAveragePercent != null && stats.lastVsAveragePercent < -10

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg">Combustible</h2>
          <p className="text-sm text-carbon-500">
            El rendimiento se calcula entre tanqueadas completas.
          </p>
        </div>
        <Button icon={<Plus className="size-4" />} onClick={openNew}>
          Registrar tanqueada
        </Button>
      </div>

      {logs.length === 0 ? (
        <EmptyState
          icon={<Fuel className="size-6" />}
          title="Sin tanqueadas registradas"
          description="Anota dos tanqueadas de tanque lleno y verás el rendimiento real de tu vehículo."
          action={
            <Button icon={<Plus className="size-4" />} onClick={openNew}>
              Registrar tanqueada
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label="Rendimiento promedio"
              value={stats?.averageEfficiency ? `${dec(stats.averageEfficiency)}` : '—'}
              hint={`km por ${unit === 'l' ? 'litro' : 'galón'}`}
              icon={<Droplets className="size-5" />}
              tone="brand"
            />
            <StatTile
              label="Mejor / peor"
              value={
                stats?.bestEfficiency
                  ? `${dec(stats.bestEfficiency)} / ${dec(stats.worstEfficiency)}`
                  : '—'
              }
              hint="Rango medido"
            />
            <StatTile
              label="Costo por km"
              value={stats?.averageCostPerDistance ? money(stats.averageCostPerDistance) : '—'}
              hint={`${num(stats?.totalDistance)} km medidos`}
            />
            <StatTile
              label="Total tanqueado"
              value={money(stats?.totalSpent)}
              hint={`${dec(stats?.totalVolume)} ${unit} en ${stats?.count ?? 0} cargas`}
              tone={dropping ? 'warn' : 'default'}
            />
          </section>

          {dropping && (
            <div className="flex items-start gap-3 rounded-2xl bg-warn-50 px-4 py-3.5 text-sm text-warn-700">
              <TrendingDown className="mt-0.5 size-4 shrink-0" />
              <p>
                Tu última tanqueada rindió {dec(Math.abs(stats!.lastVsAveragePercent!))}% menos que el
                promedio. Suele pasar por presión baja en las llantas, filtro de aire sucio o bujías
                gastadas. Vale la pena revisarlo.
              </p>
            </div>
          )}

          {chart.length > 1 && (
            <section className="card card-pad">
              <h3 className="text-base">Rendimiento en el tiempo</h3>
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chart} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ededed" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#949494' }} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: '#949494' }}
                      domain={['dataMin - 3', 'dataMax + 3']}
                    />
                    <Tooltip
                      formatter={(value) => [`${dec(Number(value))} km/${unit}`, 'Rendimiento']}
                      contentStyle={{ borderRadius: 14, border: '1px solid #ededed', fontSize: 13 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="efficiency"
                      stroke="#a90b0b"
                      strokeWidth={2.5}
                      dot={{ r: 3.5, fill: '#a90b0b' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          <section className="card overflow-hidden">
            <div className="scrollbar-thin overflow-x-auto">
              <table className="w-full min-w-[42rem]">
                <thead className="border-b border-carbon-100 bg-carbon-50">
                  <tr>
                    <th className="table-head">Fecha</th>
                    <th className="table-head">Kilometraje</th>
                    <th className="table-head">Cantidad</th>
                    <th className="table-head">Total</th>
                    <th className="table-head">Rendimiento</th>
                    <th className="table-head">Estación</th>
                    <th className="table-head" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-carbon-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="transition hover:bg-carbon-50">
                      <td className="table-cell whitespace-nowrap">
                        <button type="button" onClick={() => openEdit(log)} className="font-medium hover:text-brand-600">
                          {formatDate(log.date)}
                        </button>
                      </td>
                      <td className="table-cell whitespace-nowrap">{num(log.odometer)} km</td>
                      <td className="table-cell whitespace-nowrap">
                        {dec(log.volume)} {unit}
                        {!log.isFullTank && <span className="ml-1.5 chip-neutral">parcial</span>}
                      </td>
                      <td className="table-cell whitespace-nowrap font-medium">{money(log.totalCost)}</td>
                      <td className="table-cell whitespace-nowrap">
                        {log.efficiency ? (
                          <span className="font-semibold text-brand-700">
                            {dec(log.efficiency)} km/{unit}
                          </span>
                        ) : (
                          <span className="text-carbon-400">—</span>
                        )}
                      </td>
                      <td className="table-cell max-w-40 truncate">{log.station ?? '—'}</td>
                      <td className="table-cell text-right">
                        <button
                          type="button"
                          onClick={() => setToDelete(log)}
                          aria-label="Eliminar"
                          className="rounded-lg p-1.5 text-carbon-400 transition hover:bg-danger-50 hover:text-danger-600"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Editar tanqueada' : 'Registrar tanqueada'}
        description="Con el kilometraje y la cantidad calculamos el rendimiento."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit} loading={save.isPending}>
              Guardar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {error && <p className="rounded-xl bg-danger-50 px-4 py-2.5 text-sm text-danger-700">{error}</p>}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Fecha" required>
              <Input
                type="date"
                value={form.date}
                onChange={(event) => setForm({ ...form, date: event.target.value })}
              />
            </Field>

            <Field label="Kilometraje" required>
              <Input
                type="number"
                suffix="km"
                value={form.odometer}
                onChange={(event) => setForm({ ...form, odometer: event.target.value })}
              />
            </Field>

            <Field label="Cantidad" required>
              <Input
                type="number"
                step="0.01"
                suffix={unit}
                value={form.volume}
                onChange={(event) => {
                  const volume = event.target.value
                  const price = Number(form.pricePerUnit)
                  setForm({
                    ...form,
                    volume,
                    // Se completa el total con el precio conocido: casi siempre se tiene uno de los dos.
                    totalCost: price ? String(Math.round(Number(volume) * price)) : form.totalCost,
                  })
                }}
              />
            </Field>

            <Field label="Precio por unidad">
              <Input
                type="number"
                suffix="COP"
                value={form.pricePerUnit}
                onChange={(event) => setForm({ ...form, pricePerUnit: event.target.value })}
              />
            </Field>

            <Field label="Total pagado" hint="Si lo dejas vacío lo calculamos.">
              <Input
                type="number"
                suffix="COP"
                value={form.totalCost}
                onChange={(event) => setForm({ ...form, totalCost: event.target.value })}
              />
            </Field>

            <Field label="Estación">
              <Input
                placeholder="Terpel Calle 100"
                value={form.station}
                onChange={(event) => setForm({ ...form, station: event.target.value })}
              />
            </Field>
          </div>

          <div className="rounded-2xl bg-carbon-50 px-4 py-3.5">
            <Toggle
              checked={form.isFullTank}
              onChange={(value) => setForm({ ...form, isFullTank: value })}
              label="Llené el tanque"
              description="El rendimiento solo se puede calcular entre tanques llenos."
            />
          </div>

          <Field label="Notas">
            <Textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar tanqueada"
        message="Se borrará el registro y se recalculará el rendimiento."
        loading={remove.isPending}
        onConfirm={async () => {
          if (toDelete) await remove.mutateAsync(toDelete.id)
          setToDelete(null)
        }}
        onCancel={() => setToDelete(null)}
      />
    </>
  )
}
