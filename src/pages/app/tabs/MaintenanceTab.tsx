import { useState } from 'react'
import { FileText, Plus, ShieldCheck, Store, Trash2, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { EmptyState, Loading } from '@/components/ui/feedback'
import { apiError } from '@/lib/api'
import { date as formatDate, money, num, todayIso } from '@/lib/format'
import { maintenanceTypeLabels, toOptions } from '@/lib/labels'
import {
  useDeleteMaintenance,
  useMaintenance,
  useSaveMaintenance,
  useServicePlan,
  useWorkshops,
} from '@/features/records/hooks'
import { PartnerPickerModal } from '@/features/partners/PartnerPickerModal'
import type { MaintenanceRecord, MaintenanceType, VehicleDetail } from '@/lib/types'

interface ItemRow {
  description: string
  brand: string
  partNumber: string
  quantity: string
  unitCost: string
}

const emptyItem: ItemRow = { description: '', brand: '', partNumber: '', quantity: '1', unitCost: '' }

export function MaintenanceTab({ vehicle }: { vehicle: VehicleDetail }) {
  const [pickingPartner, setPickingPartner] = useState(false)
  const { data, isLoading } = useMaintenance(vehicle.id)
  const { data: workshops } = useWorkshops()
  const { data: plan } = useServicePlan(vehicle.id)
  const save = useSaveMaintenance(vehicle.id)
  const remove = useDeleteMaintenance(vehicle.id)

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<MaintenanceRecord | null>(null)
  const [toDelete, setToDelete] = useState<MaintenanceRecord | null>(null)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    type: 'OilChange' as MaintenanceType,
    date: todayIso(),
    odometer: String(vehicle.currentOdometer),
    workshopId: '',
    workshopName: '',
    laborCost: '',
    invoiceNumber: '',
    warrantyMonths: '',
    warrantyKm: '',
    notes: '',
  })
  const [items, setItems] = useState<ItemRow[]>([{ ...emptyItem }])
  const [completes, setCompletes] = useState<string[]>([])

  const openNew = () => {
    setEditing(null)
    setForm({
      title: '',
      type: 'OilChange',
      date: todayIso(),
      odometer: String(vehicle.currentOdometer),
      workshopId: '',
      workshopName: '',
      laborCost: '',
      invoiceNumber: '',
      warrantyMonths: '',
      warrantyKm: '',
      notes: '',
    })
    setItems([{ ...emptyItem }])
    setCompletes([])
    setError('')
    setOpen(true)
  }

  const openEdit = (record: MaintenanceRecord) => {
    setEditing(record)
    setForm({
      title: record.title,
      type: record.type,
      date: record.date,
      odometer: String(record.odometer),
      workshopId: record.workshopId ?? '',
      workshopName: record.workshopId ? '' : (record.workshopName ?? ''),
      laborCost: record.laborCost ? String(record.laborCost) : '',
      invoiceNumber: record.invoiceNumber ?? '',
      warrantyMonths: record.warrantyMonths?.toString() ?? '',
      warrantyKm: record.warrantyKm?.toString() ?? '',
      notes: record.notes ?? '',
    })
    setItems(
      record.items.length > 0
        ? record.items.map((item) => ({
            description: item.description,
            brand: item.brand ?? '',
            partNumber: item.partNumber ?? '',
            quantity: String(item.quantity),
            unitCost: String(item.unitCost),
          }))
        : [{ ...emptyItem }],
    )
    setCompletes([])
    setError('')
    setOpen(true)
  }

  const submit = async () => {
    setError('')

    if (!form.title.trim()) {
      setError('Escribe qué se hizo.')
      return
    }

    const validItems = items.filter((item) => item.description.trim())

    try {
      await save.mutateAsync({
        id: editing?.id,
        payload: {
          title: form.title.trim(),
          type: form.type,
          date: form.date,
          odometer: Number(form.odometer) || 0,
          workshopId: form.workshopId || null,
          workshopName: form.workshopId ? null : form.workshopName || null,
          laborCost: Number(form.laborCost) || 0,
          // Los repuestos suman el total; sin ítems el costo va todo en mano de obra.
          partsCost: 0,
          invoiceNumber: form.invoiceNumber || null,
          invoiceUrl: null,
          nextServiceOdometer: null,
          nextServiceDate: null,
          warrantyMonths: form.warrantyMonths ? Number(form.warrantyMonths) : null,
          warrantyKm: form.warrantyKm ? Number(form.warrantyKm) : null,
          notes: form.notes || null,
          photos: [],
          items: validItems.map((item) => ({
            description: item.description.trim(),
            category: form.type,
            brand: item.brand || null,
            partNumber: item.partNumber || null,
            quantity: Number(item.quantity) || 1,
            unitCost: Number(item.unitCost) || 0,
          })),
          completesPlanItemIds: completes,
        },
      })
      setOpen(false)
    } catch (err) {
      setError(apiError(err))
    }
  }

  if (isLoading) return <Loading />

  const records = data ?? []
  const total = records.reduce((sum, record) => sum + record.totalCost, 0)
  const itemsTotal = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitCost) || 0),
    0,
  )

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg">Historial de servicios</h2>
          <p className="text-sm text-carbon-500">
            {records.length} servicio{records.length === 1 ? '' : 's'} · {money(total)} invertidos
          </p>
        </div>
        <Button icon={<Plus className="size-4" />} onClick={openNew}>
          Registrar servicio
        </Button>
      </div>

      {records.length === 0 ? (
        <EmptyState
          icon={<Wrench className="size-6" />}
          title="Sin servicios registrados"
          description="Anota el último cambio de aceite o la última visita al taller para empezar la hoja de vida."
          action={
            <Button icon={<Plus className="size-4" />} onClick={openNew}>
              Registrar servicio
            </Button>
          }
        />
      ) : (
        <ol className="relative space-y-4 border-l border-carbon-200 pl-6">
          {records.map((record) => (
            <li key={record.id} className="relative">
              <span className="absolute -left-[31px] top-5 size-3 rounded-full bg-brand-500 ring-4 ring-carbon-50" />

              <article className="card card-pad">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <button type="button" onClick={() => openEdit(record)} className="min-w-0 flex-1 text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-base">{record.title}</h3>
                      <span className="chip-neutral">{maintenanceTypeLabels[record.type]}</span>
                      {record.isUnderWarranty && (
                        <span className="chip-ok">
                          <ShieldCheck className="size-3" />
                          En garantía
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-carbon-500">
                      {formatDate(record.date)} · {num(record.odometer)} km
                      {record.workshopName ? ` · ${record.workshopName}` : ''}
                    </p>
                  </button>

                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-display text-lg font-semibold text-carbon-900">
                      {money(record.totalCost)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setToDelete(record)}
                      aria-label="Eliminar"
                      className="rounded-lg p-2 text-carbon-400 transition hover:bg-danger-50 hover:text-danger-600"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                {record.items.length > 0 && (
                  <ul className="mt-3 space-y-1.5 border-t border-carbon-100 pt-3">
                    {record.items.map((item) => (
                      <li key={item.id} className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate text-carbon-600">
                          {item.quantity > 1 && <span className="font-medium">{item.quantity}× </span>}
                          {item.description}
                          {item.brand && <span className="text-carbon-400"> · {item.brand}</span>}
                          {item.partNumber && <span className="text-carbon-400"> · {item.partNumber}</span>}
                        </span>
                        <span className="shrink-0 text-carbon-500">{money(item.subtotal)}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {(record.notes || record.invoiceNumber) && (
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-carbon-500">
                    {record.invoiceNumber && (
                      <span className="inline-flex items-center gap-1.5">
                        <FileText className="size-3.5" />
                        Factura {record.invoiceNumber}
                      </span>
                    )}
                    {record.notes && <span>{record.notes}</span>}
                  </div>
                )}

                {record.warrantyUntil && (
                  <p className="mt-2 text-xs text-carbon-400">
                    Garantía hasta {formatDate(record.warrantyUntil)}
                    {record.warrantyUntilOdometer ? ` o ${num(record.warrantyUntilOdometer)} km` : ''}.
                  </p>
                )}
              </article>
            </li>
          ))}
        </ol>
      )}

      {/* ---------------------------------------------------------------- formulario */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="lg"
        title={editing ? 'Editar servicio' : 'Registrar servicio'}
        description="Guarda qué se hizo, con qué kilometraje y qué repuestos se usaron."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit} loading={save.isPending}>
              Guardar servicio
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {error && <p className="rounded-xl bg-danger-50 px-4 py-2.5 text-sm text-danger-700">{error}</p>}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Qué se hizo" required className="sm:col-span-2">
              <Input
                placeholder="Cambio de aceite y filtros"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
              />
            </Field>

            <Field label="Categoría">
              <Select
                options={toOptions(maintenanceTypeLabels)}
                value={form.type}
                onChange={(event) => setForm({ ...form, type: event.target.value as MaintenanceType })}
              />
            </Field>

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

            <Field label="Taller">
              <Select
                placeholder="Otro taller..."
                options={(workshops ?? []).map((workshop) => ({ value: workshop.id, label: workshop.name }))}
                value={form.workshopId}
                onChange={(event) => setForm({ ...form, workshopId: event.target.value })}
              />
              <button
                type="button"
                onClick={() => setPickingPartner(true)}
                className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                <Store className="size-3.5" />
                Buscar en el directorio de aliados
              </button>
            </Field>

            {!form.workshopId && (
              <Field label="Nombre del taller" className="sm:col-span-2">
                <Input
                  placeholder="Autoservicio El Progreso"
                  value={form.workshopName}
                  onChange={(event) => setForm({ ...form, workshopName: event.target.value })}
                />
              </Field>
            )}
          </div>

          {/* --- Repuestos --- */}
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-carbon-700">Repuestos y trabajos</h4>
              <button
                type="button"
                onClick={() => setItems([...items, { ...emptyItem }])}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                + Agregar ítem
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="grid gap-2 rounded-2xl bg-carbon-50 p-3 sm:grid-cols-12">
                  <Input
                    className="sm:col-span-5"
                    placeholder="Descripción"
                    value={item.description}
                    onChange={(event) => {
                      const next = [...items]
                      next[index] = { ...item, description: event.target.value }
                      setItems(next)
                    }}
                  />
                  <Input
                    className="sm:col-span-3"
                    placeholder="Marca / referencia"
                    value={item.brand}
                    onChange={(event) => {
                      const next = [...items]
                      next[index] = { ...item, brand: event.target.value }
                      setItems(next)
                    }}
                  />
                  <Input
                    className="sm:col-span-1"
                    type="number"
                    placeholder="1"
                    value={item.quantity}
                    onChange={(event) => {
                      const next = [...items]
                      next[index] = { ...item, quantity: event.target.value }
                      setItems(next)
                    }}
                  />
                  <Input
                    className="sm:col-span-2"
                    type="number"
                    placeholder="Valor"
                    value={item.unitCost}
                    onChange={(event) => {
                      const next = [...items]
                      next[index] = { ...item, unitCost: event.target.value }
                      setItems(next)
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setItems(items.filter((_, i) => i !== index))}
                    className="flex items-center justify-center rounded-lg p-2 text-carbon-400 transition hover:bg-danger-50 hover:text-danger-600 sm:col-span-1"
                    aria-label="Quitar ítem"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mano de obra">
              <Input
                type="number"
                suffix="COP"
                placeholder="0"
                value={form.laborCost}
                onChange={(event) => setForm({ ...form, laborCost: event.target.value })}
              />
            </Field>

            <Field label="Número de factura">
              <Input
                value={form.invoiceNumber}
                onChange={(event) => setForm({ ...form, invoiceNumber: event.target.value })}
              />
            </Field>

            <Field label="Garantía (meses)">
              <Input
                type="number"
                suffix="meses"
                value={form.warrantyMonths}
                onChange={(event) => setForm({ ...form, warrantyMonths: event.target.value })}
              />
            </Field>

            <Field label="Garantía (km)">
              <Input
                type="number"
                suffix="km"
                value={form.warrantyKm}
                onChange={(event) => setForm({ ...form, warrantyKm: event.target.value })}
              />
            </Field>
          </div>

          <div className="rounded-2xl bg-brand-50 px-4 py-3 text-sm">
            <span className="text-carbon-600">Total del servicio: </span>
            <span className="font-display text-lg font-semibold text-brand-700">
              {money(itemsTotal + (Number(form.laborCost) || 0))}
            </span>
          </div>

          {/* --- Reglas del plan que este servicio deja al día --- */}
          {(plan ?? []).length > 0 && !editing && (
            <section>
              <h4 className="mb-2 text-sm font-semibold text-carbon-700">¿Qué deja al día este servicio?</h4>
              <p className="mb-2.5 text-xs text-carbon-500">
                Marca las reglas del plan que se cumplieron: sus contadores vuelven a arrancar desde este
                kilometraje.
              </p>
              <div className="flex flex-wrap gap-2">
                {(plan ?? [])
                  .filter((item) => item.isActive)
                  .map((item) => {
                    const checked = completes.includes(item.id)
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          setCompletes(
                            checked ? completes.filter((id) => id !== item.id) : [...completes, item.id],
                          )
                        }
                        className={
                          checked
                            ? 'chip-brand cursor-pointer'
                            : 'chip-neutral cursor-pointer hover:ring-brand-200'
                        }
                      >
                        {item.name}
                      </button>
                    )
                  })}
              </div>
            </section>
          )}

          <Field label="Notas">
            <Textarea
              placeholder="Observaciones del taller, síntomas, recomendaciones..."
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
            />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar servicio"
        message={`Se borrará "${toDelete?.title}" del historial del vehículo.`}
        loading={remove.isPending}
        onConfirm={async () => {
          if (toDelete) await remove.mutateAsync(toDelete.id)
          setToDelete(null)
        }}
        onCancel={() => setToDelete(null)}
      />

      {/* El aliado escogido queda guardado en la libreta y seleccionado en el formulario. */}
      <PartnerPickerModal
        open={pickingPartner}
        onClose={() => setPickingPartner(false)}
        city={vehicle.city}
        vehicleType={vehicle.type}
        onPick={(workshop) => setForm({ ...form, workshopId: workshop.id, workshopName: '' })}
      />
    </>
  )
}
