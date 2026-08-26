import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

const currency = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const compactCurrency = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  notation: 'compact',
  maximumFractionDigits: 1,
})

const number = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 })
const decimal = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 })

/** $ 1.250.000 */
export const money = (value?: number | null) => (value == null ? '—' : currency.format(value))

/** $ 1,3 M — para tarjetas y ejes de gráficas donde el monto completo no cabe. */
export const moneyShort = (value?: number | null) => (value == null ? '—' : compactCurrency.format(value))

/** 47.800 */
export const num = (value?: number | null) => (value == null ? '—' : number.format(value))

/** 51,5 */
export const dec = (value?: number | null) => (value == null ? '—' : decimal.format(value))

/** 47.800 km */
export const distance = (value?: number | null, unit: 'Kilometers' | 'Miles' = 'Kilometers') =>
  value == null ? '—' : `${number.format(value)} ${unit === 'Miles' ? 'mi' : 'km'}`

/** Fecha ISO o yyyy-MM-dd a "12 mar 2026". */
export function date(value?: string | null, pattern = "d 'de' MMM yyyy"): string {
  if (!value) return '—'
  const parsed = value.length <= 10 ? parseISO(`${value}T00:00:00`) : parseISO(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return format(parsed, pattern, { locale: es })
}

/** Fecha corta: "12 mar". */
export const dateShort = (value?: string | null) => date(value, 'd MMM')

/** yyyy-MM-dd de hoy, listo para inputs de tipo date. */
export const todayIso = () => format(new Date(), 'yyyy-MM-dd')

/** Suma meses a una fecha ISO y devuelve yyyy-MM-dd. */
export function addMonthsIso(value: string, months: number): string {
  const base = parseISO(`${value}T00:00:00`)
  const result = new Date(base)
  result.setMonth(result.getMonth() + months)
  return format(result, 'yyyy-MM-dd')
}

/** Días entre hoy y una fecha; negativo si ya pasó. */
export function daysUntil(value?: string | null): number | null {
  if (!value) return null
  const parsed = value.length <= 10 ? parseISO(`${value}T00:00:00`) : parseISO(value)
  if (Number.isNaN(parsed.getTime())) return null
  return differenceInCalendarDays(parsed, new Date())
}

/**
 * Texto de urgencia en el lenguaje con el que la gente piensa las fechas:
 * "hoy", "en 3 días", "hace 2 meses".
 */
export function relativeDays(days?: number | null): string {
  if (days == null) return '—'
  if (days === 0) return 'hoy'
  if (days === 1) return 'mañana'
  if (days === -1) return 'ayer'

  const abs = Math.abs(days)
  const label =
    abs < 45 ? `${abs} días` : abs < 365 ? `${Math.round(abs / 30)} meses` : `${Math.round(abs / 365)} años`

  return days > 0 ? `en ${label}` : `hace ${label}`
}

/** ABC123 se muestra como ABC 123, que es como se lee una placa. */
export function plate(value?: string | null): string {
  if (!value) return '—'
  return value.length >= 6 ? `${value.slice(0, 3)} ${value.slice(3)}` : value
}

/** Iniciales para el avatar del usuario. */
export function initials(name?: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return (parts[0]?.[0] ?? '').concat(parts[1]?.[0] ?? '').toUpperCase() || '?'
}
