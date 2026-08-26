import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Store, X } from 'lucide-react'
import { PartnerCard } from '@/components/PartnerCard'
import { PublicShell } from '@/components/layout/PublicShell'
import { EmptyState, Skeleton } from '@/components/ui/feedback'
import { Input, Select } from '@/components/ui/form'
import { cn } from '@/lib/cn'
import { toOptions, vehicleTypeLabels } from '@/lib/labels'
import { CategoryIcon } from '@/features/partners/CategoryIcon'
import { usePartnerCategories, usePartnerCities, usePartnerDirectory } from '@/features/partners/hooks'
import type { VehicleType } from '@/lib/types'

/**
 * Directorio abierto de aliados. Los filtros viven en la URL para que un enlace a
 * "montallantas en Medellín" se pueda compartir tal cual.
 */
export default function PartnerDirectoryPage() {
  const [params, setParams] = useSearchParams()

  const category = params.get('categoria') ?? ''
  const city = params.get('ciudad') ?? ''
  const vehicleType = (params.get('tipo') ?? '') as VehicleType | ''
  const [text, setText] = useState(params.get('q') ?? '')

  const query = useMemo(
    () => ({
      category: category || undefined,
      city: city || undefined,
      q: params.get('q') || undefined,
      vehicleType: vehicleType || undefined,
    }),
    [category, city, vehicleType, params],
  )

  const { data: partners, isLoading } = usePartnerDirectory(query)
  const { data: categories } = usePartnerCategories()
  const { data: cities } = usePartnerCities()

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const clear = () => {
    setText('')
    setParams(new URLSearchParams(), { replace: true })
  }

  const hasFilters = !!(category || city || vehicleType || params.get('q'))

  return (
    <PublicShell>
      {/* --- Encabezado --- */}
      <section className="relative overflow-hidden bg-carbon-950 py-14 text-white">
        <div className="grid-noise absolute inset-0 opacity-60" />
        <div
          className="absolute -right-24 -top-28 size-[28rem] rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, #a90b0b 0%, transparent 65%)' }}
        />

        <div className="container-app relative">
          <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
            Talleres y servicios <span className="text-brand-400">de confianza</span>
          </h1>
          <p className="mt-3 max-w-xl text-carbon-300">
            Frenos, aceite, llantas, tecnomecánica y todo lo que tu vehículo necesita, en un solo
            directorio. Rueda Al Día te los recuerda cuando se acerca el vencimiento.
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault()
              update('q', text.trim())
            }}
            className="mt-7 flex max-w-lg gap-2"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-carbon-400" />
              <Input
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Busca por nombre o servicio"
                className="pl-10"
              />
            </div>
            <button type="submit" className="btn-primary btn-md">
              Buscar
            </button>
          </form>
        </div>
      </section>

      <div className="container-app py-8">
        {/* --- Categorías --- */}
        <div className="scrollbar-thin -mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
          <button
            type="button"
            onClick={() => update('categoria', '')}
            className={cn('chip-base shrink-0', category ? 'chip-neutral' : 'chip-brand')}
          >
            Todas
          </button>

          {(categories ?? []).map((item) => {
            const active = category === item.slug

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => update('categoria', active ? '' : item.slug)}
                className={cn('chip-base shrink-0', active ? 'chip-brand' : 'chip-neutral')}
              >
                <CategoryIcon icon={item.icon} className="size-3.5" />
                {item.name}
                {item.partnerCount > 0 && (
                  <span className="text-[0.65rem] opacity-60">{item.partnerCount}</span>
                )}
              </button>
            )
          })}
        </div>

        {/* --- Filtros --- */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Select
            className="w-auto min-w-44"
            placeholder="Todas las ciudades"
            options={(cities ?? []).map((name) => ({ value: name, label: name }))}
            value={city}
            onChange={(event) => update('ciudad', event.target.value)}
          />
          <Select
            className="w-auto min-w-44"
            placeholder="Cualquier vehículo"
            options={toOptions(vehicleTypeLabels)}
            value={vehicleType}
            onChange={(event) => update('tipo', event.target.value)}
          />
          {hasFilters && (
            <button type="button" onClick={clear} className="btn-ghost btn-sm">
              <X className="size-3.5" />
              Limpiar filtros
            </button>
          )}
        </div>

        {/* --- Resultados --- */}
        <div className="mt-6">
          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-36" />
              ))}
            </div>
          ) : partners?.length ? (
            <>
              <p className="mb-3 text-sm text-carbon-500">
                {partners.length} {partners.length === 1 ? 'aliado' : 'aliados'}
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {partners.map((partner) => (
                  <PartnerCard key={partner.id} partner={partner} />
                ))}
              </div>
            </>
          ) : (
            <EmptyState
              icon={<Store className="size-6" />}
              title="Todavía no hay aliados aquí"
              description={
                hasFilters
                  ? 'Prueba con menos filtros o busca en otra ciudad.'
                  : 'El directorio está empezando. Si tienes un taller, este es buen momento para publicarlo.'
              }
              action={
                hasFilters ? (
                  <button type="button" onClick={clear} className="btn-ghost btn-md">
                    Limpiar filtros
                  </button>
                ) : undefined
              }
            />
          )}
        </div>
      </div>
    </PublicShell>
  )
}
