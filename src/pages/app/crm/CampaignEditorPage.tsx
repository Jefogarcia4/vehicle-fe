import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertCircle,
  Eye,
  Mail,
  MessageCircle,
  Send,
  Smartphone,
  Trash2,
  Users,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { Field, Input, Textarea } from '@/components/ui/form'
import { ErrorState, Loading } from '@/components/ui/feedback'
import { apiError } from '@/lib/api'
import { cn } from '@/lib/cn'
import { campaignChannelLabels, campaignStatusChip, campaignStatusLabels } from '@/lib/labels'
import { SegmentBuilder, emptySegment } from '@/features/crm/SegmentBuilder'
import { CampaignRecipients } from '@/features/crm/CampaignRecipients'
import {
  useCampaign,
  useCancelCampaign,
  useCrmSummary,
  useDeleteCampaign,
  useMessageTokens,
  usePreviewMessage,
  useSaveCampaign,
  useSegmentPreview,
  useSendCampaign,
} from '@/features/crm/hooks'
import type {
  Campaign,
  CampaignChannel,
  CampaignPayload,
  CampaignSegment,
  MessagePreview,
} from '@/lib/types'

const channelIcons: Record<CampaignChannel, typeof Mail> = {
  Email: Mail,
  InApp: Smartphone,
  Whatsapp: MessageCircle,
}

/**
 * Editor de campañas. La segmentación va al lado del mensaje y se recalcula mientras se ajusta,
 * porque el número de destinatarios es lo que decide si el mensaje está bien escrito: no se
 * redacta igual para 6 personas que para 300.
 */
export default function CampaignEditorPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = !id || id === 'nueva'

  const { data: campaign, isLoading, error } = useCampaign(isNew ? undefined : id)

  if (!isNew && isLoading) return <Loading />
  if (!isNew && error) return <ErrorState message={apiError(error, 'Esta campaña no existe.')} />

  // La `key` hace que al abrir otra campaña el formulario se monte de nuevo y tome sus valores
  // iniciales de las props. Copiarlos con un efecto pisaría lo escrito cada vez que la consulta
  // se refresca sola durante el envío.
  return <CampaignForm key={campaign?.id ?? 'nueva'} campaign={campaign} />
}

function CampaignForm({ campaign }: { campaign?: Campaign }) {
  const isNew = !campaign
  const navigate = useNavigate()

  const { data: summary } = useCrmSummary()
  const { data: tokens } = useMessageTokens()

  const save = useSaveCampaign()
  const send = useSendCampaign()
  const cancel = useCancelCampaign()
  const remove = useDeleteCampaign()
  const previewMessage = usePreviewMessage()

  const [form, setForm] = useState({
    name: campaign?.name ?? '',
    subject: campaign?.subject ?? '',
    body: campaign?.body ?? '',
    ctaLabel: campaign?.ctaLabel ?? '',
    ctaUrl: campaign?.ctaUrl ?? '',
  })
  const [channels, setChannels] = useState<CampaignChannel[]>(campaign?.channels ?? ['Email'])
  const [segment, setSegment] = useState<CampaignSegment>(campaign?.segment ?? emptySegment)
  const [feedback, setFeedback] = useState('')
  const [errorText, setErrorText] = useState('')
  const [preview, setPreview] = useState<MessagePreview | null>(null)
  const [confirmSend, setConfirmSend] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data: reach, isFetching: reaching } = useSegmentPreview(segment, channels)

  const locked = campaign?.status === 'Sending' || campaign?.status === 'Sent'

  const payload = (): CampaignPayload => ({
    name: form.name.trim(),
    channels,
    subject: form.subject.trim(),
    body: form.body.trim(),
    ctaLabel: form.ctaLabel.trim() || null,
    ctaUrl: form.ctaUrl.trim() || null,
    segment,
  })

  const validate = () => {
    if (form.name.trim().length < 3) return 'Ponle un nombre para reconocerla después.'
    if (!form.subject.trim()) return 'Escribe el asunto.'
    if (!form.body.trim()) return 'Escribe el mensaje.'
    if (channels.length === 0) return 'Elige al menos un canal.'
    return null
  }

  const submit = async () => {
    setErrorText('')
    setFeedback('')

    const invalid = validate()
    if (invalid) {
      setErrorText(invalid)
      return
    }

    try {
      const saved = await save.mutateAsync({ id: campaign?.id, payload: payload() })
      if (isNew) navigate(`/app/crm/campanas/${saved.id}`, { replace: true })
      else setFeedback('Cambios guardados.')
    } catch (err) {
      setErrorText(apiError(err, 'No pudimos guardar la campaña.'))
    }
  }

  const openPreview = async () => {
    setErrorText('')
    try {
      setPreview(await previewMessage.mutateAsync(payload()))
    } catch (err) {
      setErrorText(apiError(err, 'No pudimos armar la vista previa.'))
    }
  }

  const dispatch = async () => {
    setErrorText('')
    try {
      // Se guarda antes de enviar: lo que sale es lo que está en pantalla, no la última versión guardada.
      const saved = await save.mutateAsync({ id: campaign?.id, payload: payload() })
      await send.mutateAsync(saved.id)
      setConfirmDelete(false)
      if (isNew) navigate(`/app/crm/campanas/${saved.id}`, { replace: true })
    } catch (err) {
      setErrorText(apiError(err, 'No pudimos enviar la campaña.'))
    } finally {
      setConfirmSend(false)
    }
  }

  const toggleChannel = (channel: CampaignChannel) =>
    setChannels((current) =>
      current.includes(channel) ? current.filter((c) => c !== channel) : [...current, channel],
    )

  const insertToken = (token: string) =>
    setForm((current) => ({ ...current, body: `${current.body}${token}` }))

  return (
    <>
      <PageHeader
        title={campaign ? campaign.name : 'Nueva campaña'}
        backTo="/app/crm/campanas"
        backLabel="Campañas"
        subtitle={
          campaign && (
            <span className={campaignStatusChip[campaign.status]}>
              {campaignStatusLabels[campaign.status]}
              {campaign.status === 'Sending' &&
                ` · ${campaign.sentCount} de ${campaign.recipientCount}`}
            </span>
          )
        }
        actions={
          !locked && (
            <>
              <Button variant="ghost" icon={<Eye className="size-4" />} onClick={openPreview}>
                Vista previa
              </Button>
              <Button variant="ghost" loading={save.isPending} onClick={submit}>
                Guardar
              </Button>
              <Button
                icon={<Send className="size-4" />}
                disabled={!reach || reach.messageCount === 0}
                onClick={() => setConfirmSend(true)}
              >
                Enviar
              </Button>
            </>
          )
        }
      />

      {errorText && (
        <div className="mb-4 flex items-start gap-2.5 rounded-2xl bg-danger-50 px-4 py-3 text-sm text-danger-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {errorText}
        </div>
      )}

      {feedback && (
        <div className="mb-4 rounded-2xl bg-ok-50 px-4 py-3 text-sm font-medium text-ok-700">
          {feedback}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        {/* --- Mensaje --- */}
        <div className="space-y-4">
          <section className={cn('card card-pad', locked && 'pointer-events-none opacity-70')}>
            <h2 className="text-base">El mensaje</h2>

            <div className="mt-4 space-y-4">
              <Field label="Nombre de la campaña" hint="Solo lo ves tú." required>
                <Input
                  placeholder="SOAT por vencer - septiembre"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
              </Field>

              <div>
                <p className="label">Canales</p>
                <div className="flex flex-wrap gap-2">
                  {(['Email', 'InApp', 'Whatsapp'] as CampaignChannel[]).map((channel) => {
                    const Icon = channelIcons[channel]
                    const active = channels.includes(channel)
                    return (
                      <button
                        key={channel}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleChannel(channel)}
                        className={cn('chip-base', active ? 'chip-brand' : 'chip-neutral')}
                      >
                        <Icon className="size-3.5" />
                        {campaignChannelLabels[channel]}
                      </button>
                    )
                  })}
                </div>
                <p className="mt-2 text-xs text-carbon-400">
                  WhatsApp no se envía solo: se generan los enlaces para que los abras uno a uno.
                  El aviso en la app solo llega a quienes además usan Rueda Al Día.
                </p>
              </div>

              <Field label="Asunto" hint="Es también el título del aviso en la app." required>
                <Input
                  placeholder="{{nombre}}, {{vence}}"
                  value={form.subject}
                  onChange={(event) => setForm({ ...form, subject: event.target.value })}
                />
              </Field>

              <Field label="Mensaje" required>
                <Textarea
                  rows={9}
                  placeholder={'Hola {{nombre}}.\n\nTe recordamos que para tu {{vehiculo}} de placa {{placa}}, {{vence}}.\n\nAgenda con nosotros y te damos 10% de descuento.'}
                  value={form.body}
                  onChange={(event) => setForm({ ...form, body: event.target.value })}
                />
              </Field>

              {/* Los marcadores son lo que convierte un envío masivo en un mensaje personal. */}
              {tokens && (
                <div>
                  <p className="mb-1.5 text-xs text-carbon-500">
                    Toca para insertar. Se reemplazan por los datos de cada cliente:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {tokens.map((token) => (
                      <button
                        key={token.token}
                        type="button"
                        title={token.description}
                        onClick={() => insertToken(token.token)}
                        className="chip-neutral font-mono text-[0.7rem] transition hover:ring-brand-300"
                      >
                        {token.token}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Texto del botón">
                  <Input
                    placeholder="Agendar cita"
                    value={form.ctaLabel}
                    onChange={(event) => setForm({ ...form, ctaLabel: event.target.value })}
                  />
                </Field>
                <Field label="Enlace del botón">
                  <Input
                    placeholder="https://wa.me/57..."
                    value={form.ctaUrl}
                    onChange={(event) => setForm({ ...form, ctaUrl: event.target.value })}
                  />
                </Field>
              </div>
            </div>
          </section>

          {/* --- Segmento --- */}
          <section className="card card-pad">
            <h2 className="text-base">¿A quién le llega?</h2>
            <p className="mb-4 mt-1 text-sm text-carbon-500">
              Sin ningún filtro le llega a todos los clientes que autorizaron recibir promociones.
            </p>
            <SegmentBuilder value={segment} onChange={setSegment} disabled={locked} />
          </section>

          {/* --- Resultado del envío --- */}
          {campaign && campaign.recipientCount > 0 && (
            <CampaignRecipients campaignId={campaign.id} />
          )}
        </div>

        {/* --- Alcance --- */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <section className="card card-pad">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Users className="size-[18px]" />
              </span>
              <h3 className="text-base">Alcance</h3>
            </div>

            {reach ? (
              <>
                <p
                  className={cn(
                    'mt-4 font-display text-4xl font-bold transition-opacity',
                    reaching && 'opacity-50',
                  )}
                >
                  {reach.total}
                </p>
                <p className="text-sm text-carbon-500">
                  {reach.total === 1 ? 'cliente cumple' : 'clientes cumplen'} estos criterios
                </p>

                <ul className="mt-4 space-y-2 border-t border-carbon-100 pt-4 text-sm">
                  {channels.includes('Email') && (
                    <Reach icon={Mail} label="Por correo" value={reach.reachableByEmail} />
                  )}
                  {channels.includes('InApp') && (
                    <Reach icon={Smartphone} label="Aviso en la app" value={reach.reachableInApp} />
                  )}
                  {channels.includes('Whatsapp') && (
                    <Reach icon={MessageCircle} label="Por WhatsApp" value={reach.reachableByWhatsapp} />
                  )}
                </ul>

                <p className="mt-4 border-t border-carbon-100 pt-4 text-sm font-semibold text-carbon-800">
                  {reach.messageCount} {reach.messageCount === 1 ? 'mensaje' : 'mensajes'} en total
                </p>

                {reach.unreachable > 0 && (
                  <p className="mt-2 text-xs text-warn-700">
                    {reach.unreachable} quedan fuera: no tienen cómo recibir por los canales elegidos.
                  </p>
                )}

                {reach.total === 0 && (
                  <p className="mt-3 text-xs text-carbon-500">
                    Prueba con una ventana de vencimiento más amplia, o quita algún filtro.
                    {summary && summary.subscribedCount === 0 && (
                      <>
                        {' '}
                        Ojo: ninguno de tus clientes tiene marcada la autorización para recibir
                        promociones.
                      </>
                    )}
                  </p>
                )}

                {reach.sample.length > 0 && (
                  <div className="mt-4 border-t border-carbon-100 pt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-carbon-400">
                      Primeros destinatarios
                    </p>
                    <ul className="space-y-1.5">
                      {reach.sample.slice(0, 6).map((item) => (
                        <li key={item.customerId} className="text-xs">
                          <p className="truncate font-medium text-carbon-700">{item.fullName}</p>
                          <p className="truncate text-carbon-400">
                            {item.plate ? `${item.plate} · ` : ''}
                            {item.nextExpiryLabel && item.daysToNextExpiry != null
                              ? `${item.nextExpiryLabel} en ${item.daysToNextExpiry}d`
                              : (item.email ?? item.phone ?? '')}
                          </p>
                        </li>
                      ))}
                    </ul>
                    {reach.total > 6 && (
                      <p className="mt-2 text-xs text-carbon-400">y {reach.total - 6} más...</p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <p className="mt-4 text-sm text-carbon-500">Calculando...</p>
            )}
          </section>

          {!isNew && !locked && (
            <Button
              variant="danger"
              block
              className="mt-3"
              icon={<Trash2 className="size-4" />}
              onClick={() => setConfirmDelete(true)}
            >
              Eliminar campaña
            </Button>
          )}

          {campaign?.status === 'Sending' && (
            <Button
              variant="ghost"
              block
              className="mt-3"
              loading={cancel.isPending}
              onClick={() => cancel.mutate(campaign.id)}
            >
              Detener lo que falta
            </Button>
          )}

          {locked && (
            <div className="card card-pad mt-3">
              <p className="text-sm text-carbon-600">
                Una campaña enviada no se edita, porque ya no coincidiría con lo que recibieron.
              </p>
              <Link to="/app/crm/campanas/nueva" className="btn-ghost btn-sm mt-3 w-full">
                Crear una nueva
              </Link>
            </div>
          )}
        </aside>
      </div>

      {/* --- Vista previa --- */}
      <Modal
        open={!!preview}
        onClose={() => setPreview(null)}
        title="Así lo va a recibir"
        description={
          preview?.basedOn
            ? `Con los datos de ${preview.basedOn}, uno de los destinatarios reales.`
            : 'Con datos de ejemplo: todavía no hay destinatarios que cumplan el segmento.'
        }
        size="md"
      >
        {preview && (
          <div className="rounded-2xl bg-carbon-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-carbon-400">Asunto</p>
            <p className="mt-1 font-display text-lg font-semibold text-carbon-900">
              {preview.subject}
            </p>
            <div className="mt-4 whitespace-pre-line border-t border-carbon-200 pt-4 text-sm leading-relaxed text-carbon-700">
              {preview.body}
            </div>
            {form.ctaLabel && form.ctaUrl && (
              <span className="btn-primary btn-md mt-4 pointer-events-none">{form.ctaLabel}</span>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmSend}
        title="Enviar campaña"
        message={
          reach
            ? `Se enviarán ${reach.messageCount} mensajes a ${reach.total} clientes. Una vez enviada no se puede editar ni recoger.`
            : ''
        }
        confirmLabel="Enviar ahora"
        danger={false}
        loading={save.isPending || send.isPending}
        onConfirm={dispatch}
        onCancel={() => setConfirmSend(false)}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Eliminar campaña"
        message={`Se borrará "${form.name}".`}
        loading={remove.isPending}
        onConfirm={async () => {
          if (campaign) await remove.mutateAsync(campaign.id)
          navigate('/app/crm/campanas', { replace: true })
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  )
}

function Reach({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail
  label: string
  value: number
}) {
  return (
    <li className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-2 text-carbon-500">
        <Icon className="size-3.5" />
        {label}
      </span>
      <span className="font-semibold text-carbon-800">{value}</span>
    </li>
  )
}
