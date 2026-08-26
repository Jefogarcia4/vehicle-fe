import {
  AirVent,
  BatteryCharging,
  BriefcaseMedical,
  CarFront,
  CircleDot,
  ClipboardCheck,
  Cog,
  Crosshair,
  Disc,
  Droplet,
  Droplets,
  FileText,
  Fuel,
  Package,
  PaintRoller,
  ScanLine,
  ShieldCheck,
  Speaker,
  Thermometer,
  Timer,
  Truck,
  Wind,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react'

/**
 * Las categorías se editan en la base, así que su ícono viaja como texto. Este mapa lo
 * resuelve; cualquier clave desconocida cae en la llave inglesa.
 */
const icons: Record<string, LucideIcon> = {
  wrench: Wrench,
  droplet: Droplet,
  droplets: Droplets,
  disc: Disc,
  'circle-dot': CircleDot,
  crosshair: Crosshair,
  'car-front': CarFront,
  'battery-charging': BatteryCharging,
  zap: Zap,
  'scan-line': ScanLine,
  'air-vent': AirVent,
  cog: Cog,
  timer: Timer,
  thermometer: Thermometer,
  wind: Wind,
  'paint-roller': PaintRoller,
  speaker: Speaker,
  'clipboard-check': ClipboardCheck,
  'shield-check': ShieldCheck,
  'file-text': FileText,
  fuel: Fuel,
  'briefcase-medical': BriefcaseMedical,
  truck: Truck,
  package: Package,
}

interface Props {
  /** Clave guardada en la categoría, p. ej. "disc". */
  icon?: string | null
  className?: string
}

/** Ícono de una categoría de aliado. */
export function CategoryIcon({ icon, className }: Props) {
  const Icon = icons[(icon ?? '').toLowerCase()] ?? Wrench
  return <Icon className={className} />
}
