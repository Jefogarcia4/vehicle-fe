import { useState } from 'react'
import { BadgeCheck, MapPin, Search, Store, X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { EmptyState, Skeleton } from '@/components/ui/feedback'
import { Input } from '@/components/ui/form'
import { apiError, assetUrl } from '@/lib/api'
import { cn } from '@/lib/cn'
import { CategoryIcon } from './CategoryIcon'
import { usePartnerDirectory, useSavePartnerToDirectory } from './hooks'
import type { VehicleType, Workshop } from '@/lib/types'

interface Props {
  open: boolean
  onClose: () => void
  /** Ciudad y tipo del vehículo: acota la búsqueda a lo que de verdad le sirve. */
  city?: string | null
  vehicleType?: VehicleType
  /** Recibe el taller ya creado en la libreta del usuario, listo para seleccionar. */
  onPick: (workshop: Workshop) => void
}

/**
 * Busca un aliado en el directorio y lo copia a la libreta del usuario. Se usa al registrar un
 * servicio: así el taller queda enlazado al aliado y el historial suma en un solo lugar.
 */
export function PartnerPickerModal({ open, onClose, city, vehicleType, onPick }: Props) {
  const [text, setText] = useState('')
  const [query, setQuery] = useState('')
  // La ciudad arranca activa pero se puede soltar: si el vehículo está en una ciudad donde
  // todavía no hay aliados, filtrar sin salida dejaría el buscador vacío y sin qué hacer.
  const [cityOnly, setCityOnly] = useState(true)

  const { data: partners, isLoading } = usePartnerDirectory({
    q: query || undefined,
    city: (cityOnly && city) || undefined,
    vehicleType,
  })
  const save = useSavePartnerToDirectory()

  const pick = async (partnerId: string) => {
    const workshop = await save.mutateAsync(partnerId)
    onPick(workshop)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Buscar en el directorio de aliados"
      description={
        city
          ? `Talleres y servicios en ${city} que atienden este vehículo.`
          : 'Talleres y servicios que atienden este vehículo.'
      }
      size="lg"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault()
          setQuery(text.trim())
        }}
        className="relative"
      >
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-carbon-400" />
        <Input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Busca por nombre o servicio"
          className="pl-10"
        />
      </form>

      {city && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCityOnly((only) => !only)}
            aria-pressed={cityOnly}
            className={cn('chip-base', cityOnly ? 'chip-brand' : 'chip-neutral')}
          >
            <MapPin className="size-3.5" />
            Solo en {city}
            {cityOnly && <X className="size-3" />}
          </button>
          {!cityOnly && (
            <span className="text-xs text-carbon-400">Mostrando aliados de todas las ciudades.</span>
          )}
        </div>
      )}

      {save.isError && (
        <p className="field-error">{apiError(save.error, 'No pudimos guardar el aliado.')}</p>
      )}

      <div className="scrollbar-thin mt-4 max-h-96 space-y-2 overflow-y-auto">
        {isLoading ? (
          Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-16" />)
        ) : partners?.length ? (
          partners.map((partner) => {
            const logo = assetUrl(partner.logoUrl)

            return (
              <button
                key={partner.id}
                type="button"
                disabled={save.isPending}
                onClick={() => pick(partner.id)}
                className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left ring-1 ring-carbon-100 transition hover:ring-brand-300 disabled:opacity-50"
              >
                <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-carbon-50 text-carbon-500">
                  {logo ? (
                    <img src={logo} alt="" className="size-full object-cover" />
                  ) : (
                    <CategoryIcon icon={partner.categories[0]?.icon} className="size-5" />
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-semibold text-carbon-900">
                      {partner.name}
                    </span>
                    {partner.isVerified && <BadgeCheck className="size-4 shrink-0 text-brand-600" />}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1 text-xs text-carbon-500">
                    <MapPin className="size-3.5 shrink-0" />
                    <span className="truncate">
                      {partner.cities.join(' · ')} ·{' '}
                      {partner.categories.map((category) => category.name).join(', ')}
                    </span>
                  </span>
                </span>
              </button>
            )
          })
        ) : (
          <EmptyState
            icon={<Store className="size-6" />}
            title="Sin resultados"
            description={
              cityOnly && city
                ? `Todavía no hay aliados en ${city} para este vehículo.`
                : 'Todavía no hay aliados que coincidan. Puedes escribir el nombre del taller a mano.'
            }
            action={
              cityOnly && city ? (
                <button type="button" onClick={() => setCityOnly(false)} className="btn-ghost btn-md">
                  Buscar en todas las ciudades
                </button>
              ) : undefined
            }
          />
        )}
      </div>
    </Modal>
  )
}
