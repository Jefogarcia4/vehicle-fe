import { useState } from 'react'
import { BellRing, Check, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { EmptyState, Loading } from '@/components/ui/feedback'
import { apiError } from '@/lib/api'
import { cn } from '@/lib/cn'
import { date as formatDate, num, relativeDays, todayIso } from '@/lib/format'
import { toOptions } from '@/lib/labels'
import {
  useCompleteReminder,
  useDeleteReminder,
  useReminders,
  useSaveReminder,
} from '@/features/records/hooks'
import type { Reminder, ReminderType, VehicleDetail } from '@/lib/types'

const reminderTypeLabels: Record<ReminderType, string> = {
  Custom: 'General',
  Maintenance: 'Mantenimiento',
  Document: 'Documento',
  Tires: 'Llantas',
  Insurance: 'Seguro',
  Tax: 'Impuesto',
}

export function RemindersTab({ vehicle }: { vehicle: VehicleDetail }) {
  const [includeDone, setIncludeDone] = useState(false)
  const { data, isLoading } = useReminders(vehicle.id, includeDone)
  const save = useSaveReminder(vehicle.id)
  const complete = useCompleteReminder(vehicle.id)
  const remove = useDeleteReminder(vehicle.id)

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Reminder | null>(null)
  const [toDelete, setToDelete] = useState<Reminder | null>(null)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    type: 'Custom' as ReminderType,
    dueDate: todayIso(),
    dueOdometer: '',
    remindDaysBefore: '15',
    remindKmBefore: '500',
    repeatMonths: '',
    repeatKm: '',
    notes: '',
  })

  const openNew = () => {
    setEditing(null)
    setForm({
      title: '',
      type: 'Custom',
      dueDate: todayIso(),
      dueOdometer: '',
      remindDaysBefore: '15',
      remindKmBefore: '500',
      repeatMonths: '',
      repeatKm: '',
      notes: '',
    })
    setError('')
    setOpen(true)
  }

  const openEdit = (reminder: Reminder) => {
    setEditing(reminder)
    setForm({
      title: reminder.title,
      type: reminder.type,
      dueDate: reminder.dueDate ?? '',
      dueOdometer: reminder.dueOdometer?.toString() ?? '',
      remindDaysBefore: String(reminder.remindDaysBefore),
      remindKmBefore: String(reminder.remindKmBefore),
      repeatMonths: reminder.repeatMonths?.toString() ?? '',
      repeatKm: reminder.repeatKm?.toString() ?? '',
      notes: reminder.notes ?? '',
    })
    setError('')
    setOpen(true)
  }

  const submit = async () => {
    setError('')

    if (!form.title.trim()) {
      setError('Escribe de qué se trata.')
      return
    }

    if (!form.dueDate && !form.dueOdometer) {
      setError('Indica una fecha o un kilometraje.')
      return
    }

    try {
      await save.mutateAsync({
        id: editing?.id,
        payload: {
          title: form.title.trim(),
          type: form.type,
          dueDate: form.dueDate || null,
          dueOdometer: form.dueOdometer ? Number(form.dueOdometer) : null,
          remindDaysBefore: Number(form.remindDaysBefore) || 15,
          remindKmBefore: Number(form.remindKmBefore) || 500,
          repeatMonths: form.repeatMonths ? Number(form.repeatMonths) : null,
          repeatKm: form.repeatKm ? Number(form.repeatKm) : null,
          notes: form.notes || null,
        },
      })
      setOpen(false)
    } catch (err) {
      setError(apiError(err))
    }
  }

  if (isLoading) return <Loading />

  const reminders = data ?? []

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg">Recordatorios</h2>
          <p className="text-sm text-carbon-500">
            Para lo que no encaja en el plan: una revisión antes de un viaje, cambiar los limpiabrisas...
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setIncludeDone(!includeDone)}>
            {includeDone ? 'Ocultar cumplidos' : 'Ver cumplidos'}
          </Button>
          <Button icon={<Plus className="size-4" />} onClick={openNew}>
            Nuevo recordatorio
          </Button>
        </div>
      </div>

      {reminders.length === 0 ? (
        <EmptyState
          icon={<BellRing className="size-6" />}
          title="Sin recordatorios"
          description="Crea uno por fecha, por kilometraje o por los dos."
          action={
            <Button icon={<Plus className="size-4" />} onClick={openNew}>
              Nuevo recordatorio
            </Button>
          }
        />
      ) : (
        <ul className="card divide-y divide-carbon-100">
          {reminders.map((reminder) => {
            const overdue =
              !reminder.isDone &&
              ((reminder.daysRemaining != null && reminder.daysRemaining < 0) ||
                (reminder.kmRemaining != null && reminder.kmRemaining < 0))

            return (
              <li key={reminder.id} className={cn('flex items-center gap-3 px-5 py-4', reminder.isDone && 'opacity-55')}>
                <button
                  type="button"
                  disabled={reminder.isDone || complete.isPending}
                  onClick={() => complete.mutate(reminder.id)}
                  aria-label="Marcar como hecho"
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-xl transition',
                    reminder.isDone
                      ? 'bg-ok-50 text-ok-600'
                      : 'bg-carbon-50 text-carbon-400 hover:bg-ok-50 hover:text-ok-600',
                  )}
                >
                  <Check className="size-4" />
                </button>

                <button type="button" onClick={() => openEdit(reminder)} className="min-w-0 flex-1 text-left">
                  <p className={cn('truncate font-medium text-carbon-900', reminder.isDone && 'line-through')}>
                    {reminder.title}
                  </p>
                  <p className="truncate text-xs text-carbon-500">
                    {reminderTypeLabels[reminder.type]}
                    {reminder.dueDate ? ` · ${formatDate(reminder.dueDate)}` : ''}
                    {reminder.dueOdometer ? ` · ${num(reminder.dueOdometer)} km` : ''}
                    {reminder.repeatMonths ? ` · se repite cada ${reminder.repeatMonths} meses` : ''}
                    {reminder.repeatKm ? ` · se repite cada ${num(reminder.repeatKm)} km` : ''}
                  </p>
                </button>

                {!reminder.isDone && (
                  <span className={cn('hidden shrink-0 sm:inline-flex', overdue ? 'chip-danger' : 'chip-neutral')}>
                    {reminder.kmRemaining != null
                      ? reminder.kmRemaining >= 0
                        ? `faltan ${num(reminder.kmRemaining)} km`
                        : `pasado ${num(-reminder.kmRemaining)} km`
                      : relativeDays(reminder.daysRemaining)}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setToDelete(reminder)}
                  aria-label="Eliminar"
                  className="shrink-0 rounded-lg p-2 text-carbon-400 transition hover:bg-danger-50 hover:text-danger-600"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Editar recordatorio' : 'Nuevo recordatorio'}
        description="Puedes combinarlo por fecha y por kilometraje: avisa con el que llegue primero."
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

          <Field label="De qué se trata" required>
            <Input
              placeholder="Revisar presión de llantas antes del viaje"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Categoría">
              <Select
                options={toOptions(reminderTypeLabels)}
                value={form.type}
                onChange={(event) => setForm({ ...form, type: event.target.value as ReminderType })}
              />
            </Field>

            <Field label="Fecha límite">
              <Input
                type="date"
                value={form.dueDate}
                onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
              />
            </Field>

            <Field label="Kilometraje límite">
              <Input
                type="number"
                suffix="km"
                placeholder={String(vehicle.currentOdometer + 1000)}
                value={form.dueOdometer}
                onChange={(event) => setForm({ ...form, dueOdometer: event.target.value })}
              />
            </Field>

            <Field label="Avisar con">
              <Input
                type="number"
                suffix="días"
                value={form.remindDaysBefore}
                onChange={(event) => setForm({ ...form, remindDaysBefore: event.target.value })}
              />
            </Field>

            <Field label="Repetir cada" hint="Meses. Vacío si no se repite.">
              <Input
                type="number"
                suffix="meses"
                value={form.repeatMonths}
                onChange={(event) => setForm({ ...form, repeatMonths: event.target.value })}
              />
            </Field>

            <Field label="Repetir cada" hint="Kilómetros. Vacío si no se repite.">
              <Input
                type="number"
                suffix="km"
                value={form.repeatKm}
                onChange={(event) => setForm({ ...form, repeatKm: event.target.value })}
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
        title="Eliminar recordatorio"
        message={`Se borrará "${toDelete?.title}".`}
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
