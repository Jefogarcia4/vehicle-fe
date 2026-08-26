import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CircleAlert,
  FileText,
  Gauge,
  Landmark,
  Search,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { VehicleAvatar } from '@/components/VehicleAvatar'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Toggle } from '@/components/ui/form'
import { apiError } from '@/lib/api'
import { cn } from '@/lib/cn'
import { date as formatDate, money, num, relativeDays } from '@/lib/format'
import { documentTypeLabels, toOptions, vehicleTypeLabels } from '@/lib/labels'
import { useConfirmLookup, useLookupEnabled, useLookupPlate } from '@/features/vehicles/lookupHooks'
import { useAuth } from '@/features/auth/AuthContext'
import type { PlateLookupDraft, VehicleType } from '@/lib/types'

/**
 * Alta de un vehículo por placa.
 *
 * Se piden cuatro datos y el registro pone el resto. El paso de confirmación no es un trámite:
 * es donde el usuario ve qué se encontró —incluidas las prendas, que es lo que nadie revisa a
 * tiempo— antes de que se cree nada.
 */
export default function VehicleLookupPage() {
  const { user } = useAuth()
  const { data: enabled, isLoading: checking } = useLookupEnabled()
  const lookup = useLookupPlate()

  const [form, setForm] = useState({
    plate: '',
    documentNumber: '',
    lastName: '',
    city: user?.city ?? '',
  })
  const [draft, setDraft] = useState<PlateLookupDraft | null>(null)
  const [error, setError] = useState('')

  const search = async () => {
    setError('')

    if (form.plate.replace(/[^a-z0-9]/gi, '').length < 5) {
      setError('Escribe la placa completa.')
      return
    }
    if (!form.documentNumber.trim()) {
      setError('La cédula del propietario es obligatoria.')
      return
    }

    try {
      setDraft(
        await lookup.mutateAsync({
          plate: form.plate.trim(),
          documentType: 'CC',
          documentNumber: form.documentNumber.trim(),
          lastName: form.lastName.trim() || undefined,
          city: form.city.trim() || undefined,
        }),
      )
    } catch (err) {
      setError(apiError(err, 'No pudimos consultar la placa.'))
    }
  }

  if (draft) {
    return <ConfirmStep draft={draft} city={form.city} onBack={() => setDraft(null)} />
  }

  return (
    <>
      <PageHeader
        title="Agregar vehículo"
        backTo="/app/garaje"
        backLabel="Mis vehículos"
        subtitle="Con la placa y la cédula del propietario traemos la ficha completa del registro."
      />

      <div className="mx-auto max-w-lg">
        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-2xl bg-danger-50 px-4 py-3 text-sm text-danger-700">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            {error}
          </div>
        )}

        {!checking && enabled === false && (
          <div className="mb-4 flex items-start gap-2.5 rounded-2xl bg-danger-50 px-4 py-3 text-sm text-danger-700">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            La consulta por placa no está disponible en este momento. Avísale al administrador
            para poder agregar vehículos.
          </div>
        )}

        <div className="card card-pad">
          <div className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Search className="size-5" />
            </span>
            <div>
              <h2 className="text-base">Buscar por placa</h2>
              <p className="text-xs text-carbon-500">Traemos marca, línea, SOAT, tecnomecánica y más.</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <Field label="Placa" required>
              <Input
                placeholder="ABC123"
                autoFocus
                className="font-display text-lg font-semibold uppercase tracking-widest"
                value={form.plate}
                onChange={(event) => setForm({ ...form, plate: event.target.value })}
                onKeyDown={(event) => event.key === 'Enter' && search()}
              />
            </Field>

            <Field
              label="Cédula del propietario"
              hint="El registro la usa para confirmar que el vehículo es tuyo."
              required
            >
              <Input
                inputMode="numeric"
                placeholder="1020304050"
                value={form.documentNumber}
                onChange={(event) => setForm({ ...form, documentNumber: event.target.value })}
                onKeyDown={(event) => event.key === 'Enter' && search()}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Primer apellido">
                <Input
                  placeholder="Pérez"
                  value={form.lastName}
                  onChange={(event) => setForm({ ...form, lastName: event.target.value })}
                />
              </Field>
              <Field label="Ciudad" hint="Define el pico y placa.">
                <Input
                  placeholder="Bogotá"
                  value={form.city}
                  onChange={(event) => setForm({ ...form, city: event.target.value })}
                />
              </Field>
            </div>
          </div>

          <Button
            size="lg"
            block
            className="mt-6"
            loading={lookup.isPending}
            disabled={enabled === false}
            onClick={search}
          >
            Buscar vehículo
            <ArrowRight className="size-4" />
          </Button>

          {lookup.isPending && (
            <p className="mt-3 text-center text-xs text-carbon-400">
              Consultando el registro, el SOAT, la tecnomecánica y los antecedentes...
            </p>
          )}
        </div>
      </div>
    </>
  )
}

// ---------------------------------------------------------------- confirmación

function ConfirmStep({
  draft,
  city,
  onBack,
}: {
  draft: PlateLookupDraft
  city: string
  onBack: () => void
}) {
  const navigate = useNavigate()
  const confirm = useConfirmLookup()

  const [nickname, setNickname] = useState(draft.suggestedNickname)
  const [odometer, setOdometer] = useState('')
  const [type, setType] = useState<VehicleType>(draft.type)
  const [seedServicePlan, setSeedServicePlan] = useState(true)
  const [error, setError] = useState('')

  const submit = async () => {
    setError('')
    try {
      const vehicle = await confirm.mutateAsync({
        lookupId: draft.lookupId,
        nickname: nickname.trim() || null,
        currentOdometer: odometer ? Number(odometer) : 0,
        type,
        city: city.trim() || null,
        seedServicePlan,
      })
      navigate(`/app/vehiculos/${vehicle.id}`, { replace: true })
    } catch (err) {
      setError(apiError(err, 'No pudimos crear el vehículo.'))
    }
  }

  return (
    <>
      <PageHeader
        title="Esto encontramos"
        subtitle={`Placa ${draft.plate}. Revisa que sea tu vehículo antes de agregarlo.`}
        actions={
          <Button variant="ghost" onClick={onBack}>
            Buscar otra placa
          </Button>
        }
      />

      {error && (
        <div className="mb-4 flex items-start gap-2.5 rounded-2xl bg-danger-50 px-4 py-3 text-sm text-danger-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      )}

      {!draft.found && (
        <div className="mb-4 flex items-start gap-2.5 rounded-2xl bg-warn-50 px-4 py-3 text-sm text-warn-800">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          El registro no devolvió la ficha de esta placa. Puedes agregarlo de todos modos y
          completar los datos a mano.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          {/* --- Ficha del registro --- */}
          <section className="card card-pad">
            <div className="flex flex-wrap items-center gap-4">
              <VehicleAvatar type={draft.type} size="lg" />
              <div className="min-w-0">
                <h2 className="text-xl">
                  {draft.brand} {draft.model}
                </h2>
                <p className="text-sm text-carbon-500">
                  {[draft.year, draft.color, draft.bodyType].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>

            <dl className="mt-5 grid gap-4 border-t border-carbon-100 pt-4 sm:grid-cols-3">
              <Fact label="Cilindraje" value={draft.engineDisplacementCc ? `${num(draft.engineDisplacementCc)} cc` : null} />
              <Fact label="Motor" value={draft.engineNumber} />
              <Fact label="Chasis" value={draft.chassis} />
              <Fact label="Matriculado" value={draft.registrationDate ? formatDate(draft.registrationDate) : null} />
              <Fact label="Estado" value={draft.officialStatus} />
              <Fact
                label="Propietarios"
                value={draft.ownerHistoryCount != null ? String(draft.ownerHistoryCount) : null}
              />
            </dl>

            {draft.transitAuthority && (
              <p className="mt-4 flex items-start gap-2 border-t border-carbon-100 pt-4 text-xs text-carbon-500">
                <Landmark className="mt-0.5 size-3.5 shrink-0" />
                {draft.transitAuthority}
              </p>
            )}
          </section>

          {/* --- Documentos --- */}
          {(draft.soat || draft.technicalInspection) && (
            <section className="card card-pad">
              <h3 className="text-base">Documentos al día</h3>
              <p className="mt-1 text-sm text-carbon-500">
                Se registran solos con sus fechas, así que las alertas empiezan desde hoy.
              </p>

              <ul className="mt-4 space-y-2">
                {[draft.soat, draft.technicalInspection].filter(Boolean).map((doc) => (
                  <li
                    key={doc!.type}
                    className="flex items-center gap-3 rounded-2xl bg-carbon-50 px-4 py-3"
                  >
                    <span
                      className={cn(
                        'flex size-9 shrink-0 items-center justify-center rounded-xl',
                        doc!.isValid ? 'bg-white text-ok-600' : 'bg-danger-50 text-danger-600',
                      )}
                    >
                      <FileText className="size-[18px]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-carbon-900">
                        {documentTypeLabels[doc!.type]}
                      </p>
                      <p className="truncate text-xs text-carbon-500">
                        {doc!.issuer}
                        {doc!.number ? ` · ${doc!.number}` : ''}
                      </p>
                    </div>
                    <span className={doc!.daysToExpire < 0 ? 'chip-danger' : doc!.daysToExpire <= 30 ? 'chip-warn' : 'chip-ok'}>
                      <CalendarClock className="size-3" />
                      {relativeDays(doc!.daysToExpire)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* --- Gravámenes: lo que nadie revisa a tiempo --- */}
          {draft.liens.length > 0 && (
            <section className="card card-pad ring-warn-200">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-xl bg-warn-50 text-warn-600">
                  <ShieldAlert className="size-[18px]" />
                </span>
                <h3 className="text-base">
                  {draft.liens.length === 1 ? 'Tiene un gravamen' : `Tiene ${draft.liens.length} gravámenes`}
                </h3>
              </div>

              <ul className="mt-4 space-y-2">
                {draft.liens.map((lien, index) => (
                  <li key={index} className="rounded-2xl bg-warn-50 px-4 py-3">
                    <p className="text-sm font-semibold text-warn-800">
                      {lien.kind === 'Pledge' ? 'Prenda' : 'Embargo'} · {lien.holder}
                    </p>
                    {lien.registeredOn && (
                      <p className="mt-0.5 text-xs text-warn-700">
                        Inscrito el {formatDate(lien.registeredOn)}
                      </p>
                    )}
                  </li>
                ))}
              </ul>

              <p className="mt-3 text-xs text-carbon-500">
                Un vehículo con prenda no se puede traspasar hasta que se levante. Queda registrado
                en su hoja de vida.
              </p>
            </section>
          )}

          {/* --- Pico y placa --- */}
          {draft.picoYPlaca.filter((rule) => rule.hasRestriction).map((rule, index) => (
            <section key={index} className="card card-pad">
              <h3 className="text-base">Pico y placa en {rule.city}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={rule.appliesToday ? 'chip-danger' : 'chip-ok'}>
                  Hoy {rule.appliesToday ? 'sí aplica' : 'no aplica'}
                </span>
                <span className={rule.appliesTomorrow ? 'chip-warn' : 'chip-neutral'}>
                  Mañana {rule.appliesTomorrow ? 'sí aplica' : 'no aplica'}
                </span>
                {rule.schedule && <span className="chip-neutral">{rule.schedule}</span>}
              </div>
              {rule.validity && <p className="mt-2 text-xs text-carbon-400">{rule.validity}</p>}
            </section>
          ))}

          {draft.warnings.length > 0 && (
            <section className="card card-pad">
              <h3 className="text-base">Lo que no se pudo consultar</h3>
              <ul className="mt-2 space-y-1.5">
                {draft.warnings.map((warning, index) => (
                  <li key={index} className="flex items-start gap-2 text-xs text-carbon-500">
                    <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-carbon-400" />
                    {warning}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* --- Lo que el registro no sabe --- */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <section className="card card-pad">
            <h3 className="text-base">Solo falta esto</h3>
            <p className="mt-1 text-sm text-carbon-500">El registro no lo sabe, pero tú sí.</p>

            <div className="mt-4 space-y-4">
              <Field label="¿Cómo le dices?">
                <Input value={nickname} onChange={(event) => setNickname(event.target.value)} />
              </Field>

              <Field
                label="Kilometraje actual"
                hint="Con esto se calcula cuándo toca cada mantenimiento."
              >
                <Input
                  type="number"
                  suffix="km"
                  placeholder="32500"
                  value={odometer}
                  onChange={(event) => setOdometer(event.target.value)}
                />
              </Field>

              <Field label="Tipo" hint="Lo sugerimos por la carrocería del registro.">
                <Select
                  options={toOptions(vehicleTypeLabels)}
                  value={type}
                  onChange={(event) => setType(event.target.value as VehicleType)}
                />
              </Field>

              <div className="rounded-2xl bg-carbon-50 p-3">
                <Toggle
                  checked={seedServicePlan}
                  onChange={setSeedServicePlan}
                  label="Crear el plan de mantenimiento"
                  description="Aceites, filtros, frenos y llantas según el tipo de vehículo."
                />
              </div>
            </div>

            <Button size="lg" block className="mt-5" loading={confirm.isPending} onClick={submit}>
              <Gauge className="size-4" />
              Agregar a mi garaje
            </Button>
          </section>

          {/* --- Avalúo --- */}
          {draft.valuation && (
            <section className="card card-pad mt-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-4 text-brand-600" />
                <h3 className="text-base">Avalúo comercial</h3>
              </div>
              <p className="mt-2 font-display text-2xl font-semibold text-carbon-900">
                {money(draft.valuation.commercialValue)}
              </p>
              {draft.valuation.marketMin != null && draft.valuation.marketMax != null && (
                <p className="mt-0.5 text-xs text-carbon-500">
                  Mercado: {money(draft.valuation.marketMin)} – {money(draft.valuation.marketMax)}
                </p>
              )}
            </section>
          )}

          {/* --- Licencia del titular --- */}
          {draft.licenses.length > 0 && (
            <section className="card card-pad mt-3">
              <div className="flex items-center gap-2">
                <BadgeCheck className="size-4 text-brand-600" />
                <h3 className="text-base">Tu licencia</h3>
              </div>
              <ul className="mt-2 space-y-1.5">
                {draft.licenses.map((license) => (
                  <li key={license.category} className="flex items-center justify-between text-sm">
                    <span className="text-carbon-600">
                      Categoría {license.category}
                      {license.status ? ` · ${license.status.toLowerCase()}` : ''}
                    </span>
                    <span
                      className={cn(
                        'text-xs font-semibold',
                        license.daysToExpire < 0
                          ? 'text-danger-600'
                          : license.daysToExpire <= 60
                            ? 'text-warn-600'
                            : 'text-carbon-500',
                      )}
                    >
                      {formatDate(license.expiresOn)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="mt-3 text-center text-xs text-carbon-400">
            Consulta hecha al registro. Costo: {draft.cost}{' '}
            {draft.cost === 1 ? 'crédito' : 'créditos'}.
          </p>
        </aside>
      </div>
    </>
  )
}

function Fact({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-[0.7rem] font-semibold uppercase tracking-wide text-carbon-400">{label}</dt>
      <dd className="mt-0.5 truncate text-sm text-carbon-700">{value ?? '—'}</dd>
    </div>
  )
}
