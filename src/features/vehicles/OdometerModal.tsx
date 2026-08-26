import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/form'
import { apiError } from '@/lib/api'
import { distance, todayIso } from '@/lib/format'
import { useUpdateOdometer } from './hooks'
import type { VehicleDetail } from '@/lib/types'

interface Props {
  vehicle: VehicleDetail
  open: boolean
  onClose: () => void
}

/**
 * Registro rápido del kilometraje. Es la acción más frecuente de la app: de ella dependen las
 * proyecciones del plan, la vida de las llantas y las estimaciones en días.
 *
 * El padre lo remonta con una key cada vez que se abre, así el formulario arranca siempre con
 * el kilometraje vigente sin necesidad de sincronizarlo con un efecto.
 */
export function OdometerModal({ vehicle, open, onClose }: Props) {
  const [value, setValue] = useState(String(vehicle.currentOdometer))
  const [date, setDate] = useState(todayIso())
  const [error, setError] = useState('')
  const update = useUpdateOdometer(vehicle.id)

  const submit = async () => {
    const odometer = Number(value)

    if (!odometer || odometer <= 0) {
      setError('Escribe un kilometraje válido.')
      return
    }

    if (odometer < vehicle.currentOdometer) {
      setError(`El kilometraje no puede ser menor al último registrado (${distance(vehicle.currentOdometer)}).`)
      return
    }

    try {
      await update.mutateAsync({ odometer, date })
      onClose()
    } catch (err) {
      setError(apiError(err))
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Actualizar kilometraje"
      description={`Último registro: ${distance(vehicle.currentOdometer, vehicle.distanceUnit)}`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={submit} loading={update.isPending}>
            Guardar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Kilometraje actual" error={error} required>
          <Input
            type="number"
            suffix="km"
            autoFocus
            value={value}
            error={!!error}
            onChange={(event) => setValue(event.target.value)}
          />
        </Field>

        <Field label="Fecha de la lectura">
          <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </Field>

        <p className="rounded-2xl bg-carbon-50 px-4 py-3 text-xs text-carbon-500">
          Mantener el kilometraje al día es lo que permite estimar cuándo te toca cada mantenimiento.
        </p>
      </div>
    </Modal>
  )
}
