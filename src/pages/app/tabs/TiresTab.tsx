import { useState } from 'react'
import { CircleDot, Plus, RotateCw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { Field, Input, Textarea } from '@/components/ui/form'
import { EmptyState, Loading } from '@/components/ui/feedback'
import { ProgressBar } from '@/components/ui/indicators'
import { apiError } from '@/lib/api'
import { cn } from '@/lib/cn'
import { date as formatDate, money, num, todayIso } from '@/lib/format'
import { tirePositionLabels } from '@/lib/labels'
import {
  useDeleteTireSet,
  useInstallTires,
  useRegisterRotation,
  useTireSets,
} from '@/features/records/hooks'
import type { TireSet, VehicleDetail } from '@/lib/types'

export function TiresTab({ vehicle }: { vehicle: VehicleDetail }) {
  const { data, isLoading } = useTireSets(vehicle.id)
  const install = useInstallTires(vehicle.id)
  const rotate = useRegisterRotation(vehicle.id)
  const remove = useDeleteTireSet(vehicle.id)

  const [open, setOpen] = useState(false)
  const [toDelete, setToDelete] = useState<TireSet | null>(null)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    brand: '',
    model: '',
    size: '',
    installDate: todayIso(),
    installOdometer: String(vehicle.currentOdometer),
    expectedLifeKm: '50000',
    cost: '',
    rotationIntervalKm: '10000',
    notes: '',
  })

  const openNew = () => {
    setForm({
      brand: '',
      model: '',
      size: '',
      installDate: todayIso(),
      installOdometer: String(vehicle.currentOdometer),
      expectedLifeKm: vehicle.type === 'Motorcycle' ? '20000' : '50000',
      cost: '',
      rotationIntervalKm: '10000',
      notes: '',
    })
    setError('')
    setOpen(true)
  }

  const submit = async () => {
    setError('')

    if (!form.brand.trim()) {
      setError('Escribe la marca de las llantas.')
      return
    }

    try {
      await install.mutateAsync({
        brand: form.brand.trim(),
        model: form.model || null,
        size: form.size || null,
        installDate: form.installDate,
        installOdometer: Number(form.installOdometer) || 0,
        expectedLifeKm: Number(form.expectedLifeKm) || 50000,
        cost: form.cost ? Number(form.cost) : null,
        rotationIntervalKm: Number(form.rotationIntervalKm) || 10000,
        notes: form.notes || null,
        tires: [],
      })
      setOpen(false)
    } catch (err) {
      setError(apiError(err))
    }
  }

  if (isLoading) return <Loading />

  const sets = data ?? []
  const current = sets.find((set) => set.isCurrent)
  const previous = sets.filter((set) => !set.isCurrent)

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg">Llantas</h2>
          <p className="text-sm text-carbon-500">Desgaste, rotaciones y el historial de juegos montados.</p>
        </div>
        <Button icon={<Plus className="size-4" />} onClick={openNew}>
          Montar juego nuevo
        </Button>
      </div>

      {!current && previous.length === 0 ? (
        <EmptyState
          icon={<CircleDot className="size-6" />}
          title="Sin llantas registradas"
          description="Registra el juego que tiene puesto hoy y te avisamos cuándo rotarlas y cuándo cambiarlas."
          action={
            <Button icon={<Plus className="size-4" />} onClick={openNew}>
              Registrar llantas
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {current && (
            <section className="card card-pad">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg">
                      {current.brand} {current.model}
                    </h3>
                    <span className="chip-ok">Montadas</span>
                    {current.size && <span className="chip-neutral">{current.size}</span>}
                  </div>
                  <p className="mt-1 text-sm text-carbon-500">
                    Instaladas el {formatDate(current.installDate)} con {num(current.installOdometer)} km
                    {current.cost ? ` · ${money(current.cost)}` : ''}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  icon={<RotateCw className="size-4" />}
                  loading={rotate.isPending}
                  onClick={() => rotate.mutate(current.id)}
                >
                  Registrar rotación
                </Button>
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <div className="flex items-baseline justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-carbon-400">Vida útil</p>
                    <p className="text-sm font-semibold text-carbon-700">{current.lifeUsedPercent}%</p>
                  </div>
                  <ProgressBar percent={current.lifeUsedPercent} className="mt-2" />
                  <p className="mt-1.5 text-xs text-carbon-500">
                    {num(current.kmUsed)} de {num(current.expectedLifeKm)} km · quedan{' '}
                    {num(current.kmRemaining)} km
                  </p>
                </div>

                <div>
                  <div className="flex items-baseline justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-carbon-400">
                      Próxima rotación
                    </p>
                    <p
                      className={cn(
                        'text-sm font-semibold',
                        current.kmToRotation < 0 ? 'text-danger-600' : 'text-carbon-700',
                      )}
                    >
                      {current.kmToRotation >= 0
                        ? `en ${num(current.kmToRotation)} km`
                        : `pasada por ${num(-current.kmToRotation)} km`}
                    </p>
                  </div>
                  <ProgressBar
                    percent={
                      current.rotationIntervalKm > 0
                        ? ((current.rotationIntervalKm - current.kmToRotation) * 100) / current.rotationIntervalKm
                        : 0
                    }
                    className="mt-2"
                  />
                  <p className="mt-1.5 text-xs text-carbon-500">
                    {current.lastRotationDate
                      ? `Última: ${formatDate(current.lastRotationDate)}`
                      : 'Sin rotaciones registradas'}
                    {' · cada '}
                    {num(current.rotationIntervalKm)} km
                  </p>
                </div>
              </div>

              {current.tires.length > 0 && (
                <div className="mt-5 grid gap-2.5 border-t border-carbon-100 pt-4 sm:grid-cols-2 lg:grid-cols-4">
                  {current.tires.map((tire) => (
                    <div
                      key={tire.id}
                      className={cn(
                        'rounded-2xl px-3.5 py-3',
                        tire.isWorn ? 'bg-danger-50 ring-1 ring-danger-100' : 'bg-carbon-50',
                      )}
                    >
                      <p className="text-xs font-semibold text-carbon-600">{tirePositionLabels[tire.position]}</p>
                      <p className="mt-1 font-display text-base font-semibold text-carbon-900">
                        {tire.treadDepthMm != null ? `${tire.treadDepthMm} mm` : '—'}
                      </p>
                      <p className="text-xs text-carbon-500">
                        {tire.pressurePsi != null ? `${tire.pressurePsi} psi` : 'Sin presión registrada'}
                      </p>
                      {tire.isWorn && <p className="mt-1 text-xs font-semibold text-danger-600">Labrado al límite</p>}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {previous.length > 0 && (
            <section>
              <h3 className="mb-2.5 text-base">Juegos anteriores</h3>
              <ul className="card divide-y divide-carbon-100">
                {previous.map((set) => (
                  <li key={set.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-carbon-800">
                        {set.brand} {set.model}
                      </p>
                      <p className="text-xs text-carbon-500">
                        {formatDate(set.installDate)} → {set.removedDate ? formatDate(set.removedDate) : '—'} ·{' '}
                        {num(set.kmUsed)} km recorridos
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setToDelete(set)}
                      aria-label="Eliminar"
                      className="rounded-lg p-2 text-carbon-400 transition hover:bg-danger-50 hover:text-danger-600"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Montar juego de llantas"
        description="El juego que estaba montado se archiva automáticamente con este kilometraje."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit} loading={install.isPending}>
              Guardar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {error && <p className="rounded-xl bg-danger-50 px-4 py-2.5 text-sm text-danger-700">{error}</p>}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Marca" required>
              <Input
                placeholder="Michelin"
                value={form.brand}
                onChange={(event) => setForm({ ...form, brand: event.target.value })}
              />
            </Field>

            <Field label="Referencia">
              <Input
                placeholder="Primacy 4"
                value={form.model}
                onChange={(event) => setForm({ ...form, model: event.target.value })}
              />
            </Field>

            <Field label="Medida">
              <Input
                placeholder="215/55R18"
                value={form.size}
                onChange={(event) => setForm({ ...form, size: event.target.value })}
              />
            </Field>

            <Field label="Costo del juego">
              <Input
                type="number"
                suffix="COP"
                value={form.cost}
                onChange={(event) => setForm({ ...form, cost: event.target.value })}
              />
            </Field>

            <Field label="Fecha de instalación" required>
              <Input
                type="date"
                value={form.installDate}
                onChange={(event) => setForm({ ...form, installDate: event.target.value })}
              />
            </Field>

            <Field label="Kilometraje de instalación" required>
              <Input
                type="number"
                suffix="km"
                value={form.installOdometer}
                onChange={(event) => setForm({ ...form, installOdometer: event.target.value })}
              />
            </Field>

            <Field label="Vida útil esperada" hint="La que declara el fabricante.">
              <Input
                type="number"
                suffix="km"
                value={form.expectedLifeKm}
                onChange={(event) => setForm({ ...form, expectedLifeKm: event.target.value })}
              />
            </Field>

            <Field label="Rotar cada">
              <Input
                type="number"
                suffix="km"
                value={form.rotationIntervalKm}
                onChange={(event) => setForm({ ...form, rotationIntervalKm: event.target.value })}
              />
            </Field>
          </div>

          <Field label="Notas">
            <Textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar juego de llantas"
        message="Se borrará del historial del vehículo."
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
