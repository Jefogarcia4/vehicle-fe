import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { apiError } from '@/lib/api'
import { toOptions, vehicleTypeLabels } from '@/lib/labels'
import { useSaveCustomerVehicle } from './hooks'
import type { CustomerVehicle, VehicleType } from '@/lib/types'

interface Props {
  open: boolean
  onClose: () => void
  customerId: string
  /** Vehículo a editar. Sin él, el formulario agrega uno nuevo. */
  vehicle?: CustomerVehicle
}

/**
 * Vehículo del cliente. Las fechas de SOAT y tecnomecánica son lo importante: son las que
 * hacen que el cliente entre a una campaña de vencimientos.
 */
export function CustomerVehicleModal({ open, onClose, customerId, vehicle }: Props) {
  const save = useSaveCustomerVehicle()
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    plate: vehicle?.plate ?? '',
    type: (vehicle?.type ?? 'Car') as VehicleType,
    brand: vehicle?.brand ?? '',
    model: vehicle?.model ?? '',
    year: vehicle?.year?.toString() ?? '',
    color: vehicle?.color ?? '',
    odometer: vehicle?.odometer?.toString() ?? '',
    soatExpiry: vehicle?.soatExpiry ?? '',
    technicalInspectionExpiry: vehicle?.technicalInspectionExpiry ?? '',
    lastServiceDate: vehicle?.lastServiceDate ?? '',
    nextServiceDate: vehicle?.nextServiceDate ?? '',
    nextServiceOdometer: vehicle?.nextServiceOdometer?.toString() ?? '',
    notes: vehicle?.notes ?? '',
  })

  const submit = async () => {
    setError('')

    if (form.plate.replace(/[^a-z0-9]/gi, '').length < 5) {
      setError('Escribe la placa completa.')
      return
    }

    const number = (value: string) => (value.trim() ? Number(value) : null)

    try {
      await save.mutateAsync({
        customerId,
        vehicleId: vehicle?.id,
        payload: {
          plate: form.plate.trim(),
          type: form.type,
          brand: form.brand.trim() || null,
          model: form.model.trim() || null,
          year: number(form.year),
          color: form.color.trim() || null,
          odometer: number(form.odometer),
          // Un kilometraje sin fecha envejece sin avisar: se sella con el día que se registró.
          odometerDate: form.odometer.trim() ? new Date().toISOString().slice(0, 10) : null,
          soatExpiry: form.soatExpiry || null,
          technicalInspectionExpiry: form.technicalInspectionExpiry || null,
          lastServiceDate: form.lastServiceDate || null,
          nextServiceDate: form.nextServiceDate || null,
          nextServiceOdometer: number(form.nextServiceOdometer),
          notes: form.notes.trim() || null,
        },
      })
      onClose()
    } catch (err) {
      setError(apiError(err, 'No pudimos guardar el vehículo.'))
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={vehicle ? `Editar ${vehicle.plate}` : 'Agregar vehículo'}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={submit} loading={save.isPending}>
            Guardar
          </Button>
        </>
      }
    >
      {error && <p className="field-error mb-3">{error}</p>}

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Placa" required>
            <Input
              placeholder="ABC123"
              className="uppercase"
              value={form.plate}
              onChange={(event) => setForm({ ...form, plate: event.target.value })}
            />
          </Field>
          <Field label="Tipo">
            <Select
              options={toOptions(vehicleTypeLabels)}
              value={form.type}
              onChange={(event) => setForm({ ...form, type: event.target.value as VehicleType })}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Marca">
            <Input
              placeholder="Mazda"
              value={form.brand}
              onChange={(event) => setForm({ ...form, brand: event.target.value })}
            />
          </Field>
          <Field label="Modelo">
            <Input
              placeholder="CX-5"
              value={form.model}
              onChange={(event) => setForm({ ...form, model: event.target.value })}
            />
          </Field>
          <Field label="Año">
            <Input
              type="number"
              placeholder="2021"
              value={form.year}
              onChange={(event) => setForm({ ...form, year: event.target.value })}
            />
          </Field>
        </div>

        <div className="rounded-2xl bg-brand-50 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-brand-700">
            Vencimientos
          </p>
          <p className="mb-3 text-xs text-brand-800">
            Con estas fechas puedes armar campañas de "SOAT por vencer" y que el cliente entre solo.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Vence el SOAT">
              <Input
                type="date"
                value={form.soatExpiry}
                onChange={(event) => setForm({ ...form, soatExpiry: event.target.value })}
              />
            </Field>
            <Field label="Vence la tecnomecánica">
              <Input
                type="date"
                value={form.technicalInspectionExpiry}
                onChange={(event) =>
                  setForm({ ...form, technicalInspectionExpiry: event.target.value })
                }
              />
            </Field>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kilometraje" >
            <Input
              type="number"
              suffix="km"
              value={form.odometer}
              onChange={(event) => setForm({ ...form, odometer: event.target.value })}
            />
          </Field>
          <Field label="Último servicio">
            <Input
              type="date"
              value={form.lastServiceDate}
              onChange={(event) => setForm({ ...form, lastServiceDate: event.target.value })}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Próximo servicio (fecha)">
            <Input
              type="date"
              value={form.nextServiceDate}
              onChange={(event) => setForm({ ...form, nextServiceDate: event.target.value })}
            />
          </Field>
          <Field label="Próximo servicio (km)">
            <Input
              type="number"
              suffix="km"
              value={form.nextServiceOdometer}
              onChange={(event) => setForm({ ...form, nextServiceOdometer: event.target.value })}
            />
          </Field>
        </div>

        <Field label="Notas">
          <Textarea
            rows={2}
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
          />
        </Field>
      </div>
    </Modal>
  )
}
