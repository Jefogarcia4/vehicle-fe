import { Bike, Bus, Car, Truck } from 'lucide-react'
import { assetUrl } from '@/lib/api'
import { cn } from '@/lib/cn'
import type { VehicleType } from '@/lib/types'

const icons: Record<VehicleType, typeof Car> = {
  Car,
  Motorcycle: Bike,
  Pickup: Truck,
  Suv: Car,
  Van: Truck,
  Truck,
  Bus,
  Other: Car,
}

/** Ícono del tipo de vehículo, para usarlo suelto en listas y menús. */
export function VehicleTypeIcon({ type, className }: { type: VehicleType; className?: string }) {
  const Icon = icons[type] ?? Car
  return <Icon className={className} />
}

interface Props {
  type: VehicleType
  photoUrl?: string | null
  name?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'size-10 rounded-xl',
  md: 'size-14 rounded-2xl',
  lg: 'size-20 rounded-3xl',
}

const iconSizes = { sm: 'size-5', md: 'size-6', lg: 'size-9' }

/** Foto del vehículo, o el ícono de su tipo cuando aún no se ha subido ninguna. */
export function VehicleAvatar({ type, photoUrl, name, size = 'md', className }: Props) {
  const url = assetUrl(photoUrl)

  if (url) {
    return (
      <img
        src={url}
        alt={name ?? 'Vehículo'}
        className={cn('object-cover ring-1 ring-carbon-100', sizes[size], className)}
      />
    )
  }

  return (
    <span
      className={cn(
        'flex items-center justify-center bg-brand-50 text-brand-600 ring-1 ring-brand-100',
        sizes[size],
        className,
      )}
    >
      <VehicleTypeIcon type={type} className={iconSizes[size]} />
    </span>
  )
}
