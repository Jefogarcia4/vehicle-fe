import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertCircle, Camera, Loader2, Save, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { VehicleAvatar } from '@/components/VehicleAvatar'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { ErrorState, Loading } from '@/components/ui/feedback'
import { apiError, uploadFile } from '@/lib/api'
import {
  fuelTypeLabels,
  toOptions,
  transmissionLabels,
  vehicleTypeLabels,
} from '@/lib/labels'
import type { FuelType, TransmissionType, VehiclePayload, VehicleType } from '@/lib/types'
import {
  useDeleteVehicle,
  useUpdateVehicle,
  useVehicle,
} from '@/features/vehicles/hooks'

const currentYear = new Date().getFullYear()

const schema = z.object({
  nickname: z.string().min(2, 'Ponle un nombre corto para reconocerlo.'),
  plate: z.string().min(5, 'La placa es obligatoria.'),
  type: z.string(),
  brand: z.string().min(2, 'La marca es obligatoria.'),
  model: z.string().min(1, 'El modelo es obligatorio.'),
  trim: z.string().optional(),
  year: z.coerce.number().min(1900, 'Año inválido.').max(currentYear + 1, 'Año inválido.'),
  color: z.string().optional(),
  vin: z.string().optional(),
  engineNumber: z.string().optional(),
  engineDisplacementCc: z.string().optional(),
  fuelType: z.string(),
  transmission: z.string(),
  doors: z.string().optional(),
  seats: z.string().optional(),
  currentOdometer: z.coerce.number().min(0, 'El kilometraje no puede ser negativo.'),
  purchaseDate: z.string().optional(),
  purchasePrice: z.string().optional(),
  city: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.input<typeof schema>

/** Convierte los campos numéricos opcionales del formulario en número o null. */
const optionalNumber = (value?: string) => {
  if (!value || value.trim() === '') return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

/**
 * Edición de la ficha de un vehículo.
 *
 * Ya no crea: los vehículos entran por la placa, donde el registro pone marca, línea, motor y
 * documentos. Aquí se corrige lo que el registro no sabe o trae distinto.
 */
export default function VehicleFormPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: vehicle, isLoading, error: loadError } = useVehicle(id)
  const update = useUpdateVehicle(id)
  const remove = useDeleteVehicle()

  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'Car',
      fuelType: 'Gasoline',
      transmission: 'Manual',
      year: currentYear,
      currentOdometer: 0,
    },
  })

  useEffect(() => {
    if (!vehicle) return

    setPhotoUrl(vehicle.photoUrl ?? null)
    reset({
      nickname: vehicle.nickname,
      plate: vehicle.plate,
      type: vehicle.type,
      brand: vehicle.brand,
      model: vehicle.model,
      trim: vehicle.trim ?? '',
      year: vehicle.year,
      color: vehicle.color ?? '',
      vin: vehicle.vin ?? '',
      engineNumber: vehicle.engineNumber ?? '',
      engineDisplacementCc: vehicle.engineDisplacementCc?.toString() ?? '',
      fuelType: vehicle.fuelType,
      transmission: vehicle.transmission,
      doors: vehicle.doors?.toString() ?? '',
      seats: vehicle.seats?.toString() ?? '',
      currentOdometer: vehicle.currentOdometer,
      purchaseDate: vehicle.purchaseDate ?? '',
      purchasePrice: vehicle.purchasePrice?.toString() ?? '',
      city: vehicle.city ?? '',
      notes: vehicle.notes ?? '',
    })
  }, [vehicle, reset])

  const handlePhoto = async (file?: File) => {
    if (!file) return
    setUploading(true)
    setError('')
    try {
      setPhotoUrl(await uploadFile(file, 'vehicles'))
    } catch (err) {
      setError(apiError(err, 'No pudimos subir la foto.'))
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    setError('')

    const payload: VehiclePayload = {
      nickname: values.nickname,
      plate: values.plate,
      type: values.type as VehicleType,
      brand: values.brand,
      model: values.model,
      trim: values.trim || null,
      year: Number(values.year),
      color: values.color || null,
      vin: values.vin || null,
      engineNumber: values.engineNumber || null,
      engineDisplacementCc: optionalNumber(values.engineDisplacementCc),
      fuelType: values.fuelType as FuelType,
      transmission: values.transmission as TransmissionType,
      doors: optionalNumber(values.doors),
      seats: optionalNumber(values.seats),
      distanceUnit: 'Kilometers',
      volumeUnit: 'Gallons',
      currentOdometer: Number(values.currentOdometer),
      purchaseDate: values.purchaseDate || null,
      purchasePrice: optionalNumber(values.purchasePrice),
      city: values.city || null,
      photoUrl,
      notes: values.notes || null,
    }

    try {
      const saved = await update.mutateAsync(payload)
      navigate(`/app/vehiculos/${saved.id}`)
    } catch (err) {
      setError(apiError(err, 'No pudimos guardar el vehículo.'))
    }
  })

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(id)
      navigate('/app/garaje')
    } catch (err) {
      setError(apiError(err, 'No pudimos eliminar el vehículo.'))
      setConfirmDelete(false)
    }
  }

  if (isLoading) return <Loading />
  if (loadError) return <ErrorState message={apiError(loadError)} />

  const type = (watch('type') ?? 'Car') as VehicleType

  return (
    <>
      <PageHeader
        title="Editar vehículo"
        subtitle={vehicle?.nickname}
        backTo={`/app/vehiculos/${id}`}
        actions={
          <Button variant="danger" icon={<Trash2 className="size-4" />} onClick={() => setConfirmDelete(true)}>
            Eliminar
          </Button>
        }
      />

      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-2xl bg-danger-50 px-4 py-3 text-sm text-danger-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        {/* --- Identificación --- */}
        <section className="card card-pad">
          <h2 className="text-lg">Identificación</h2>

          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex flex-col items-center gap-2">
              <VehicleAvatar type={type} photoUrl={photoUrl} size="lg" />
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handlePhoto(event.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-60"
              >
                {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Camera className="size-3.5" />}
                {photoUrl ? 'Cambiar foto' : 'Subir foto'}
              </button>
            </div>

            <div className="grid flex-1 gap-4 sm:grid-cols-2">
              <Field label="Apodo" error={errors.nickname?.message} required hint="Como lo llamas: “La camioneta”.">
                <Input placeholder="La camioneta" error={!!errors.nickname} {...register('nickname')} />
              </Field>

              <Field label="Placa" error={errors.plate?.message} required>
                <Input
                  placeholder="ABC123"
                  className="uppercase"
                  error={!!errors.plate}
                  {...register('plate')}
                />
              </Field>

              <Field label="Tipo" error={errors.type?.message} required>
                <Select options={toOptions(vehicleTypeLabels)} {...register('type')} />
              </Field>

              <Field label="Ciudad de circulación" error={errors.city?.message}>
                <Input placeholder="Bogotá" {...register('city')} />
              </Field>
            </div>
          </div>
        </section>

        {/* --- Ficha técnica --- */}
        <section className="card card-pad">
          <h2 className="text-lg">Ficha técnica</h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Marca" error={errors.brand?.message} required>
              <Input placeholder="Mazda" error={!!errors.brand} {...register('brand')} />
            </Field>

            <Field label="Modelo" error={errors.model?.message} required>
              <Input placeholder="CX-30" error={!!errors.model} {...register('model')} />
            </Field>

            <Field label="Línea o versión" error={errors.trim?.message}>
              <Input placeholder="Grand Touring" {...register('trim')} />
            </Field>

            <Field label="Año" error={errors.year?.message} required>
              <Input type="number" error={!!errors.year} {...register('year')} />
            </Field>

            <Field label="Color" error={errors.color?.message}>
              <Input placeholder="Gris" {...register('color')} />
            </Field>

            <Field label="Cilindraje" error={errors.engineDisplacementCc?.message}>
              <Input type="number" suffix="cc" placeholder="2000" {...register('engineDisplacementCc')} />
            </Field>

            <Field label="Combustible" required>
              <Select options={toOptions(fuelTypeLabels)} {...register('fuelType')} />
            </Field>

            <Field label="Transmisión" required>
              <Select options={toOptions(transmissionLabels)} {...register('transmission')} />
            </Field>

            <Field label="Kilometraje actual" error={errors.currentOdometer?.message} required>
              <Input type="number" suffix="km" error={!!errors.currentOdometer} {...register('currentOdometer')} />
            </Field>

            <Field label="Chasis (VIN)" error={errors.vin?.message}>
              <Input className="uppercase" placeholder="17 caracteres" {...register('vin')} />
            </Field>

            <Field label="Número de motor" error={errors.engineNumber?.message}>
              <Input {...register('engineNumber')} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Puertas">
                <Input type="number" {...register('doors')} />
              </Field>
              <Field label="Puestos">
                <Input type="number" {...register('seats')} />
              </Field>
            </div>
          </div>
        </section>

        {/* --- Compra y notas --- */}
        <section className="card card-pad">
          <h2 className="text-lg">Compra y notas</h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Fecha de compra">
              <Input type="date" {...register('purchaseDate')} />
            </Field>

            <Field label="Precio de compra" hint="Sirve para calcular la depreciación más adelante.">
              <Input type="number" suffix="COP" placeholder="0" {...register('purchasePrice')} />
            </Field>

            <Field label="Notas" className="sm:col-span-2">
              <Textarea placeholder="Detalles que quieras recordar del vehículo." {...register('notes')} />
            </Field>
          </div>

        </section>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" type="button" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button type="submit" size="lg" loading={isSubmitting} icon={<Save className="size-4" />}>
            Guardar cambios
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmDelete}
        title="Eliminar vehículo"
        message="Se borrará junto con todo su historial: servicios, documentos, tanqueadas y gastos. Esta acción no se puede deshacer."
        loading={remove.isPending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  )
}
