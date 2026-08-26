import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  BellOff,
  CalendarClock,
  Car,
  Mail,
  Megaphone,
  Search,
  Smartphone,
  Upload,
  UserPlus,
  Users,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { EmptyState, Skeleton } from '@/components/ui/feedback'
import { Input, Select } from '@/components/ui/form'
import { StatTile } from '@/components/ui/indicators'
import { cn } from '@/lib/cn'
import { date as formatDate, money, relativeDays } from '@/lib/format'
import { customerSourceLabels } from '@/lib/labels'
import { CustomerFormModal } from '@/features/crm/CustomerFormModal'
import { useCrmCities, useCrmSummary, useCustomers } from '@/features/crm/hooks'
import type { CustomerListItem } from '@/lib/types'

/** Tablero del CRM y lista de clientes. Es la pantalla de entrada del panel del negocio. */
export default function CrmCustomersPage() {
  const [params, setParams] = useSearchParams()
  const [text, setText] = useState(params.get('q') ?? '')
  const [creating, setCreating] = useState(false)

  const filters = {
    q: params.get('q') || undefined,
    city: params.get('ciudad') || undefined,
    subscribed: params.get('estado') === 'suscritos' ? true
      : params.get('estado') === 'baja' ? false
      : undefined,
    expiringWithinDays: params.get('vence') ? Number(params.get('vence')) : undefined,
    page: Number(params.get('pagina') ?? 1),
  }

  const { data: summary } = useCrmSummary()
  const { data: cities } = useCrmCities()
  const { data, isLoading } = useCustomers(filters)

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    // Cambiar un filtro con la lista en la página 3 mostraría un vacío engañoso.
    next.delete('pagina')
    setParams(next, { replace: true })
  }

  const customers = data?.items ?? []
  const pages = data ? Math.ceil(data.total / data.pageSize) : 1

  return (
    <>
      <PageHeader
        title="Clientes"
        subtitle="Tu base de clientes y sus vehículos. De aquí salen las campañas."
        actions={
          <>
            <Link to="/app/crm/importar" className="btn-ghost btn-md">
              <Upload className="size-4" />
              Importar
            </Link>
            <Button icon={<UserPlus className="size-4" />} onClick={() => setCreating(true)}>
              Nuevo cliente
            </Button>
          </>
        }
      />

      {/* --- Estado de la base --- */}
      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          icon={<Users className="size-5" />}
          label="Clientes"
          value={summary ? String(summary.customerCount) : '—'}
          hint={`${summary?.vehicleCount ?? 0} vehículos registrados`}
        />
        <StatTile
          icon={<Mail className="size-5" />}
          label="Pueden recibir campañas"
          value={summary ? String(summary.subscribedCount) : '—'}
          hint={`${summary?.appUserCount ?? 0} también usan la app`}
          tone="brand"
        />
        <StatTile
          icon={<CalendarClock className="size-5" />}
          label="Por vencer en 30 días"
          value={summary ? String(summary.expiringSoonCount) : '—'}
          hint={`${summary?.expiredCount ?? 0} ya vencidos`}
          tone={summary && summary.expiringSoonCount > 0 ? 'warn' : undefined}
        />
        <StatTile
          icon={<Megaphone className="size-5" />}
          label="Mensajes enviados"
          value={summary ? String(summary.messagesSent) : '—'}
          hint={`${summary?.campaignCount ?? 0} campañas`}
        />
      </section>

      {/* Sin SMTP los correos se registran pero no salen: decirlo evita que alguien crea que envió. */}
      {summary && !summary.emailEnabled && (
        <div className="mb-6 flex items-start gap-2.5 rounded-2xl bg-warn-50 px-4 py-3 text-sm text-warn-800">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>
            El envío de correo no está configurado en el servidor, así que los correos se simulan
            y quedan registrados sin salir. Los avisos en la app y los enlaces de WhatsApp sí
            funcionan.
          </span>
        </div>
      )}

      {/* --- Filtros --- */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            update('q', text.trim())
          }}
          className="relative min-w-56 flex-1"
        >
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-carbon-400" />
          <Input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Nombre, correo, celular o placa"
            className="pl-10"
          />
        </form>

        <Select
          className="w-auto min-w-40"
          placeholder="Todas las ciudades"
          options={(cities ?? []).map((city) => ({ value: city, label: city }))}
          value={params.get('ciudad') ?? ''}
          onChange={(event) => update('ciudad', event.target.value)}
        />

        <Select
          className="w-auto min-w-44"
          placeholder="Todos los estados"
          options={[
            { value: 'suscritos', label: 'Pueden recibir campañas' },
            { value: 'baja', label: 'Dados de baja o sin permiso' },
          ]}
          value={params.get('estado') ?? ''}
          onChange={(event) => update('estado', event.target.value)}
        />

        <Select
          className="w-auto min-w-40"
          placeholder="Cualquier vencimiento"
          options={[
            { value: '15', label: 'Vence en 15 días' },
            { value: '30', label: 'Vence en 30 días' },
            { value: '60', label: 'Vence en 60 días' },
          ]}
          value={params.get('vence') ?? ''}
          onChange={(event) => update('vence', event.target.value)}
        />
      </div>

      {/* --- Lista --- */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <EmptyState
          icon={<Users className="size-6" />}
          title={data?.total === 0 ? 'Todavía no tienes clientes' : 'Nada con estos filtros'}
          description={
            data?.total === 0
              ? 'Cárgalos desde la hoja de cálculo que ya tienes, o agrégalos uno por uno.'
              : 'Prueba con otra búsqueda o quita algún filtro.'
          }
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link to="/app/crm/importar" className="btn-ghost btn-md">
                <Upload className="size-4" />
                Importar CSV
              </Link>
              <Button icon={<UserPlus className="size-4" />} onClick={() => setCreating(true)}>
                Nuevo cliente
              </Button>
            </div>
          }
        />
      ) : (
        <>
          <p className="mb-2 text-sm text-carbon-500">
            {data!.total} {data!.total === 1 ? 'cliente' : 'clientes'}
          </p>

          <ul className="space-y-2">
            {customers.map((customer) => (
              <CustomerRow key={customer.id} customer={customer} />
            ))}
          </ul>

          {pages > 1 && (
            <div className="mt-5 flex items-center justify-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={filters.page <= 1}
                onClick={() => update('pagina', String(filters.page - 1))}
              >
                Anterior
              </Button>
              <span className="text-sm text-carbon-500">
                Página {filters.page} de {pages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={filters.page >= pages}
                onClick={() => update('pagina', String(filters.page + 1))}
              >
                Siguiente
              </Button>
            </div>
          )}
        </>
      )}

      <CustomerFormModal open={creating} onClose={() => setCreating(false)} />
    </>
  )
}

function CustomerRow({ customer }: { customer: CustomerListItem }) {
  const days = customer.daysToNextExpiry
  const urgent = days != null && days <= 30

  return (
    <li>
      <Link
        to={`/app/crm/clientes/${customer.id}`}
        className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-white px-4 py-3.5 ring-1 ring-carbon-100 transition hover:ring-brand-200"
      >
        <div className="min-w-44 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-carbon-900">{customer.fullName}</p>
            {customer.isAppUser && (
              <span title="También usa Rueda Al Día">
                <Smartphone className="size-3.5 shrink-0 text-brand-500" />
              </span>
            )}
            {customer.isUnsubscribed ? (
              <span title="Se dio de baja">
                <BellOff className="size-3.5 shrink-0 text-danger-500" />
              </span>
            ) : (
              !customer.acceptsMarketing && (
                <span className="chip-neutral shrink-0 text-[0.65rem]">Sin permiso</span>
              )
            )}
          </div>
          <p className="truncate text-xs text-carbon-500">
            {[customer.email, customer.phone].filter(Boolean).join(' · ') || 'Sin contacto'}
            {customer.city ? ` · ${customer.city}` : ''}
          </p>
        </div>

        <div className="min-w-32">
          <p className="flex items-center gap-1.5 text-xs text-carbon-500">
            <Car className="size-3.5" />
            {customer.plates.slice(0, 2).join(', ') || 'Sin vehículos'}
            {customer.plates.length > 2 && ` +${customer.plates.length - 2}`}
          </p>
          <p className="mt-0.5 text-[0.7rem] text-carbon-400">
            {customerSourceLabels[customer.source]}
          </p>
        </div>

        <div className="min-w-28 text-xs text-carbon-500">
          {customer.lastVisitDate ? (
            <>
              <p>Última visita</p>
              <p className="font-medium text-carbon-700">{formatDate(customer.lastVisitDate)}</p>
            </>
          ) : (
            <p className="text-carbon-400">Sin visitas</p>
          )}
        </div>

        <div className="min-w-24 text-right text-xs">
          <p className="font-semibold text-carbon-700">{money(customer.totalSpent)}</p>
          <p className="text-carbon-400">
            {customer.visitCount} {customer.visitCount === 1 ? 'servicio' : 'servicios'}
          </p>
        </div>

        {days != null && (
          <span className={cn('shrink-0', urgent ? (days < 0 ? 'chip-danger' : 'chip-warn') : 'chip-neutral')}>
            {customer.nextExpiryLabel} {relativeDays(days)}
          </span>
        )}
      </Link>
    </li>
  )
}
