import { useState } from 'react'
import { BadgeCheck, Plus, Trash2, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { EmptyState, Loading } from '@/components/ui/feedback'
import { apiError } from '@/lib/api'
import { cn } from '@/lib/cn'
import { date as formatDate, money, relativeDays, todayIso } from '@/lib/format'
import { fineStatusLabels, toOptions } from '@/lib/labels'
import { useDeleteFine, useFines, usePayFine, useSaveFine } from '@/features/records/hooks'
import type { Fine, FineStatus, VehicleDetail } from '@/lib/types'

export function FinesTab({ vehicle }: { vehicle: VehicleDetail }) {
  const { data, isLoading } = useFines(vehicle.id)
  const save = useSaveFine(vehicle.id)
  const pay = usePayFine(vehicle.id)
  const remove = useDeleteFine(vehicle.id)

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Fine | null>(null)
  const [toDelete, setToDelete] = useState<Fine | null>(null)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    number: '',
    date: todayIso(),
    place: '',
    code: '',
    description: '',
    amount: '',
    discountDeadline: '',
    discountedAmount: '',
    status: 'Pending' as FineStatus,
    notes: '',
  })

  const openNew = () => {
    setEditing(null)
    setForm({
      number: '',
      date: todayIso(),
      place: '',
      code: '',
      description: '',
      amount: '',
      discountDeadline: '',
      discountedAmount: '',
      status: 'Pending',
      notes: '',
    })
    setError('')
    setOpen(true)
  }

  const openEdit = (fine: Fine) => {
    setEditing(fine)
    setForm({
      number: fine.number ?? '',
      date: fine.date,
      place: fine.place ?? '',
      code: fine.code ?? '',
      description: fine.description,
      amount: String(fine.amount),
      discountDeadline: fine.discountDeadline ?? '',
      discountedAmount: fine.discountedAmount?.toString() ?? '',
      status: fine.status,
      notes: fine.notes ?? '',
    })
    setError('')
    setOpen(true)
  }

  const submit = async () => {
    setError('')

    if (!form.description.trim()) {
      setError('Escribe la infracción.')
      return
    }

    try {
      await save.mutateAsync({
        id: editing?.id,
        payload: {
          number: form.number || null,
          date: form.date,
          place: form.place || null,
          code: form.code || null,
          description: form.description.trim(),
          amount: Number(form.amount) || 0,
          discountDeadline: form.discountDeadline || null,
          discountedAmount: form.discountedAmount ? Number(form.discountedAmount) : null,
          status: form.status,
          paidDate: form.status === 'Paid' ? todayIso() : null,
          receiptUrl: null,
          notes: form.notes || null,
        },
      })
      setOpen(false)
    } catch (err) {
      setError(apiError(err))
    }
  }

  if (isLoading) return <Loading />

  const fines = data ?? []
  const pending = fines.filter((fine) => fine.status === 'Pending')
  const pendingTotal = pending.reduce((sum, fine) => sum + fine.amount, 0)

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg">Comparendos</h2>
          <p className="text-sm text-carbon-500">
            {pending.length > 0
              ? `${pending.length} pendiente${pending.length === 1 ? '' : 's'} por ${money(pendingTotal)}`
              : 'Sin comparendos pendientes.'}
          </p>
        </div>
        <Button icon={<Plus className="size-4" />} onClick={openNew}>
          Registrar comparendo
        </Button>
      </div>

      {fines.length === 0 ? (
        <EmptyState
          icon={<TriangleAlert className="size-6" />}
          title="Sin comparendos"
          description="Si te llega uno, regístralo aquí y te avisamos antes de que se pierda el descuento por pronto pago."
        />
      ) : (
        <ul className="space-y-3">
          {fines.map((fine) => {
            const isPending = fine.status === 'Pending'
            const deadlineSoon = isPending && (fine.daysToDiscountDeadline ?? 99) <= 5

            return (
              <li
                key={fine.id}
                className={cn(
                  'card card-pad flex flex-wrap items-start justify-between gap-4',
                  deadlineSoon && 'ring-danger-200',
                )}
              >
                <button type="button" onClick={() => openEdit(fine)} className="min-w-0 flex-1 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-base">{fine.description}</h3>
                    <span className={isPending ? 'chip-danger' : 'chip-ok'}>{fineStatusLabels[fine.status]}</span>
                    {fine.code && <span className="chip-neutral">{fine.code}</span>}
                  </div>

                  <p className="mt-1 text-sm text-carbon-500">
                    {formatDate(fine.date)}
                    {fine.place ? ` · ${fine.place}` : ''}
                    {fine.number ? ` · N.º ${fine.number}` : ''}
                  </p>

                  {isPending && fine.discountDeadline && (
                    <p
                      className={cn(
                        'mt-1.5 text-xs font-medium',
                        deadlineSoon ? 'text-danger-600' : 'text-carbon-500',
                      )}
                    >
                      Descuento por pronto pago
                      {fine.discountedAmount ? ` (${money(fine.discountedAmount)})` : ''} vence{' '}
                      {relativeDays(fine.daysToDiscountDeadline)}.
                    </p>
                  )}
                </button>

                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-display text-lg font-semibold text-carbon-900">{money(fine.amount)}</span>

                  {isPending && (
                    <Button
                      size="sm"
                      variant="soft"
                      icon={<BadgeCheck className="size-3.5" />}
                      loading={pay.isPending}
                      onClick={() => pay.mutate(fine.id)}
                    >
                      Marcar pagado
                    </Button>
                  )}

                  <button
                    type="button"
                    onClick={() => setToDelete(fine)}
                    aria-label="Eliminar"
                    className="rounded-lg p-2 text-carbon-400 transition hover:bg-danger-50 hover:text-danger-600"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Editar comparendo' : 'Registrar comparendo'}
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

          <Field label="Infracción" required>
            <Input
              placeholder="Exceso de velocidad"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Número del comparendo">
              <Input value={form.number} onChange={(event) => setForm({ ...form, number: event.target.value })} />
            </Field>

            <Field label="Código" hint="Por ejemplo C29.">
              <Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
            </Field>

            <Field label="Fecha" required>
              <Input
                type="date"
                value={form.date}
                onChange={(event) => setForm({ ...form, date: event.target.value })}
              />
            </Field>

            <Field label="Lugar">
              <Input
                placeholder="Av. Boyacá con Calle 80"
                value={form.place}
                onChange={(event) => setForm({ ...form, place: event.target.value })}
              />
            </Field>

            <Field label="Valor" required>
              <Input
                type="number"
                suffix="COP"
                value={form.amount}
                onChange={(event) => setForm({ ...form, amount: event.target.value })}
              />
            </Field>

            <Field label="Valor con descuento">
              <Input
                type="number"
                suffix="COP"
                value={form.discountedAmount}
                onChange={(event) => setForm({ ...form, discountedAmount: event.target.value })}
              />
            </Field>

            <Field label="Vence el descuento">
              <Input
                type="date"
                value={form.discountDeadline}
                onChange={(event) => setForm({ ...form, discountDeadline: event.target.value })}
              />
            </Field>

            <Field label="Estado">
              <Select
                options={toOptions(fineStatusLabels)}
                value={form.status}
                onChange={(event) => setForm({ ...form, status: event.target.value as FineStatus })}
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
        title="Eliminar comparendo"
        message={`Se borrará "${toDelete?.description}".`}
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
