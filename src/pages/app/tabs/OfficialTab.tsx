import { useState } from 'react'
import {
  CalendarClock,
  CircleAlert,
  ExternalLink,
  FileText,
  IdCard,
  Landmark,
  RefreshCw,
  Scale,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  Store,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Field, Input } from '@/components/ui/form'
import { EmptyState, Loading } from '@/components/ui/feedback'
import { apiError } from '@/lib/api'
import { cn } from '@/lib/cn'
import { date as formatDate, money, relativeDays } from '@/lib/format'
import { fuelTypeLabels } from '@/lib/labels'
import { useOfficialRecord, useRefreshOfficial } from '@/features/vehicles/lookupHooks'
import type { LegalDocument, Lien, LookupBlock, OfficialRecord, VehicleDetail } from '@/lib/types'

const serviceLabels: Record<string, string> = {
  Particular: 'Particular',
  Public: 'Público',
  Official: 'Oficial',
  Diplomatic: 'Diplomático',
  Other: 'Otro',
}

/** El proveedor abrevia los días en español. */
const weekDayLabels: Record<string, string> = {
  lun: 'lunes',
  mar: 'martes',
  mie: 'miércoles',
  jue: 'jueves',
  vie: 'viernes',
  sab: 'sábados',
  dom: 'domingos',
}

const plateDigitLabels: Record<string, string> = {
  ultimo: 'último',
  penultimo: 'penúltimo',
  primero: 'primer',
}

/** Nombre legible de cada bloque de la consulta. */
const blockLabels: Record<string, string> = {
  vehicle: 'Ficha del vehículo',
  soat: 'SOAT',
  rtm: 'Tecnomecánica',
  antecedentes: 'Prendas y embargos',
  simit: 'Multas (SIMIT)',
  impuestos: 'Impuesto vehicular',
  fasecolda: 'Avalúo comercial',
  picoYPlaca: 'Pico y placa',
  licencia: 'Licencia de conducción',
}

/**
 * Lo que las fuentes oficiales saben del vehículo: si puede circular, la ficha del registro, los
 * gravámenes que impiden venderlo y cómo se ha depreciado.
 *
 * La licencia del titular no está aquí: es de la persona y no del carro, así que vive en el
 * perfil. Ver `DriverProfileCard`.
 */
export function OfficialTab({ vehicle }: { vehicle: VehicleDetail }) {
  const { data, isLoading, isError, refetch } = useOfficialRecord(vehicle.id)
  const [refreshing, setRefreshing] = useState(false)

  if (isLoading) return <Loading />

  // Quedarse en blanco cuando el servidor falla se lee como "aquí no hay nada", que es justo lo
  // contrario de lo que pasó.
  if (isError || !data) {
    return (
      <EmptyState
        icon={<CircleAlert className="size-6" />}
        title="No pudimos cargar los datos oficiales"
        description="El servidor no respondió. Lo que ya se había consultado sigue guardado."
        action={
          <Button variant="ghost" icon={<RefreshCw className="size-4" />} onClick={() => refetch()}>
            Reintentar
          </Button>
        }
      />
    )
  }

  const nunca = !data.vehicle.syncedAtUtc

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg">Datos oficiales</h2>
          <p className="text-sm text-carbon-500">
            {nunca
              ? 'Este vehículo todavía no se ha consultado en el registro.'
              : `Última consulta: ${formatDate(data.vehicle.syncedAtUtc)}.`}
            {data.lookupCount > 0 && ` ${data.lookupCount} consulta${data.lookupCount === 1 ? '' : 's'}, ${data.creditsSpent} crédito${data.creditsSpent === 1 ? '' : 's'}.`}
          </p>
        </div>
        <Button variant="ghost" icon={<RefreshCw className="size-4" />} onClick={() => setRefreshing(true)}>
          Actualizar
        </Button>
      </div>

      {nunca ? (
        <EmptyState
          icon={<ScrollText className="size-6" />}
          title="Sin datos del registro"
          description="Consulta la placa para traer la ficha oficial, los gravámenes, el avalúo comercial y el estado de tus documentos."
          action={
            <Button icon={<RefreshCw className="size-4" />} onClick={() => setRefreshing(true)}>
              Consultar ahora
            </Button>
          }
        />
      ) : (
        <>
          <LegalCard data={data} />
          <ValuationCard data={data} />
          <LiensCard liens={data.liens} />
          <RegistryCard data={data} plate={vehicle.plate} />
          <PicoYPlacaCard data={data} />
          <SourcesCard data={data} />

          {/* La consulta trae la licencia del titular, pero se guarda en el perfil: quien tiene
              tres carros tiene una sola licencia y no debería vivir dentro de uno de ellos. */}
          <p className="flex flex-wrap items-center gap-1.5 px-1 text-sm text-carbon-500">
            <IdCard className="size-4 shrink-0 text-carbon-400" />
            Tu licencia, tus certificados y tus trámites están en
            <Link to="/app/perfil" className="font-semibold text-brand-600 hover:text-brand-700">
              tu perfil
            </Link>
            .
          </p>
        </>
      )}

      {refreshing && (
        <RefreshModal vehicle={vehicle} onClose={() => setRefreshing(false)} />
      )}
    </div>
  )
}

// ---------------------------------------------------------------- estado legal

/** Cómo se pinta un indicador según lo que dijo la fuente. */
type Tone = 'ok' | 'warn' | 'danger' | 'unknown'

const toneStyles: Record<Tone, { card: string; icon: string; value: string }> = {
  ok: { card: 'bg-ok-50', icon: 'bg-white text-ok-600', value: 'text-ok-700' },
  warn: { card: 'bg-warn-50', icon: 'bg-white text-warn-600', value: 'text-warn-800' },
  danger: { card: 'bg-danger-50', icon: 'bg-white text-danger-600', value: 'text-danger-700' },
  unknown: { card: 'bg-carbon-50', icon: 'bg-white text-carbon-400', value: 'text-carbon-600' },
}

/**
 * El veredicto: si el vehículo puede circular y si se puede vender.
 *
 * Va primero porque es lo que la gente viene a saber; el detalle de cada cosa está más abajo.
 * "No lo tiene" y "no se pudo averiguar" se pintan distinto a propósito: dar por bueno lo que no
 * se sabe es peor que decir que no se sabe.
 */
function LegalCard({ data }: { data: OfficialRecord }) {
  const { legal } = data

  const soat = documentIndicator('SOAT', legal.soat)
  const rtm = documentIndicator('Tecnomecánica', legal.inspection)

  const liens: Indicator = {
    label: 'Gravámenes',
    value: legal.activeLiens === 0 ? 'Sin prendas' : `${legal.activeLiens} vigente${legal.activeLiens === 1 ? '' : 's'}`,
    hint: legal.activeLiens === 0 ? 'Se puede traspasar' : 'No se puede traspasar',
    tone: legal.activeLiens === 0 ? 'ok' : 'warn',
    icon: legal.activeLiens === 0 ? ShieldCheck : ShieldAlert,
  }

  const fines: Indicator =
    legal.finesChecked !== true
      ? { label: 'Multas', value: 'Sin consultar', hint: 'El SIMIT no respondió', tone: 'unknown', icon: Scale }
      : legal.pendingFines === 0
        ? { label: 'Multas', value: 'Al día', hint: 'Sin comparendos pendientes', tone: 'ok', icon: Scale }
        : {
            label: 'Multas',
            value: `${legal.pendingFines} pendiente${legal.pendingFines === 1 ? '' : 's'}`,
            hint: legal.fineDebt > 0 ? money(legal.fineDebt) : undefined,
            tone: 'danger',
            icon: Scale,
          }

  const pending = [soat, rtm].filter((indicator) => indicator.fixWith)

  return (
    <section className="card card-pad">
      <h3 className="text-base">Estado legal</h3>
      <p className="mt-1 text-sm text-carbon-500">Si puedes circular y si lo puedes vender.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[soat, rtm, liens, fines].map((indicator) => {
          const style = toneStyles[indicator.tone]
          const Icon = indicator.icon

          return (
            <div key={indicator.label} className={cn('rounded-2xl p-4', style.card)}>
              <div className="flex items-center gap-2">
                <span className={cn('flex size-8 items-center justify-center rounded-lg', style.icon)}>
                  <Icon className="size-4" />
                </span>
                <p className="text-xs font-semibold uppercase tracking-wide text-carbon-500">
                  {indicator.label}
                </p>
              </div>
              <p className={cn('mt-2.5 font-display text-lg font-semibold leading-tight', style.value)}>
                {indicator.value}
              </p>
              {indicator.hint && (
                <p className="mt-0.5 text-xs text-carbon-500">{indicator.hint}</p>
              )}
              {indicator.note && (
                <p className="mt-2 border-t border-white/60 pt-2 text-[0.7rem] leading-snug text-carbon-500">
                  {indicator.note}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Decirle que le falta un documento sin decirle dónde resolverlo es dejarlo a mitad
          de camino: los aliados ya están clasificados por el documento que expiden. */}
      {pending.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {pending.map((indicator) => (
            <Link
              key={indicator.label}
              to={`/aliados?categoria=${indicator.fixWith!.category}`}
              className="btn-ghost btn-sm"
            >
              <Store className="size-3.5" />
              {indicator.fixWith!.label}
            </Link>
          ))}
        </div>
      )}

      {/* El impuesto no es consultable en todos los departamentos: se remite al portal. */}
      {legal.taxMessage && (
        <div className="mt-3 flex flex-wrap items-start gap-2 rounded-2xl bg-carbon-50 px-4 py-3 text-sm text-carbon-600">
          <Landmark className="mt-0.5 size-4 shrink-0 text-carbon-400" />
          <span className="min-w-0 flex-1">{legal.taxMessage}</span>
          {legal.taxPortalUrl && (
            <a
              href={legal.taxPortalUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost btn-sm shrink-0"
            >
              <ExternalLink className="size-3.5" />
              Pagar impuesto
            </a>
          )}
        </div>
      )}
    </section>
  )
}

interface Indicator {
  label: string
  value: string
  hint?: string
  tone: Tone
  icon: typeof ShieldCheck
  /** Categoría de aliados que resuelve este documento, cuando hace falta resolverlo. */
  fixWith?: { category: string; label: string }
  /** Advertencia sobre de dónde salió el dato. Solo aparece cuando cambia lo que hay que hacer. */
  note?: string
}

/**
 * Traduce un documento obligatorio a un indicador.
 *
 * Se mantienen separadas tres cosas que no significan lo mismo: está vigente, no lo tiene, y no se
 * pudo averiguar. Y se dice de dónde salió la respuesta, porque lo que guardó el usuario y lo que
 * dice el RUNT no valen igual en un retén.
 */
function documentIndicator(label: string, doc: LegalDocument): Indicator {
  // A dónde mandarlo cuando el documento falta o está por vencerse.
  const fixWith =
    label === 'SOAT'
      ? { category: 'seguros', label: 'Buscar dónde expedir el SOAT' }
      : { category: 'cda', label: 'Buscar un CDA cerca' }

  if (doc.isExempt) {
    return { label, value: 'Exento', hint: 'Aún no le toca la primera revisión', tone: 'ok', icon: ShieldCheck }
  }

  // Ni el RUNT contestó ni hay documento cargado: no se sabe, y decirlo es mejor que suponer.
  if (doc.source === 'None' || doc.isValid == null) {
    return {
      label,
      value: 'Sin consultar',
      hint: doc.message ?? 'No lo tienes en Documentos y el RUNT no lo ha confirmado',
      tone: 'unknown',
      icon: FileText,
      fixWith,
    }
  }

  const days = doc.daysToExpire ?? 0

  if (!doc.isValid) {
    return {
      label,
      value: doc.expiresOn ? 'Vencido' : 'No vigente',
      hint: doc.expiresOn ? `Venció el ${formatDate(doc.expiresOn)}` : 'El RUNT no reporta uno vigente',
      tone: 'danger',
      icon: ShieldAlert,
      fixWith,
      // Las dos pantallas se contradicen: hay que decir cuál manda en lugar de dejarlo pasar.
      note: doc.notInRegistry
        ? `Tienes uno guardado en Documentos que el RUNT no reconoce. Verifícalo: en la vía manda el RUNT.`
        : undefined,
    }
  }

  return {
    label,
    value: doc.expiresOn ? formatDate(doc.expiresOn) : 'Vigente',
    hint: doc.expiresOn ? `Vence ${relativeDays(days)}${doc.issuer ? ` · ${doc.issuer}` : ''}` : doc.issuer ?? undefined,
    tone: days <= 30 ? 'warn' : 'ok',
    icon: ShieldCheck,
    // Un mes es lo que toma conseguir cita: avisar cuando ya venció no sirve de nada.
    fixWith: days <= 30 ? fixWith : undefined,
    note:
      doc.source === 'App'
        ? 'Sale de tus Documentos; el RUNT no lo ha confirmado.'
        : undefined,
  }
}

// ---------------------------------------------------------------- avalúo

function ValuationCard({ data }: { data: OfficialRecord }) {
  if (data.valuations.length === 0) return null

  const [latest, ...history] = data.valuations
  const change = latest.changeFromPrevious

  return (
    <section className="card card-pad">
      <div className="flex items-center gap-2.5">
        <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <TrendingUp className="size-5" />
        </span>
        <div>
          <h3 className="text-base">Avalúo comercial</h3>
          <p className="text-xs text-carbon-500">
            Fuente: {latest.source}
            {latest.matchedBy ? ` · encontrado por ${latest.matchedBy}` : ''}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-end gap-x-6 gap-y-2">
        <div>
          <p className="font-display text-3xl font-bold text-carbon-900">
            {money(latest.commercialValue)}
          </p>
          <p className="mt-0.5 text-xs text-carbon-500">Al {formatDate(latest.date)}</p>
        </div>

        {change != null && change !== 0 && (
          <span className={cn('flex items-center gap-1', change < 0 ? 'chip-danger' : 'chip-ok')}>
            {change < 0 ? <TrendingDown className="size-3.5" /> : <TrendingUp className="size-3.5" />}
            {change < 0 ? '' : '+'}
            {money(change)}
          </span>
        )}
      </div>

      {latest.marketMin != null && latest.marketMax != null && (
        <p className="mt-3 text-sm text-carbon-500">
          Rango de mercado: {money(latest.marketMin)} – {money(latest.marketMax)}
        </p>
      )}

      {/* Dos versiones del mismo modelo no valen igual: la referencia dice cuál se avaluó. */}
      {latest.reference && (
        <p className="mt-2 rounded-xl bg-carbon-50 px-3 py-2 font-mono text-xs text-carbon-600">
          {latest.reference}
        </p>
      )}

      {/* El histórico es lo que dice cuánto se ha depreciado de verdad. */}
      {history.length > 0 && (
        <div className="mt-4 border-t border-carbon-100 pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-carbon-400">
            Avalúos anteriores
          </p>
          <ul className="space-y-1.5">
            {history.map((valuation) => (
              <li key={valuation.id} className="flex items-center justify-between text-sm">
                <span className="text-carbon-500">{formatDate(valuation.date)}</span>
                <span className="font-semibold text-carbon-700">{money(valuation.commercialValue)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

// ---------------------------------------------------------------- gravámenes

function LiensCard({ liens }: { liens: Lien[] }) {
  // Sin gravámenes no hay nada que detallar: el encabezado legal ya lo dijo.
  if (liens.length === 0) return null

  const active = liens.filter((lien) => !lien.isReleased)
  const released = liens.filter((lien) => lien.isReleased)

  return (
    <section className={cn('card card-pad', active.length > 0 && 'ring-warn-200')}>
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            'flex size-10 items-center justify-center rounded-xl',
            active.length > 0 ? 'bg-warn-50 text-warn-600' : 'bg-ok-50 text-ok-600',
          )}
        >
          {active.length > 0 ? <ShieldAlert className="size-5" /> : <ShieldCheck className="size-5" />}
        </span>
        <div>
          <h3 className="text-base">
            {active.length > 0
              ? `${active.length} gravamen${active.length === 1 ? '' : 'es'} vigente${active.length === 1 ? '' : 's'}`
              : 'Sin gravámenes vigentes'}
          </h3>
          <p className="text-xs text-carbon-500">
            {active.length > 0
              ? 'No se puede traspasar hasta que se levante.'
              : 'Los que tuvo ya se levantaron.'}
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {[...active, ...released].map((lien) => (
          <li
            key={lien.id}
            className={cn(
              'rounded-2xl px-4 py-3',
              lien.isReleased ? 'bg-carbon-50' : 'bg-warn-50',
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p
                  className={cn(
                    'text-sm font-semibold',
                    lien.isReleased ? 'text-carbon-600' : 'text-warn-800',
                  )}
                >
                  {lien.kind === 'Pledge' ? 'Prenda' : lien.kind === 'Seizure' ? 'Embargo' : 'Gravamen'} ·{' '}
                  {lien.holder}
                </p>
                <p className="mt-0.5 text-xs text-carbon-500">
                  {lien.holderDocumentType && lien.holderDocument
                    ? `${lien.holderDocumentType} ${lien.holderDocument}`
                    : ''}
                  {lien.registeredOn ? ` · Inscrito el ${formatDate(lien.registeredOn)}` : ''}
                </p>
              </div>

              {lien.isReleased ? (
                <span className="chip-ok shrink-0">
                  Levantado {lien.releasedOn ? formatDate(lien.releasedOn) : ''}
                </span>
              ) : (
                lien.inConfecamaras && <span className="chip-neutral shrink-0">Confecámaras</span>
              )}
            </div>
            {lien.notes && <p className="mt-2 text-xs text-carbon-500">{lien.notes}</p>}
          </li>
        ))}
      </ul>
    </section>
  )
}

// ---------------------------------------------------------------- ficha del registro

function RegistryCard({ data, plate }: { data: OfficialRecord; plate: string }) {
  const v = data.vehicle

  return (
    <section className="card card-pad">
      <div className="flex items-center gap-2.5">
        <span className="flex size-10 items-center justify-center rounded-xl bg-carbon-50 text-carbon-500">
          <ScrollText className="size-5" />
        </span>
        <h3 className="text-base">Ficha del registro</h3>
      </div>

      {/* Identificación: es lo que se coteja contra el vehículo físico antes de un traspaso. */}
      <p className="mt-5 mb-2 text-[0.7rem] font-semibold uppercase tracking-wide text-carbon-400">
        Identificación
      </p>
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Fact label="Placa" value={plate} mono />
        <Fact label="Marca y línea" value={[v.brand, v.line].filter(Boolean).join(' ') || null} />
        <Fact label="Modelo" value={v.year ? String(v.year) : null} />
        <Fact label="Color" value={v.color} />
        <Fact label="Carrocería" value={v.bodyType} />
        <Fact
          label="Cilindraje"
          value={v.engineDisplacementCc ? `${v.engineDisplacementCc.toLocaleString('es-CO')} cc` : null}
        />
        <Fact label="Combustible" value={v.fuelType ? fuelTypeLabels[v.fuelType] : null} />
        <Fact label="Motor" value={v.engineNumber} mono />
        <Fact label="Chasis" value={v.chassis} mono />
        {/* El VIN solo se repite cuando difiere del chasis: el registro los lleva aparte. */}
        {v.vin && v.vin !== v.chassis && <Fact label="VIN" value={v.vin} mono />}
      </dl>

      <p className="mt-6 mb-2 text-[0.7rem] font-semibold uppercase tracking-wide text-carbon-400">
        Matrícula
      </p>
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Fact
          label="Servicio"
          value={v.registeredService ? serviceLabels[v.registeredService] ?? v.registeredService : null}
        />
        <Fact label="Matriculado" value={v.registrationDate ? formatDate(v.registrationDate) : null} />
        <Fact label="Estado" value={v.officialStatus} />
        <Fact
          label="Propietarios"
          value={v.ownerHistoryCount != null ? String(v.ownerHistoryCount) : null}
          icon={<Users className="size-3.5" />}
        />
        <Fact label="Código Fasecolda" value={v.fasecoldaCode} mono />
        <Fact
          label="Tecnomecánica"
          value={
            v.isInspectionExempt
              ? v.firstInspectionDue
                ? `Exento hasta ${formatDate(v.firstInspectionDue)}`
                : 'Exento'
              : 'Obligatoria'
          }
        />
      </dl>

      {v.transitAuthority && (
        <p className="mt-5 flex items-start gap-2 border-t border-carbon-100 pt-4 text-sm text-carbon-600">
          <Landmark className="mt-0.5 size-4 shrink-0 text-carbon-400" />
          {v.transitAuthority}
        </p>
      )}
    </section>
  )
}

// ---------------------------------------------------------------- pico y placa

function PicoYPlacaCard({ data }: { data: OfficialRecord }) {
  const rules = data.picoYPlaca.filter((rule) => rule.hasRestriction)
  if (rules.length === 0) return null

  return (
    <section className="card card-pad">
      <div className="flex items-center gap-2.5">
        <span className="flex size-10 items-center justify-center rounded-xl bg-carbon-50 text-carbon-500">
          <CalendarClock className="size-5" />
        </span>
        <div>
          <h3 className="text-base">Pico y placa</h3>
          {data.picoYPlacaCity && (
            <p className="text-xs text-carbon-500">Resuelto para {data.picoYPlacaCity}</p>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {rules.map((rule, index) => (
          <div key={index}>
            <p className="text-sm font-semibold text-carbon-800">
              {rule.city}
              {rule.vehicleType ? ` · ${rule.vehicleType}` : ''}
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              <span className={rule.appliesToday && !rule.holidayToday ? 'chip-danger' : 'chip-ok'}>
                Hoy {rule.appliesToday && !rule.holidayToday ? 'sí aplica' : 'no aplica'}
              </span>
              {rule.holidayToday && <span className="chip-ok">Festivo: {rule.holidayToday}</span>}
              <span
                className={
                  rule.appliesTomorrow && !rule.holidayTomorrow ? 'chip-warn' : 'chip-neutral'
                }
              >
                Mañana {rule.appliesTomorrow && !rule.holidayTomorrow ? 'sí aplica' : 'no aplica'}
              </span>
              {rule.schedule && <span className="chip-neutral">{rule.schedule}</span>}
            </div>

            {/* Con la medida por día los dígitos vienen vacíos: mostrar solo eso haría creer
                que la placa no tiene restricción cuando sí le toca un día fijo. */}
            {rule.weekDays.length > 0 ? (
              <p className="mt-2 text-xs text-carbon-500">
                Te toca los {rule.weekDays.map((day) => weekDayLabels[day] ?? day).join(', ')}
                {rule.plateDigit
                  ? ` · por el ${plateDigitLabels[rule.plateDigit] ?? rule.plateDigit} dígito de la placa`
                  : ''}
              </p>
            ) : (
              (rule.digitsToday.length > 0 || rule.digitsTomorrow.length > 0) && (
                <p className="mt-2 text-xs text-carbon-500">
                  Hoy restringen: {rule.digitsToday.join(', ') || '—'} · Mañana:{' '}
                  {rule.digitsTomorrow.join(', ') || '—'}
                </p>
              )
            )}

            <p className="mt-1 text-xs text-carbon-400">
              {rule.validity}
              {rule.sourceUrl && (
                <>
                  {' · '}
                  <a
                    href={rule.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-brand-600 hover:text-brand-700"
                  >
                    fuente
                  </a>
                </>
              )}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- fuentes

function SourcesCard({ data }: { data: OfficialRecord }) {
  if (!data.lastLookup) return null

  return (
    <section className="card card-pad">
      <h3 className="text-base">Qué respondió cada fuente</h3>
      <p className="mt-1 text-sm text-carbon-500">
        Consulta del {formatDate(data.lastLookup.generatedAtUtc)}
        {data.lastLookup.sandbox ? ' · ambiente de pruebas' : ''}
      </p>

      <ul className="mt-4 space-y-2">
        {data.lastLookup.blocks.map((block) => (
          <li key={block.key} className="flex flex-wrap items-start justify-between gap-2 text-sm">
            <div className="min-w-0">
              <span className="font-medium text-carbon-700">
                {blockLabels[block.key] ?? block.key}
              </span>
              {block.message && (
                <p className="mt-0.5 flex items-start gap-1.5 text-xs text-carbon-500">
                  <CircleAlert className="mt-0.5 size-3.5 shrink-0" />
                  {block.message}
                </p>
              )}
              {block.portalUrl && (
                <a
                  href={block.portalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  <ExternalLink className="size-3" />
                  Ir al portal oficial
                </a>
              )}
            </div>

            {/* La fuente distingue tres cosas: que falló, que respondió con malas noticias
                ("danger") y que respondió bien. Mostrar las tres igual haría creer que el
                servicio está roto cuando lo que pasa es que falta un documento. */}
            <span className={sourceChip(block)}>{sourceLabel(block)}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

// ---------------------------------------------------------------- actualizar

/**
 * Vuelve a consultar. Pide la cédula otra vez porque no se guarda —es dato personal del titular—
 * y avisa del costo antes de gastar créditos.
 */
function RefreshModal({ vehicle, onClose }: { vehicle: VehicleDetail; onClose: () => void }) {
  const refresh = useRefreshOfficial(vehicle.id)
  const [documentNumber, setDocumentNumber] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState('')

  const submit = async () => {
    setError('')

    if (!documentNumber.trim()) {
      setError('La cédula del propietario es obligatoria.')
      return
    }

    try {
      await refresh.mutateAsync({
        plate: vehicle.plate,
        documentType: 'CC',
        documentNumber: documentNumber.trim(),
        lastName: lastName.trim() || undefined,
        city: vehicle.city ?? undefined,
      })
      onClose()
    } catch (err) {
      setError(apiError(err, 'No pudimos consultar la placa.'))
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Actualizar datos oficiales"
      description={`Se vuelve a consultar la placa ${vehicle.plate} en el registro.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={submit} loading={refresh.isPending}>
            Consultar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <p className="field-error">{error}</p>}

        <div className="flex items-start gap-2.5 rounded-2xl bg-warn-50 px-4 py-3 text-sm text-warn-800">
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          Cada consulta consume créditos del servicio. Hazla solo cuando esperes que algo haya
          cambiado: una renovación de SOAT, un traspaso o el levantamiento de una prenda.
        </div>

        <Field label="Cédula del propietario" required>
          <Input
            inputMode="numeric"
            placeholder="1020304050"
            value={documentNumber}
            onChange={(event) => setDocumentNumber(event.target.value)}
          />
        </Field>

        <Field label="Primer apellido">
          <Input
            placeholder="Pérez"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
          />
        </Field>
      </div>
    </Modal>
  )
}

/** "Falló" es la fuente; "con novedad" es el vehículo. No se pueden mostrar igual. */
function sourceLabel(block: LookupBlock): string {
  if (block.status === 'Error') return 'Falló'
  if (block.status === 'Danger') return 'Con novedad'
  if (block.status === 'Warning') return 'Atención'
  return block.hasData ? 'Con datos' : 'Sin datos'
}

function sourceChip(block: LookupBlock): string {
  if (block.status === 'Error') return 'chip-danger'
  if (block.status === 'Danger') return 'chip-danger'
  if (block.status === 'Warning') return 'chip-warn'
  return block.hasData ? 'chip-ok' : 'chip-warn'
}

function Fact({
  label,
  value,
  mono,
  icon,
}: {
  label: string
  value?: string | null
  mono?: boolean
  icon?: React.ReactNode
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-wide text-carbon-400">
        {icon}
        {label}
      </dt>
      <dd className={cn('mt-0.5 truncate text-sm text-carbon-700', mono && 'font-mono text-xs')}>
        {value ?? '—'}
      </dd>
    </div>
  )
}
