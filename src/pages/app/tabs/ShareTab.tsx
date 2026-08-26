import { useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Check, Copy, ExternalLink, Mail, Trash2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Toggle } from '@/components/ui/form'
import { apiError } from '@/lib/api'
import { roleLabels, toOptions } from '@/lib/labels'
import { useRemoveMember, useSetHistoryPublic, useShareVehicle } from '@/features/vehicles/hooks'
import type { VehicleDetail, VehicleRole } from '@/lib/types'

export function ShareTab({ vehicle }: { vehicle: VehicleDetail }) {
  const share = useShareVehicle(vehicle.id)
  const removeMember = useRemoveMember(vehicle.id)
  const setPublic = useSetHistoryPublic(vehicle.id)

  const [email, setEmail] = useState('')
  const [role, setRole] = useState<VehicleRole>('Driver')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const publicUrl = `${window.location.origin}/v/${vehicle.publicSlug}`

  const invite = async () => {
    setError('')

    if (!email.trim()) {
      setError('Escribe el correo de la persona.')
      return
    }

    try {
      await share.mutateAsync({ email: email.trim(), role })
      setEmail('')
    } catch (err) {
      setError(apiError(err))
    }
  }

  const copy = async () => {
    await navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Solo los roles que tiene sentido conceder: el dueño no se asigna, se es.
  const roleOptions = toOptions(roleLabels).filter((option) => option.value !== 'Owner')

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ---------------------------------------------------------------- personas */}
      <section className="card card-pad">
        <h2 className="text-lg">Compartir con otras personas</h2>
        <p className="mt-1 text-sm text-carbon-500">
          Tu pareja registra las tanqueadas, el taller carga el servicio, y tú ves todo en un solo lugar.
          Al crear su cuenta con ese correo, el vehículo les aparece automáticamente.
        </p>

        {vehicle.isOwner && (
          <div className="mt-5 space-y-3">
            {error && <p className="rounded-xl bg-danger-50 px-4 py-2.5 text-sm text-danger-700">{error}</p>}

            <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr]">
              <Field label="Correo">
                <Input
                  type="email"
                  placeholder="persona@correo.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </Field>

              <Field label="Permiso">
                <Select
                  options={roleOptions}
                  value={role}
                  onChange={(event) => setRole(event.target.value as VehicleRole)}
                />
              </Field>
            </div>

            <Button icon={<UserPlus className="size-4" />} loading={share.isPending} onClick={invite}>
              Dar acceso
            </Button>
          </div>
        )}

        <ul className="mt-6 divide-y divide-carbon-100 border-t border-carbon-100">
          {vehicle.members.length === 0 ? (
            <li className="py-4 text-sm text-carbon-500">Todavía no has compartido este vehículo.</li>
          ) : (
            vehicle.members.map((member) => (
              <li key={member.id} className="flex items-center gap-3 py-3.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-carbon-50 text-carbon-500">
                  <Mail className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-carbon-800">
                    {member.displayName ?? member.email}
                  </p>
                  <p className="truncate text-xs text-carbon-500">{member.email}</p>
                </div>
                <span className={member.isAccepted ? 'chip-ok' : 'chip-warn'}>
                  {member.isAccepted ? roleLabels[member.role] : 'Invitación pendiente'}
                </span>
                {vehicle.isOwner && (
                  <button
                    type="button"
                    onClick={() => removeMember.mutate(member.id)}
                    aria-label="Quitar acceso"
                    className="rounded-lg p-2 text-carbon-400 transition hover:bg-danger-50 hover:text-danger-600"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </li>
            ))
          )}
        </ul>
      </section>

      {/* ---------------------------------------------------------------- hoja de vida */}
      <section className="card card-pad">
        <h2 className="text-lg">Hoja de vida pública</h2>
        <p className="mt-1 text-sm text-carbon-500">
          Un enlace con todo el historial de mantenimiento, sin tus datos personales ni lo que pagaste.
          Ideal para cuando vayas a vender el vehículo.
        </p>

        {vehicle.isOwner && (
          <div className="mt-5 rounded-2xl bg-carbon-50 px-4 py-3.5">
            <Toggle
              checked={vehicle.isHistoryPublic}
              onChange={(value) => setPublic.mutate(value)}
              disabled={setPublic.isPending}
              label="Enlace público activo"
              description="Puedes desactivarlo cuando quieras; el enlace deja de funcionar de inmediato."
            />
          </div>
        )}

        {vehicle.isHistoryPublic ? (
          <div className="mt-5">
            <div className="flex flex-col items-center gap-4 rounded-3xl bg-white p-5 ring-1 ring-carbon-100">
              <QRCodeCanvas value={publicUrl} size={148} level="M" fgColor="#0a0a0a" />
              <p className="break-all text-center text-xs text-carbon-500">{publicUrl}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="ghost"
                icon={copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                onClick={copy}
              >
                {copied ? 'Copiado' : 'Copiar enlace'}
              </Button>
              <a href={publicUrl} target="_blank" rel="noreferrer" className="btn-soft btn-md">
                <ExternalLink className="size-4" />
                Ver cómo se ve
              </a>
            </div>
          </div>
        ) : (
          <p className="mt-5 rounded-2xl border border-dashed border-carbon-200 px-4 py-6 text-center text-sm text-carbon-500">
            Activa el enlace para generar el QR de la hoja de vida.
          </p>
        )}
      </section>
    </div>
  )
}
