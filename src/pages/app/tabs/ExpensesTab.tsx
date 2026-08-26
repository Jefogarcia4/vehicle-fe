import { useState } from 'react'
import { Plus, Receipt, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { EmptyState, Loading } from '@/components/ui/feedback'
import { StatTile } from '@/components/ui/indicators'
import { apiError } from '@/lib/api'
import { date as formatDate, money, moneyShort, num, todayIso } from '@/lib/format'
import { expenseCategoryLabels, toOptions } from '@/lib/labels'
import { useCostSummary, useDeleteExpense, useExpenses, useSaveExpense } from '@/features/records/hooks'
import type { Expense, ExpenseCategory, VehicleDetail } from '@/lib/types'

export function ExpensesTab({ vehicle }: { vehicle: VehicleDetail }) {
  const { data, isLoading } = useExpenses(vehicle.id)
  const { data: summary } = useCostSummary(vehicle.id, 12)
  const save = useSaveExpense(vehicle.id)
  const remove = useDeleteExpense(vehicle.id)

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [toDelete, setToDelete] = useState<Expense | null>(null)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    date: todayIso(),
    category: 'Toll' as ExpenseCategory,
    description: '',
    amount: '',
    odometer: '',
    notes: '',
  })

  const openNew = () => {
    setEditing(null)
    setForm({ date: todayIso(), category: 'Toll', description: '', amount: '', odometer: '', notes: '' })
    setError('')
    setOpen(true)
  }

  const openEdit = (expense: Expense) => {
    setEditing(expense)
    setForm({
      date: expense.date,
      category: expense.category,
      description: expense.description,
      amount: String(expense.amount),
      odometer: expense.odometer?.toString() ?? '',
      notes: expense.notes ?? '',
    })
    setError('')
    setOpen(true)
  }

  const submit = async () => {
    setError('')

    if (!form.description.trim()) {
      setError('Escribe una descripción.')
      return
    }

    try {
      await save.mutateAsync({
        id: editing?.id,
        payload: {
          date: form.date,
          category: form.category,
          description: form.description.trim(),
          amount: Number(form.amount) || 0,
          odometer: form.odometer ? Number(form.odometer) : null,
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

  const expenses = data ?? []

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg">Gastos</h2>
          <p className="text-sm text-carbon-500">
            Peajes, parqueaderos, lavadas y todo lo que no es taller ni combustible.
          </p>
        </div>
        <Button icon={<Plus className="size-4" />} onClick={openNew}>
          Registrar gasto
        </Button>
      </div>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Total 12 meses" value={moneyShort(summary?.total ?? 0)} tone="brand" />
        <StatTile label="Combustible" value={moneyShort(summary?.fuel ?? 0)} />
        <StatTile label="Taller" value={moneyShort(summary?.maintenance ?? 0)} />
        <StatTile
          label="Otros gastos"
          value={moneyShort((summary?.other ?? 0) + (summary?.fines ?? 0))}
          hint={summary?.costPerDistance ? `${money(summary.costPerDistance)} por km` : undefined}
        />
      </section>

      {expenses.length === 0 ? (
        <EmptyState
          icon={<Receipt className="size-6" />}
          title="Sin gastos registrados"
          description="Anota peajes, parqueadero o lavadas para conocer el costo real de tener este vehículo."
          action={
            <Button icon={<Plus className="size-4" />} onClick={openNew}>
              Registrar gasto
            </Button>
          }
        />
      ) : (
        <section className="card overflow-hidden">
          <div className="scrollbar-thin overflow-x-auto">
            <table className="w-full min-w-[36rem]">
              <thead className="border-b border-carbon-100 bg-carbon-50">
                <tr>
                  <th className="table-head">Fecha</th>
                  <th className="table-head">Descripción</th>
                  <th className="table-head">Categoría</th>
                  <th className="table-head">Kilometraje</th>
                  <th className="table-head">Valor</th>
                  <th className="table-head" />
                </tr>
              </thead>
              <tbody className="divide-y divide-carbon-100">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="transition hover:bg-carbon-50">
                    <td className="table-cell whitespace-nowrap">{formatDate(expense.date)}</td>
                    <td className="table-cell">
                      <button
                        type="button"
                        onClick={() => openEdit(expense)}
                        className="font-medium hover:text-brand-600"
                      >
                        {expense.description}
                      </button>
                    </td>
                    <td className="table-cell">
                      <span className="chip-neutral">{expenseCategoryLabels[expense.category]}</span>
                    </td>
                    <td className="table-cell whitespace-nowrap text-carbon-500">
                      {expense.odometer ? `${num(expense.odometer)} km` : '—'}
                    </td>
                    <td className="table-cell whitespace-nowrap font-semibold">{money(expense.amount)}</td>
                    <td className="table-cell text-right">
                      <button
                        type="button"
                        onClick={() => setToDelete(expense)}
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
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Editar gasto' : 'Registrar gasto'}
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

          <Field label="Descripción" required>
            <Input
              placeholder="Peajes viaje a Villeta"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Categoría">
              <Select
                options={toOptions(expenseCategoryLabels)}
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value as ExpenseCategory })}
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

            <Field label="Fecha" required>
              <Input
                type="date"
                value={form.date}
                onChange={(event) => setForm({ ...form, date: event.target.value })}
              />
            </Field>

            <Field label="Kilometraje" hint="Opcional.">
              <Input
                type="number"
                suffix="km"
                value={form.odometer}
                onChange={(event) => setForm({ ...form, odometer: event.target.value })}
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
        title="Eliminar gasto"
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
