import { useState } from 'react'
import { ExternalLink, Mail, MessageCircle, Smartphone } from 'lucide-react'
import { Skeleton } from '@/components/ui/feedback'
import { cn } from '@/lib/cn'
import { campaignChannelLabels, deliveryStatusChip, deliveryStatusLabels } from '@/lib/labels'
import { useCampaignRecipients } from './hooks'
import type { CampaignChannel } from '@/lib/types'

const channelIcons: Record<CampaignChannel, typeof Mail> = {
  Email: Mail,
  InApp: Smartphone,
  Whatsapp: MessageCircle,
}

/**
 * Resultado del envío, mensaje por mensaje. Los de WhatsApp traen su enlace: ese canal no sale
 * solo, y esta lista es donde el aliado los va abriendo.
 */
export function CampaignRecipients({ campaignId }: { campaignId: string }) {
  const [open, setOpen] = useState(false)
  const { data, isLoading } = useCampaignRecipients(campaignId, open)

  const whatsapp = (data ?? []).filter((r) => r.whatsappUrl)

  return (
    <section className="card card-pad">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between text-left"
      >
        <h2 className="text-base">Destinatarios</h2>
        <span className="text-sm font-semibold text-brand-600">
          {open ? 'Ocultar' : 'Ver lista'}
        </span>
      </button>

      {open &&
        (isLoading ? (
          <div className="mt-4 space-y-2">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : (
          <>
            {whatsapp.length > 0 && (
              <div className="mt-4 rounded-2xl bg-ok-50 px-4 py-3 text-sm text-ok-800">
                {whatsapp.length} {whatsapp.length === 1 ? 'mensaje' : 'mensajes'} de WhatsApp listos
                para abrir. Cada uno va con el texto ya escrito; solo tienes que presionar enviar.
              </div>
            )}

            <div className="scrollbar-thin mt-4 max-h-96 overflow-y-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-carbon-100">
                    <th className="table-head">Cliente</th>
                    <th className="table-head">Canal</th>
                    <th className="table-head">Estado</th>
                    <th className="table-head" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-carbon-50">
                  {(data ?? []).map((recipient) => {
                    const Icon = channelIcons[recipient.channel]

                    return (
                      <tr key={recipient.id}>
                        <td className="table-cell">
                          <p className="font-medium text-carbon-800">{recipient.customerName}</p>
                          {recipient.address && (
                            <p className="text-xs text-carbon-400">{recipient.address}</p>
                          )}
                        </td>
                        <td className="table-cell">
                          <span className="flex items-center gap-1.5 text-xs text-carbon-600">
                            <Icon className="size-3.5" />
                            {campaignChannelLabels[recipient.channel]}
                          </span>
                        </td>
                        <td className="table-cell">
                          <span className={cn('text-xs', deliveryStatusChip[recipient.status])}>
                            {deliveryStatusLabels[recipient.status]}
                          </span>
                          {recipient.error && (
                            <p className="mt-0.5 max-w-48 truncate text-[0.7rem] text-carbon-400">
                              {recipient.error}
                            </p>
                          )}
                        </td>
                        <td className="table-cell text-right">
                          {recipient.whatsappUrl && (
                            <a
                              href={recipient.whatsappUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-ghost btn-sm"
                            >
                              <ExternalLink className="size-3.5" />
                              Abrir
                            </a>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        ))}
    </section>
  )
}
