import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  BellOff,
  Car,
  MapPin,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  ShieldCheck,
  Smartphone,
  Trash2,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ErrorState, Loading } from '@/components/ui/feedback'
import { apiError } from '@/lib/api'
import { cn } from '@/lib/cn'
import { date as formatDate, money, num, relativeDays } from '@/lib/format'
import { customerSourceLabels, vehicleTypeLabels } from '@/lib/labels'
import { CustomerFormModal } from '@/features/crm/CustomerFormModal'
import { CustomerVehicleModal } from '@/features/crm/CustomerVehicleModal'
import { useCustomer, useDeleteCustomer, useDeleteCustomerVehicle } from '@/features/crm/hooks'
import type { CustomerVehicle } from '@/lib/types'

/** Ficha del cliente: su contacto, su consentimiento y los vehículos que le atiende el taller. */
export default function CustomerDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // "Hoy" se fija al abrir la ficha: dentro de una misma sesión no cambia, y leer el reloj en
  // cada render hace impredecible lo que se pinta.
  const [today] = useState(() => Date.now())

  const { data: customer, isLoading, error } = useCustomer(id)
  const removeCustomer = useDeleteCustomer()
  const removeVehicle = useDeleteCustomerVehicle()

  const [editing, setEditing] = useState(false)
  const [vehicleForm, setVehicleForm] = useState<{ open: boolean; vehicle?: CustomerVehicle }>({ open: false })
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [vehicleToDelete, setVehicleToDelete] = useState<CustomerVehicle | null>(null)

  if (isLoading) return <Loading />
  if (error || !customer) return <ErrorState message={apiError(error, 'Este cliente no existe.')} />

  const whatsapp = customer.phone?.replace(/\D/g, '')

  return (
    <>
      <PageHeader
        title={customer.fullName}
        backTo="/app/crm"
        backLabel="Clientes"
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <span className="chip-neutral">{customerSourceLabels[customer.source]}</span>
            {customer.isAppUser && (
              <span className="chip-brand">
                <Smartphone className="size-3" />
                Usa Rueda Al Día
              </span>
            )}
            {customer.isUnsubscribed ? (
              <span className="chip-danger">
                <BellOff className="size-3" />
                Se dio de baja
              </span>
            ) : customer.acceptsMarketing ? (
              <span className="chip-ok">
                <ShieldCheck className="size-3" />
                Acepta campañas
              </span>
            ) : (
              <span className="chip-warn">Sin permiso para escribirle</span>
            )}
          </span>
        }
        actions={
          <>
            <Button variant="ghost" icon={<Pencil className="size-4" />} onClick={() => setEditing(true)}>
              Editar
            </Button>
            <Button
              variant="danger"
              icon={<Trash2 className="size-4" />}
              onClick={() => setConfirmDelete(true)}
            >
              Eliminar
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        {/* --- Vehículos --- */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg">Vehículos</h2>
            <Button
              variant="ghost"
              size="sm"
              icon={<Plus className="size-4" />}
              onClick={() => setVehicleForm({ open: true })}
            >
              Agregar vehículo
            </Button>
          </div>

          {customer.vehicles.length === 0 ? (
            <div className="card card-pad text-sm text-carbon-500">
              Sin vehículos registrados. Agrégale uno con su placa y las fechas de SOAT y
              tecnomecánica: es lo que permite recordarle a tiempo.
            </div>
          ) : (
            <ul className="space-y-3">
              {customer.vehicles.map((vehicle) => (
                <li key={vehicle.id} className="card card-pad">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-carbon-50 text-carbon-500">
                        <Car className="size-5" />
                      </span>
                      <div>
                        <p className="font-display text-base font-semibold text-carbon-900">
                          {vehicle.plate}
                        </p>
                        <p className="text-xs text-carbon-500">
                          {[vehicle.brand, vehicle.model, vehicle.year]
                            .filter(Boolean)
                            .join(' ') || vehicleTypeLabels[vehicle.type]}
                          {vehicle.odometer != null && ` · ${num(vehicle.odometer)} km`}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setVehicleForm({ open: true, vehicle })}
                        className="flex size-8 items-center justify-center rounded-lg text-carbon-400 transition hover:bg-carbon-50 hover:text-brand-600"
                        aria-label="Editar vehículo"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setVehicleToDelete(vehicle)}
                        className="flex size-8 items-center justify-center rounded-lg text-carbon-400 transition hover:bg-danger-50 hover:text-danger-600"
                        aria-label="Quitar vehículo"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>

                  <dl className="mt-4 grid gap-3 border-t border-carbon-100 pt-3 sm:grid-cols-4">
                    <Expiry label="SOAT" date={vehicle.soatExpiry} today={today} />
                    <Expiry
                      label="Tecnomecánica"
                      date={vehicle.technicalInspectionExpiry}
                      today={today}
                    />
                    <div>
                      <dt className="text-[0.7rem] font-semibold uppercase tracking-wide text-carbon-400">
                        Último servicio
                      </dt>
                      <dd className="mt-0.5 text-sm text-carbon-700">
                        {vehicle.lastServiceDate ? formatDate(vehicle.lastServiceDate) : '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[0.7rem] font-semibold uppercase tracking-wide text-carbon-400">
                        Próximo servicio
                      </dt>
                      <dd className="mt-0.5 text-sm text-carbon-700">
                        {vehicle.nextServiceDate
                          ? formatDate(vehicle.nextServiceDate)
                          : vehicle.nextServiceOdometer
                            ? `${num(vehicle.nextServiceOdometer)} km`
                            : '—'}
                      </dd>
                    </div>
                  </dl>

                  {vehicle.notes && (
                    <p className="mt-3 text-xs text-carbon-500">{vehicle.notes}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* --- Contacto y relación --- */}
        <aside className="space-y-4">
          <section className="card card-pad">
            <h3 className="text-base">Contacto</h3>

            <div className="mt-3 space-y-2 text-sm text-carbon-600">
              {customer.email && (
                <p className="flex items-center gap-2">
                  <Mail className="size-3.5 shrink-0 text-carbon-400" />
                  <a href={`mailto:${customer.email}`} className="truncate hover:text-brand-600">
                    {customer.email}
                  </a>
                </p>
              )}
              {customer.phone && (
                <p className="flex items-center gap-2">
                  <Phone className="size-3.5 shrink-0 text-carbon-400" />
                  <a href={`tel:${customer.phone}`} className="hover:text-brand-600">
                    {customer.phone}
                  </a>
                </p>
              )}
              {(customer.address || customer.city) && (
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-carbon-400" />
                  <span>{[customer.address, customer.city].filter(Boolean).join(', ')}</span>
                </p>
              )}
              {customer.documentId && (
                <p className="text-xs text-carbon-400">Documento: {customer.documentId}</p>
              )}
            </div>

            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp.length === 10 ? '57' + whatsapp : whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost btn-sm mt-4 w-full"
              >
                <MessageCircle className="size-3.5" />
                Escribir por WhatsApp
              </a>
            )}
          </section>

          <section className="card card-pad">
            <h3 className="text-base">Relación</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-carbon-500">Servicios</dt>
                <dd className="font-semibold text-carbon-800">{customer.visitCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-carbon-500">Total gastado</dt>
                <dd className="font-semibold text-carbon-800">{money(customer.totalSpent)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-carbon-500">Última visita</dt>
                <dd className="font-semibold text-carbon-800">
                  {customer.lastVisitDate ? formatDate(customer.lastVisitDate) : '—'}
                </dd>
              </div>
            </dl>
          </section>

          <section className="card card-pad">
            <h3 className="text-base">Consentimiento</h3>
            {customer.isUnsubscribed ? (
              <p className="mt-2 text-sm text-danger-700">
                Se dio de baja el {formatDate(customer.unsubscribedAtUtc)}. No entra a ninguna
                campaña y solo él puede revertirlo.
              </p>
            ) : customer.acceptsMarketing ? (
              <p className="mt-2 text-sm text-carbon-600">
                Autorizó recibir recordatorios
                {customer.consentAtUtc ? ` el ${formatDate(customer.consentAtUtc)}` : ''}.
              </p>
            ) : (
              <p className="mt-2 text-sm text-carbon-600">
                No has registrado su autorización, así que no entra a las campañas. Pídesela y
                márcala al editarlo.
              </p>
            )}
          </section>

          {customer.notes && (
            <section className="card card-pad">
              <h3 className="text-base">Notas</h3>
              <p className="mt-2 whitespace-pre-line text-sm text-carbon-600">{customer.notes}</p>
            </section>
          )}
        </aside>
      </div>

      {editing && (
        <CustomerFormModal open onClose={() => setEditing(false)} customer={customer} />
      )}

      {vehicleForm.open && (
        <CustomerVehicleModal
          open
          onClose={() => setVehicleForm({ open: false })}
          customerId={customer.id}
          vehicle={vehicleForm.vehicle}
        />
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Eliminar cliente"
        message={`Se borrará ${customer.fullName}, sus vehículos y su historial de envíos.`}
        loading={removeCustomer.isPending}
        onConfirm={async () => {
          await removeCustomer.mutateAsync(customer.id)
          navigate('/app/crm', { replace: true })
        }}
        onCancel={() => setConfirmDelete(false)}
      />

      <ConfirmDialog
        open={!!vehicleToDelete}
        title="Quitar vehículo"
        message={`Se quitará la placa ${vehicleToDelete?.plate} de este cliente.`}
        confirmLabel="Quitar"
        loading={removeVehicle.isPending}
        onConfirm={async () => {
          if (vehicleToDelete) {
            await removeVehicle.mutateAsync({ customerId: customer.id, vehicleId: vehicleToDelete.id })
          }
          setVehicleToDelete(null)
        }}
        onCancel={() => setVehicleToDelete(null)}
      />
    </>
  )
}

/** Fecha de vencimiento con su urgencia: es lo que el taller mira primero. */
function Expiry({
  label,
  date,
  today,
}: {
  label: string
  date?: string | null
  /** Marca de tiempo fijada por la página, para no leer el reloj durante el render. */
  today: number
}) {
  const days = date ? Math.round((new Date(date).getTime() - today) / 86_400_000) : null

  return (
    <div>
      <dt className="text-[0.7rem] font-semibold uppercase tracking-wide text-carbon-400">{label}</dt>
      <dd className="mt-0.5 text-sm">
        {date ? (
          <span
            className={cn(
              'font-medium',
              days != null && days < 0
                ? 'text-danger-600'
                : days != null && days <= 30
                  ? 'text-warn-600'
                  : 'text-carbon-700',
            )}
          >
            {formatDate(date)}
            {days != null && (
              <span className="ml-1 text-xs font-normal opacity-80">({relativeDays(days)})</span>
            )}
          </span>
        ) : (
          <span className="text-carbon-400">—</span>
        )}
      </dd>
    </div>
  )
}
