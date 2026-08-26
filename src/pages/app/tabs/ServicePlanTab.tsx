import { useState } from 'react'
import { Check, Gauge, Plus, Sparkles, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { Field, Input, Select, Textarea, Toggle } from '@/components/ui/form'
import { EmptyState, Loading } from '@/components/ui/feedback'
import { ProgressBar } from '@/components/ui/indicators'
import { apiError } from '@/lib/api'
import { cn } from '@/lib/cn'
import { date as formatDate, num, relativeDays } from '@/lib/format'
import { maintenanceTypeLabels, toOptions } from '@/lib/labels'
import {
  useApplyPlanTemplate,
  useDeletePlanItem,
  useMarkPlanDone,
  useSavePlanItem,
  useServicePlan,
} from '@/features/records/hooks'
import type { MaintenanceType, ServicePlanItem, VehicleDetail } from '@/lib/types'

const emptyForm = {
  name: '',
  type: 'OilChange' as MaintenanceType,
  intervalKm: '',
  intervalMonths: '',
  lastServiceOdometer: '',
  lastServiceDate: '',
  isActive: true,
  notes: '',
}

type FormState = typeof emptyForm

export function ServicePlanTab({ vehicle }: { vehicle: VehicleDetail }) {
  const { data, isLoading } = useServicePlan(vehicle.id)
  const save = useSavePlanItem(vehicle.id)
  const markDone = useMarkPlanDone(vehicle.id)
  const applyTemplate = useApplyPlanTemplate(vehicle.id)
  const remove = useDeletePlanItem(vehicle.id)

  const [editing, setEditing] = useState<ServicePlanItem | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState('')
  const [toDelete, setToDelete] = useState<ServicePlanItem | null>(null)

  const openNew = () => {
    setEditing(null)
    setForm(emptyForm)
    setError('')
    setOpen(true)
  }

  const openEdit = (item: ServicePlanItem) => {
    setEditing(item)
    setForm({
      name: item.name,
      type: item.type,
      intervalKm: item.intervalKm?.toString() ?? '',
      intervalMonths: item.intervalMonths?.toString() ?? '',
      lastServiceOdometer: item.lastServiceOdometer?.toString() ?? '',
      lastServiceDate: item.lastServiceDate ?? '',
      isActive: item.isActive,
      notes: item.notes ?? '',
    })
    setError('')
    setOpen(true)
  }

  const submit = async () => {
    setError('')

    if (!form.name.trim()) {
      setError('Ponle un nombre a la regla.')
      return
    }

    if (!form.intervalKm && !form.intervalMonths) {
      setError('Define al menos un intervalo: por kilometraje o por tiempo.')
      return
    }

    try {
      await save.mutateAsync({
        id: editing?.id,
        payload: {
          name: form.name.trim(),
          type: form.type,
          intervalKm: form.intervalKm ? Number(form.intervalKm) : null,
          intervalMonths: form.intervalMonths ? Number(form.intervalMonths) : null,
          lastServiceOdometer: form.lastServiceOdometer ? Number(form.lastServiceOdometer) : null,
          lastServiceDate: form.lastServiceDate || null,
          isActive: form.isActive,
          notes: form.notes || null,
        },
      })
      setOpen(false)
    } catch (err) {
      setError(apiError(err))
    }
  }

  if (isLoading) return <Loading />

  const items = data ?? []
  const overdue = items.filter((item) => item.isActive && item.progressPercent >= 100)
  const soon = items.filter((item) => item.isActive && item.progressPercent >= 60 && item.progressPercent < 100)
  const rest = items.filter((item) => !item.isActive || item.progressPercent < 60)

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg">Plan de mantenimiento</h2>
          <p className="text-sm text-carbon-500">
            Cada regla vence por kilometraje o por tiempo, lo que ocurra primero.
          </p>
        </div>
        <div className="flex gap-2">
          {items.length === 0 && (
            <Button
              variant="ghost"
              icon={<Sparkles className="size-4" />}
              loading={applyTemplate.isPending}
              onClick={() => applyTemplate.mutate()}
            >
              Cargar plan sugerido
            </Button>
          )}
          <Button icon={<Plus className="size-4" />} onClick={openNew}>
            Nueva regla
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<Gauge className="size-6" />}
          title="Sin plan de mantenimiento"
          description="Carga los intervalos sugeridos para el tipo de vehículo y ajústalos con el manual del tuyo."
          action={
            <Button
              icon={<Sparkles className="size-4" />}
              loading={applyTemplate.isPending}
              onClick={() => applyTemplate.mutate()}
            >
              Cargar plan sugerido
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {overdue.length > 0 && (
            <PlanGroup
              title="Atrasados"
              tone="danger"
              items={overdue}
              vehicle={vehicle}
              onEdit={openEdit}
              onDone={(item) => markDone.mutate({ id: item.id })}
              onDelete={setToDelete}
            />
          )}
          {soon.length > 0 && (
            <PlanGroup
              title="Se acercan"
              tone="warn"
              items={soon}
              vehicle={vehicle}
              onEdit={openEdit}
              onDone={(item) => markDone.mutate({ id: item.id })}
              onDelete={setToDelete}
            />
          )}
          {rest.length > 0 && (
            <PlanGroup
              title="Al día"
              tone="ok"
              items={rest}
              vehicle={vehicle}
              onEdit={openEdit}
              onDone={(item) => markDone.mutate({ id: item.id })}
              onDelete={setToDelete}
            />
          )}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Editar regla' : 'Nueva regla del plan'}
        description="Define cada cuánto se repite este trabajo."
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

          <Field label="Nombre" required>
            <Input
              placeholder="Cambio de aceite y filtro"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </Field>

          <Field label="Categoría">
            <Select
              options={toOptions(maintenanceTypeLabels)}
              value={form.type}
              onChange={(event) => setForm({ ...form, type: event.target.value as MaintenanceType })}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Cada cuántos km" hint="Déjalo vacío si solo aplica por tiempo.">
              <Input
                type="number"
                suffix="km"
                placeholder="5000"
                value={form.intervalKm}
                onChange={(event) => setForm({ ...form, intervalKm: event.target.value })}
              />
            </Field>

            <Field label="Cada cuántos meses" hint="Déjalo vacío si solo aplica por kilometraje.">
              <Input
                type="number"
                suffix="meses"
                placeholder="6"
                value={form.intervalMonths}
                onChange={(event) => setForm({ ...form, intervalMonths: event.target.value })}
              />
            </Field>

            <Field label="Último servicio (km)">
              <Input
                type="number"
                suffix="km"
                placeholder={String(vehicle.currentOdometer)}
                value={form.lastServiceOdometer}
                onChange={(event) => setForm({ ...form, lastServiceOdometer: event.target.value })}
              />
            </Field>

            <Field label="Último servicio (fecha)">
              <Input
                type="date"
                value={form.lastServiceDate}
                onChange={(event) => setForm({ ...form, lastServiceDate: event.target.value })}
              />
            </Field>
          </div>

          <Field label="Notas">
            <Textarea
              placeholder="Referencia del repuesto, recomendaciones del taller..."
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
            />
          </Field>

          <Toggle
            checked={form.isActive}
            onChange={(value) => setForm({ ...form, isActive: value })}
            label="Regla activa"
            description="Las reglas inactivas no generan alertas."
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar regla"
        message={`Se quitará "${toDelete?.name}" del plan de mantenimiento.`}
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

interface GroupProps {
  title: string
  tone: 'danger' | 'warn' | 'ok'
  items: ServicePlanItem[]
  vehicle: VehicleDetail
  onEdit: (item: ServicePlanItem) => void
  onDone: (item: ServicePlanItem) => void
  onDelete: (item: ServicePlanItem) => void
}

const toneChip = {
  danger: 'chip-danger',
  warn: 'chip-warn',
  ok: 'chip-ok',
}

function PlanGroup({ title, tone, items, onEdit, onDone, onDelete }: GroupProps) {
  return (
    <section>
      <div className="mb-2.5 flex items-center gap-2">
        <h3 className="text-base">{title}</h3>
        <span className={toneChip[tone]}>{items.length}</span>
      </div>

      <ul className="card divide-y divide-carbon-100">
        {items.map((item) => (
          <li key={item.id} className={cn('px-5 py-4', !item.isActive && 'opacity-60')}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <button type="button" onClick={() => onEdit(item)} className="min-w-0 flex-1 text-left">
                <p className="truncate font-medium text-carbon-900">{item.name}</p>
                <p className="mt-0.5 text-xs text-carbon-500">
                  {item.intervalKm ? `Cada ${num(item.intervalKm)} km` : ''}
                  {item.intervalKm && item.intervalMonths ? ' · ' : ''}
                  {item.intervalMonths ? `Cada ${item.intervalMonths} meses` : ''}
                  {item.lastServiceDate ? ` · Último: ${formatDate(item.lastServiceDate)}` : ''}
                </p>
              </button>

              <div className="flex shrink-0 items-center gap-1.5">
                <Button size="sm" variant="ghost" icon={<Check className="size-3.5" />} onClick={() => onDone(item)}>
                  Ya se hizo
                </Button>
                <button
                  type="button"
                  onClick={() => onDelete(item)}
                  aria-label="Eliminar"
                  className="rounded-lg p-2 text-carbon-400 transition hover:bg-danger-50 hover:text-danger-600"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <ProgressBar percent={item.progressPercent} className="flex-1" />
              <span className="shrink-0 text-xs font-semibold text-carbon-600">
                {item.kmRemaining != null
                  ? item.kmRemaining >= 0
                    ? `faltan ${num(item.kmRemaining)} km`
                    : `pasado por ${num(-item.kmRemaining)} km`
                  : relativeDays(item.daysRemaining)}
              </span>
            </div>

            {item.estimatedDaysByUsage != null && item.kmRemaining != null && item.kmRemaining > 0 && (
              <p className="mt-1.5 text-xs text-carbon-400">
                Con tu uso actual, te llega {relativeDays(item.estimatedDaysByUsage)}.
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
