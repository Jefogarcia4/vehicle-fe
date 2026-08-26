import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { BellOff, CheckCircle2 } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/Button'
import { ErrorState, Loading } from '@/components/ui/feedback'
import { api, apiError, assetUrl } from '@/lib/api'
import type { UnsubscribeInfo } from '@/lib/types'

/**
 * Baja de las comunicaciones de un aliado.
 *
 * Es pública y sin sesión a propósito: quien recibe el correo casi nunca tiene cuenta en
 * Rueda Al Día, y obligarlo a crearse una para dejar de recibirlos no sería una baja de verdad.
 */
export default function UnsubscribePage() {
  const { token = '' } = useParams<{ token: string }>()
  const [done, setDone] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['unsubscribe', token],
    queryFn: async () => (await api.get<UnsubscribeInfo>(`/public/unsubscribe/${token}`)).data,
    enabled: !!token,
    retry: false,
  })

  const confirm = useMutation({
    mutationFn: async () => (await api.post<UnsubscribeInfo>(`/public/unsubscribe/${token}`)).data,
    onSuccess: () => setDone(true),
  })

  if (isLoading) return <Loading label="Un momento..." className="min-h-screen" />

  if (error || !data) {
    return (
      <Shell>
        <ErrorState message={apiError(error, 'Este enlace de baja no es válido o ya no existe.')} />
      </Shell>
    )
  }

  const finished = done || data.alreadyUnsubscribed
  const logo = assetUrl(data.partnerLogoUrl)

  return (
    <Shell>
      <div className="card card-pad text-center">
        <span className="mx-auto flex size-14 items-center justify-center overflow-hidden rounded-2xl bg-carbon-50 text-carbon-400">
          {logo ? (
            <img src={logo} alt="" className="size-full object-cover" />
          ) : finished ? (
            <CheckCircle2 className="size-6 text-ok-600" />
          ) : (
            <BellOff className="size-6" />
          )}
        </span>

        {finished ? (
          <>
            <h1 className="mt-4 text-2xl">Listo, no te escribimos más</h1>
            <p className="mt-2 text-sm text-carbon-500">
              {data.partnerName} ya no te enviará recordatorios ni promociones
              {data.maskedContact ? ` a ${data.maskedContact}` : ''}.
            </p>
            <p className="mt-4 text-xs text-carbon-400">
              Si cambias de opinión, pídeselo directamente al taller: por seguridad, solo tú puedes
              autorizarlo de nuevo.
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-4 text-2xl">¿Dejar de recibir mensajes?</h1>
            <p className="mt-2 text-sm text-carbon-500">
              Vas a darte de baja de los recordatorios y promociones de{' '}
              <span className="font-semibold text-carbon-700">{data.partnerName}</span>
              {data.maskedContact ? ` enviados a ${data.maskedContact}` : ''}.
            </p>

            <Button
              variant="danger"
              size="lg"
              block
              className="mt-6"
              loading={confirm.isPending}
              onClick={() => confirm.mutate()}
            >
              Sí, darme de baja
            </Button>

            {confirm.isError && (
              <p className="field-error">{apiError(confirm.error, 'No pudimos procesar la baja.')}</p>
            )}

            <p className="mt-4 text-xs text-carbon-400">
              Esto no afecta tus otros talleres ni tu cuenta de Rueda Al Día, si tienes una.
            </p>
          </>
        )}
      </div>

      <p className="mt-6 text-center text-sm text-carbon-500">
        <Link to="/" className="font-semibold text-brand-600 hover:text-brand-700">
          Conoce Rueda Al Día
        </Link>{' '}
        · La hoja de vida digital de tu vehículo.
      </p>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-carbon-50 px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link to="/">
            <Logo size="lg" />
          </Link>
        </div>
        {children}
      </div>
    </div>
  )
}
