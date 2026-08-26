import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  BadgeCheck,
  ExternalLink,
  ImagePlus,
  Plus,
  Store,
  Trash2,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Field, Input, Textarea, Toggle } from '@/components/ui/form'
import { Loading } from '@/components/ui/feedback'
import { apiError, assetUrl, uploadFile } from '@/lib/api'
import { cn } from '@/lib/cn'
import { vehicleTypeLabels } from '@/lib/labels'
import { useAuth } from '@/features/auth/AuthContext'
import { CategoryPicker } from '@/features/partners/CategoryPicker'
import {
  useMyPartner,
  useSetPartnerVisibility,
  useUpdatePartner,
} from '@/features/partners/hooks'
import type { PartnerLocation, VehicleType } from '@/lib/types'

/**
 * Panel del negocio. La misma ruta sirve para los dos estados: si la cuenta todavía no es
 * aliado muestra la activación, y si ya lo es muestra la edición del perfil.
 */
export default function PartnerPanelPage() {
  const { data: partner, isLoading } = useMyPartner()

  if (isLoading) return <Loading />

  return partner ? <PartnerProfileForm partner={partner} /> : <ActivatePartner />
}

// ---------------------------------------------------------------- activación

/** Convierte una cuenta de conductor en aliado. Pide lo mínimo; el resto se llena después. */
function ActivatePartner() {
  const { becomePartner } = useAuth()

  const [form, setForm] = useState({ businessName: '', department: '', city: '', address: '', phone: '' })
  const [categoryIds, setCategoryIds] = useState<string[]>([])
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    setError('')

    if (form.businessName.trim().length < 3) {
      setError('Escribe el nombre del establecimiento.')
      return
    }
    if (categoryIds.length === 0) {
      setError('Selecciona al menos una categoría de servicio.')
      return
    }

    setSaving(true)
    try {
      await becomePartner({ ...form, categoryIds, vehicleTypes })
    } catch (err) {
      setError(apiError(err, 'No pudimos crear el perfil del negocio.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Publica tu negocio"
        subtitle="Aparece en el directorio y llega a quien está por necesitar tu servicio."
      />

      <div className="card card-pad max-w-2xl">
        <div className="flex items-start gap-3 rounded-2xl bg-brand-50 px-4 py-3">
          <Store className="mt-0.5 size-5 shrink-0 text-brand-600" />
          <p className="text-sm text-brand-800">
            Tu garaje personal no cambia. Con el perfil de aliado tu cuenta suma el panel del
            negocio, y puedes pausarlo o cerrarlo cuando quieras.
          </p>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-danger-50 px-4 py-3 text-sm text-danger-700">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="mt-6 space-y-4">
          <Field label="Nombre del establecimiento" required>
            <Input
              placeholder="Frenos del Norte"
              value={form.businessName}
              onChange={(event) => setForm({ ...form, businessName: event.target.value })}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Departamento">
              <Input
                placeholder="Cundinamarca"
                value={form.department}
                onChange={(event) => setForm({ ...form, department: event.target.value })}
              />
            </Field>
            <Field label="Ciudad">
              <Input
                placeholder="Bogotá"
                value={form.city}
                onChange={(event) => setForm({ ...form, city: event.target.value })}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Dirección">
              <Input
                placeholder="Calle 170 #20-30"
                value={form.address}
                onChange={(event) => setForm({ ...form, address: event.target.value })}
              />
            </Field>
            <Field label="Teléfono">
              <Input
                placeholder="300 000 0000"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </Field>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-base">¿Qué servicios prestas?</h3>
          <p className="mb-3 mt-1 text-sm text-carbon-500">
            Es lo que define por cuáles alertas te vamos a recomendar.
          </p>
          <CategoryPicker value={categoryIds} onChange={setCategoryIds} />
        </div>

        <div className="mt-6">
          <h3 className="text-base">¿Qué vehículos atiendes?</h3>
          <p className="mb-3 mt-1 text-sm text-carbon-500">
            Sin marcar ninguno entendemos que los atiendes todos.
          </p>
          <VehicleTypePicker value={vehicleTypes} onChange={setVehicleTypes} />
        </div>

        <Button size="lg" block className="mt-8" loading={saving} onClick={submit}>
          Crear mi perfil de aliado
        </Button>
      </div>
    </>
  )
}

// ---------------------------------------------------------------- perfil

interface ProfileFormProps {
  partner: NonNullable<ReturnType<typeof useMyPartner>['data']>
}

function PartnerProfileForm({ partner }: ProfileFormProps) {
  const update = useUpdatePartner()
  const visibility = useSetPartnerVisibility()
  const { leavePartner } = useAuth()
  const client = useQueryClient()
  const [closing, setClosing] = useState(false)

  const [form, setForm] = useState({
    name: partner.name,
    legalId: partner.legalId ?? '',
    description: partner.description ?? '',
    phone: partner.phone ?? '',
    whatsappNumber: partner.whatsappNumber ?? '',
    email: partner.email ?? '',
    address: partner.address ?? '',
    city: partner.city ?? '',
    department: partner.department ?? '',
    websiteUrl: partner.websiteUrl ?? '',
    instagramUrl: partner.instagramUrl ?? '',
    facebookUrl: partner.facebookUrl ?? '',
    scheduleNote: partner.scheduleNote ?? '',
    appointmentUrl: partner.appointmentUrl ?? '',
  })

  const [logoUrl, setLogoUrl] = useState(partner.logoUrl ?? '')
  const [photoUrl, setPhotoUrl] = useState(partner.photoUrl ?? '')
  const [acceptsAppointments, setAcceptsAppointments] = useState(partner.acceptsAppointments)
  const [offersHomeService, setOffersHomeService] = useState(partner.offersHomeService)
  const [categoryIds, setCategoryIds] = useState(partner.categories.map((c) => c.id))
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>(partner.vehicleTypes)
  const [brands, setBrands] = useState(partner.brands.join(', '))
  const [locations, setLocations] = useState<PartnerLocation[]>(partner.locations)

  const [uploading, setUploading] = useState<'logo' | 'photo' | null>(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // El aviso de guardado se apaga solo: dejarlo fijo pierde sentido en cuanto se sigue editando.
  useEffect(() => {
    if (!saved) return
    const timer = setTimeout(() => setSaved(false), 3000)
    return () => clearTimeout(timer)
  }, [saved])

  const upload = async (file: File | undefined, kind: 'logo' | 'photo') => {
    if (!file) return
    setUploading(kind)
    setError('')
    try {
      const url = await uploadFile(file, 'partners')
      if (kind === 'logo') setLogoUrl(url)
      else setPhotoUrl(url)
    } catch (err) {
      setError(apiError(err, 'No pudimos subir la imagen.'))
    } finally {
      setUploading(null)
    }
  }

  const submit = async () => {
    setError('')

    if (categoryIds.length === 0) {
      setError('Selecciona al menos una categoría de servicio.')
      return
    }

    try {
      await update.mutateAsync({
        ...form,
        legalId: form.legalId || null,
        description: form.description || null,
        phone: form.phone || null,
        whatsappNumber: form.whatsappNumber || null,
        email: form.email || null,
        address: form.address || null,
        city: form.city || null,
        department: form.department || null,
        websiteUrl: form.websiteUrl || null,
        instagramUrl: form.instagramUrl || null,
        facebookUrl: form.facebookUrl || null,
        scheduleNote: form.scheduleNote || null,
        appointmentUrl: form.appointmentUrl || null,
        logoUrl: logoUrl || null,
        photoUrl: photoUrl || null,
        acceptsAppointments,
        offersHomeService,
        vehicleTypes,
        brands: brands.split(',').map((b) => b.trim()).filter(Boolean),
        categoryIds,
        locations: locations.filter((l) => l.city?.trim() || l.address?.trim()),
      })
      setSaved(true)
    } catch (err) {
      setError(apiError(err, 'No pudimos guardar los cambios.'))
    }
  }

  const handleDelete = async () => {
    setClosing(true)
    try {
      // Devuelve un token sin el rol: con el anterior el menú seguiría ofreciendo el panel.
      await leavePartner()
      client.setQueryData(['partner-me'], null)
      client.invalidateQueries({ queryKey: ['partner-directory'] })
    } catch (err) {
      setError(apiError(err, 'No pudimos cerrar el perfil.'))
    } finally {
      setClosing(false)
      setConfirmDelete(false)
    }
  }

  const setLocation = (index: number, patch: Partial<PartnerLocation>) =>
    setLocations((current) => current.map((l, i) => (i === index ? { ...l, ...patch } : l)))

  return (
    <>
      <PageHeader
        title={partner.name}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            {partner.isVerified && (
              <span className="chip-brand">
                <BadgeCheck className="size-3.5" />
                Verificado
              </span>
            )}
            <span className={partner.isActive ? 'chip-ok' : 'chip-warn'}>
              {partner.isActive ? 'Publicado en el directorio' : 'Pausado'}
            </span>
          </span>
        }
        actions={
          <>
            <Link
              to={`/aliados/${partner.publicSlug}`}
              target="_blank"
              className="btn-ghost btn-md"
            >
              <ExternalLink className="size-4" />
              Ver ficha pública
            </Link>
            <Button loading={update.isPending} onClick={submit}>
              Guardar cambios
            </Button>
          </>
        }
      />

      {error && (
        <div className="mb-4 flex items-start gap-2.5 rounded-2xl bg-danger-50 px-4 py-3 text-sm text-danger-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      )}

      {saved && (
        <div className="mb-4 rounded-2xl bg-ok-50 px-4 py-3 text-sm font-medium text-ok-700">
          Cambios guardados. Tu ficha pública ya está actualizada.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          {/* --- Identidad --- */}
          <section className="card card-pad">
            <h3 className="text-base">El negocio</h3>

            <div className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
                <Field label="Nombre" required>
                  <Input
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                  />
                </Field>
                <Field label="NIT" hint="Solo lo ves tú.">
                  <Input
                    value={form.legalId}
                    onChange={(event) => setForm({ ...form, legalId: event.target.value })}
                  />
                </Field>
              </div>

              <Field
                label="Descripción"
                hint="Cuenta qué haces y qué te diferencia. Aparece en tu ficha y en el directorio."
              >
                <Textarea
                  rows={4}
                  placeholder="Especialistas en frenos con más de 15 años. Atención el mismo día y garantía escrita."
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <ImageField
                  label="Logo"
                  url={logoUrl}
                  loading={uploading === 'logo'}
                  onPick={(file) => upload(file, 'logo')}
                  onClear={() => setLogoUrl('')}
                />
                <ImageField
                  label="Foto de portada"
                  url={photoUrl}
                  loading={uploading === 'photo'}
                  onPick={(file) => upload(file, 'photo')}
                  onClear={() => setPhotoUrl('')}
                />
              </div>
            </div>
          </section>

          {/* --- Contacto --- */}
          <section className="card card-pad">
            <h3 className="text-base">Contacto y ubicación</h3>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Teléfono">
                <Input
                  value={form.phone}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                />
              </Field>
              <Field label="WhatsApp" hint="Con indicativo del país: 573001112233.">
                <Input
                  value={form.whatsappNumber}
                  onChange={(event) => setForm({ ...form, whatsappNumber: event.target.value })}
                />
              </Field>
              <Field label="Correo de contacto">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                />
              </Field>
              <Field label="Dirección">
                <Input
                  value={form.address}
                  onChange={(event) => setForm({ ...form, address: event.target.value })}
                />
              </Field>
              <Field label="Departamento">
                <Input
                  value={form.department}
                  onChange={(event) => setForm({ ...form, department: event.target.value })}
                />
              </Field>
              <Field label="Ciudad" hint="Con esto te recomendamos a los vehículos de tu ciudad.">
                <Input
                  value={form.city}
                  onChange={(event) => setForm({ ...form, city: event.target.value })}
                />
              </Field>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Field label="Sitio web">
                <Input
                  placeholder="https://"
                  value={form.websiteUrl}
                  onChange={(event) => setForm({ ...form, websiteUrl: event.target.value })}
                />
              </Field>
              <Field label="Instagram">
                <Input
                  placeholder="https://instagram.com/"
                  value={form.instagramUrl}
                  onChange={(event) => setForm({ ...form, instagramUrl: event.target.value })}
                />
              </Field>
              <Field label="Facebook">
                <Input
                  placeholder="https://facebook.com/"
                  value={form.facebookUrl}
                  onChange={(event) => setForm({ ...form, facebookUrl: event.target.value })}
                />
              </Field>
            </div>
          </section>

          {/* --- Servicio --- */}
          <section className="card card-pad">
            <h3 className="text-base">Cómo atiendes</h3>

            <div className="mt-4 space-y-4">
              <Field label="Horario">
                <Input
                  placeholder="Lun a Vie 8am - 6pm, Sáb 8am - 1pm"
                  value={form.scheduleNote}
                  onChange={(event) => setForm({ ...form, scheduleNote: event.target.value })}
                />
              </Field>

              <Toggle
                checked={acceptsAppointments}
                onChange={setAcceptsAppointments}
                label="Recibo citas agendadas"
                description="Se muestra un botón para agendar en tu ficha pública."
              />

              {acceptsAppointments && (
                <Field label="Enlace para agendar" hint="Tu web de reservas o un enlace de WhatsApp.">
                  <Input
                    placeholder="https://wa.me/573001112233"
                    value={form.appointmentUrl}
                    onChange={(event) => setForm({ ...form, appointmentUrl: event.target.value })}
                  />
                </Field>
              )}

              <Toggle
                checked={offersHomeService}
                onChange={setOffersHomeService}
                label="Atiendo a domicilio o tengo grúa"
                description="Te damos prioridad cuando alguien ya tiene algo vencido y no puede mover el vehículo."
              />
            </div>
          </section>

          {/* --- Categorías --- */}
          <section className="card card-pad">
            <h3 className="text-base">Servicios que prestas</h3>
            <p className="mb-4 mt-1 text-sm text-carbon-500">
              Define por cuáles alertas te recomendamos. Marca solo lo que realmente atiendes.
            </p>
            <CategoryPicker value={categoryIds} onChange={setCategoryIds} />
          </section>

          {/* --- Vehículos y marcas --- */}
          <section className="card card-pad">
            <h3 className="text-base">A quién atiendes</h3>

            <div className="mt-4">
              <p className="label">Tipos de vehículo</p>
              <VehicleTypePicker value={vehicleTypes} onChange={setVehicleTypes} />
              <p className="mt-2 text-xs text-carbon-400">
                Sin marcar ninguno apareces para todos los vehículos.
              </p>
            </div>

            <Field
              className="mt-4"
              label="Marcas en las que te especializas"
              hint="Separadas por coma. Déjalo vacío si atiendes todas."
            >
              <Input
                placeholder="Mazda, Renault, Chevrolet"
                value={brands}
                onChange={(event) => setBrands(event.target.value)}
              />
            </Field>
          </section>

          {/* --- Sedes --- */}
          <section className="card card-pad">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base">Otras sedes</h3>
                <p className="mt-1 text-sm text-carbon-500">
                  Cada sede suma su ciudad a tu cobertura en el directorio.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                icon={<Plus className="size-4" />}
                onClick={() => setLocations([...locations, { name: '', city: '', address: '', phone: '' }])}
              >
                Agregar
              </Button>
            </div>

            {locations.length > 0 && (
              <ul className="mt-4 space-y-3">
                {locations.map((location, index) => (
                  <li key={index} className="rounded-2xl bg-carbon-50 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Nombre de la sede">
                        <Input
                          placeholder="Sede Norte"
                          value={location.name ?? ''}
                          onChange={(event) => setLocation(index, { name: event.target.value })}
                        />
                      </Field>
                      <Field label="Ciudad">
                        <Input
                          value={location.city ?? ''}
                          onChange={(event) => setLocation(index, { city: event.target.value })}
                        />
                      </Field>
                      <Field label="Dirección">
                        <Input
                          value={location.address ?? ''}
                          onChange={(event) => setLocation(index, { address: event.target.value })}
                        />
                      </Field>
                      <Field label="Teléfono">
                        <Input
                          value={location.phone ?? ''}
                          onChange={(event) => setLocation(index, { phone: event.target.value })}
                        />
                      </Field>
                    </div>

                    <button
                      type="button"
                      onClick={() => setLocations(locations.filter((_, i) => i !== index))}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-danger-600 hover:text-danger-700"
                    >
                      <Trash2 className="size-3.5" />
                      Quitar sede
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <Button size="lg" block loading={update.isPending} onClick={submit}>
            Guardar cambios
          </Button>
        </div>

        {/* --- Estado del perfil --- */}
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <section className="card card-pad">
            <h3 className="text-base">Visibilidad</h3>
            <p className="mt-1 text-sm text-carbon-500">
              Si pausas el perfil dejas de aparecer en el directorio y en las recomendaciones. Nada
              se borra.
            </p>

            <Toggle
              checked={partner.isActive}
              onChange={(active) => visibility.mutate(active)}
              disabled={visibility.isPending}
              label={partner.isActive ? 'Publicado' : 'Pausado'}
              description={partner.isActive ? 'Te pueden encontrar.' : 'Solo tú ves el perfil.'}
            />
          </section>

          <section className="card card-pad">
            <h3 className="text-base">Tu enlace</h3>
            <p className="mt-1 break-all text-sm text-carbon-500">/aliados/{partner.publicSlug}</p>
            <Link
              to={`/aliados/${partner.publicSlug}`}
              target="_blank"
              className="btn-ghost btn-sm mt-3 w-full"
            >
              <ExternalLink className="size-3.5" />
              Abrir
            </Link>
          </section>

          <section className="card card-pad">
            <h3 className="text-base">Cerrar el perfil</h3>
            <p className="mt-1 text-sm text-carbon-500">
              Se elimina el negocio del directorio. Tu cuenta y tu garaje personal se conservan.
            </p>
            <Button
              variant="danger"
              block
              className="mt-3"
              onClick={() => setConfirmDelete(true)}
              icon={<Trash2 className="size-4" />}
            >
              Cerrar perfil de aliado
            </Button>
          </section>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="¿Cerrar el perfil de aliado?"
        message="Tu negocio deja de aparecer en el directorio y en las recomendaciones. Tu cuenta y tus vehículos no se tocan."
        confirmLabel="Sí, cerrar el perfil"
        loading={closing}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />
    </>
  )
}

// ---------------------------------------------------------------- piezas compartidas

function VehicleTypePicker({
  value,
  onChange,
}: {
  value: VehicleType[]
  onChange: (types: VehicleType[]) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.keys(vehicleTypeLabels) as VehicleType[]).map((type) => {
        const active = value.includes(type)
        return (
          <button
            key={type}
            type="button"
            aria-pressed={active}
            onClick={() =>
              onChange(active ? value.filter((t) => t !== type) : [...value, type])
            }
            className={cn('chip-base', active ? 'chip-brand' : 'chip-neutral')}
          >
            {vehicleTypeLabels[type]}
          </button>
        )
      })}
    </div>
  )
}

function ImageField({
  label,
  url,
  loading,
  onPick,
  onClear,
}: {
  label: string
  url: string
  loading: boolean
  onPick: (file: File | undefined) => void
  onClear: () => void
}) {
  const preview = assetUrl(url)

  return (
    <div>
      <p className="label">{label}</p>
      <div className="flex items-center gap-3">
        <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-carbon-50 text-carbon-400 ring-1 ring-carbon-200">
          {preview ? (
            <img src={preview} alt="" className="size-full object-cover" />
          ) : (
            <ImagePlus className="size-5" />
          )}
        </span>

        <div className="flex flex-col gap-1.5">
          <label className={cn('btn-ghost btn-sm', loading && 'pointer-events-none opacity-50')}>
            {loading ? 'Subiendo...' : preview ? 'Cambiar' : 'Subir imagen'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => onPick(event.target.files?.[0])}
            />
          </label>
          {preview && (
            <button
              type="button"
              onClick={onClear}
              className="text-xs font-semibold text-carbon-500 hover:text-danger-600"
            >
              Quitar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
