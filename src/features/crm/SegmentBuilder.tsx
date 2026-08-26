import { CalendarClock, Car, Gauge, MapPin, UserX } from 'lucide-react'
import { Field, Input, Select, Toggle } from '@/components/ui/form'
import { cn } from '@/lib/cn'
import { vehicleTypeLabels } from '@/lib/labels'
import { useCrmCities } from './hooks'
import type { CampaignSegment, VehicleType } from '@/lib/types'

interface Props {
  value: CampaignSegment
  onChange: (segment: CampaignSegment) => void
  disabled?: boolean
}

export const emptySegment: CampaignSegment = {
  expiringWithinDays: null,
  includeSoat: false,
  includeTechnicalInspection: false,
  includeService: false,
  inactiveForMonths: null,
  vehicleTypes: [],
  brands: [],
  minOdometer: null,
  maxOdometer: null,
  cities: [],
  locationId: null,
}

/**
 * Constructor del segmento. Cada bloque se apaga por completo cuando no se usa, para que quede
 * claro qué está filtrando de verdad: un formulario con diez campos vacíos no dice si el
 * segmento son todos los clientes o ninguno.
 */
export function SegmentBuilder({ value, onChange, disabled }: Props) {
  const { data: cities } = useCrmCities()

  const set = (patch: Partial<CampaignSegment>) => onChange({ ...value, ...patch })

  const expiryOn = value.expiringWithinDays != null
  const inactiveOn = value.inactiveForMonths != null
  const odometerOn = value.minOdometer != null || value.maxOdometer != null

  const toggleType = (type: VehicleType) =>
    set({
      vehicleTypes: value.vehicleTypes.includes(type)
        ? value.vehicleTypes.filter((t) => t !== type)
        : [...value.vehicleTypes, type],
    })

  return (
    <div className={cn('space-y-3', disabled && 'pointer-events-none opacity-60')}>
      {/* --- Vencimientos: es la razón de ser del módulo --- */}
      <Block
        icon={<CalendarClock className="size-[18px]" />}
        title="Algo por vencerse"
        description="El caso más útil: llamarlos justo antes de que se les venza."
        active={expiryOn}
        onToggle={(on) =>
          set(
            on
              ? { expiringWithinDays: 30, includeSoat: true, includeTechnicalInspection: true }
              : {
                  expiringWithinDays: null,
                  includeSoat: false,
                  includeTechnicalInspection: false,
                  includeService: false,
                },
          )
        }
      >
        <Field label="Dentro de">
          <Select
            options={[
              { value: '7', label: '7 días' },
              { value: '15', label: '15 días' },
              { value: '30', label: '30 días' },
              { value: '45', label: '45 días' },
              { value: '60', label: '60 días' },
              { value: '90', label: '90 días' },
            ]}
            value={String(value.expiringWithinDays ?? 30)}
            onChange={(event) => set({ expiringWithinDays: Number(event.target.value) })}
          />
        </Field>

        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { key: 'includeSoat' as const, label: 'SOAT' },
            { key: 'includeTechnicalInspection' as const, label: 'Tecnomecánica' },
            { key: 'includeService' as const, label: 'Mantenimiento' },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              aria-pressed={value[key]}
              onClick={() => set({ [key]: !value[key] } as Partial<CampaignSegment>)}
              className={cn('chip-base', value[key] ? 'chip-brand' : 'chip-neutral')}
            >
              {label}
            </button>
          ))}
        </div>

        <p className="mt-2 text-xs text-carbon-400">
          Incluye también lo que ya se venció: es a quien más urge llamar.
        </p>
      </Block>

      {/* --- Inactividad --- */}
      <Block
        icon={<UserX className="size-[18px]" />}
        title="Hace rato no vienen"
        description="La campaña de recuperación."
        active={inactiveOn}
        onToggle={(on) => set({ inactiveForMonths: on ? 6 : null })}
      >
        <Field label="Sin visita hace más de">
          <Select
            options={[
              { value: '3', label: '3 meses' },
              { value: '6', label: '6 meses' },
              { value: '12', label: '1 año' },
              { value: '24', label: '2 años' },
            ]}
            value={String(value.inactiveForMonths ?? 6)}
            onChange={(event) => set({ inactiveForMonths: Number(event.target.value) })}
          />
        </Field>
      </Block>

      {/* --- Vehículo --- */}
      <Block
        icon={<Car className="size-[18px]" />}
        title="Por vehículo"
        description="Para promociones específicas: llantas para SUV, sincronización a los 60.000."
        active={value.vehicleTypes.length > 0 || value.brands.length > 0}
        onToggle={(on) => (on ? set({ vehicleTypes: ['Car'] }) : set({ vehicleTypes: [], brands: [] }))}
      >
        <p className="label">Tipos</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(vehicleTypeLabels) as VehicleType[]).map((type) => (
            <button
              key={type}
              type="button"
              aria-pressed={value.vehicleTypes.includes(type)}
              onClick={() => toggleType(type)}
              className={cn('chip-base', value.vehicleTypes.includes(type) ? 'chip-brand' : 'chip-neutral')}
            >
              {vehicleTypeLabels[type]}
            </button>
          ))}
        </div>

        <Field className="mt-3" label="Marcas" hint="Separadas por coma. Vacío incluye todas.">
          <Input
            placeholder="Mazda, Renault"
            value={value.brands.join(', ')}
            onChange={(event) =>
              set({
                brands: event.target.value
                  .split(',')
                  .map((b) => b.trim())
                  .filter(Boolean),
              })
            }
          />
        </Field>
      </Block>

      {/* --- Kilometraje --- */}
      <Block
        icon={<Gauge className="size-[18px]" />}
        title="Por kilometraje"
        description="Rango del último kilometraje registrado."
        active={odometerOn}
        onToggle={(on) => set(on ? { minOdometer: 50000 } : { minOdometer: null, maxOdometer: null })}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Desde">
            <Input
              type="number"
              suffix="km"
              value={value.minOdometer?.toString() ?? ''}
              onChange={(event) =>
                set({ minOdometer: event.target.value ? Number(event.target.value) : null })
              }
            />
          </Field>
          <Field label="Hasta">
            <Input
              type="number"
              suffix="km"
              value={value.maxOdometer?.toString() ?? ''}
              onChange={(event) =>
                set({ maxOdometer: event.target.value ? Number(event.target.value) : null })
              }
            />
          </Field>
        </div>
      </Block>

      {/* --- Ciudad --- */}
      <Block
        icon={<MapPin className="size-[18px]" />}
        title="Por ciudad"
        description="Útil si tienes varias sedes."
        active={value.cities.length > 0}
        onToggle={(on) => set({ cities: on && cities?.length ? [cities[0]] : [] })}
      >
        {cities?.length ? (
          <div className="flex flex-wrap gap-2">
            {cities.map((city) => (
              <button
                key={city}
                type="button"
                aria-pressed={value.cities.includes(city)}
                onClick={() =>
                  set({
                    cities: value.cities.includes(city)
                      ? value.cities.filter((c) => c !== city)
                      : [...value.cities, city],
                  })
                }
                className={cn('chip-base', value.cities.includes(city) ? 'chip-brand' : 'chip-neutral')}
              >
                {city}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-carbon-500">Tus clientes todavía no tienen ciudad registrada.</p>
        )}
      </Block>
    </div>
  )
}

interface BlockProps {
  icon: React.ReactNode
  title: string
  description: string
  active: boolean
  onToggle: (active: boolean) => void
  children: React.ReactNode
}

function Block({ icon, title, description, active, onToggle, children }: BlockProps) {
  return (
    <section
      className={cn(
        'rounded-2xl p-4 ring-1 transition',
        active ? 'bg-white ring-brand-200' : 'bg-carbon-50 ring-transparent',
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-xl',
            active ? 'bg-brand-50 text-brand-600' : 'bg-white text-carbon-400',
          )}
        >
          {icon}
        </span>

        <div className="min-w-0 flex-1">
          <Toggle
            checked={active}
            onChange={onToggle}
            label={title}
            description={description}
          />
        </div>
      </div>

      {active && <div className="mt-4 pl-12">{children}</div>}
    </section>
  )
}
