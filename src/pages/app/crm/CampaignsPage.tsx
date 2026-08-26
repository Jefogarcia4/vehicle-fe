import { Link } from 'react-router-dom'
import { Mail, Megaphone, MessageCircle, Plus, Smartphone, Users } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState, Skeleton } from '@/components/ui/feedback'
import { cn } from '@/lib/cn'
import { date as formatDate } from '@/lib/format'
import { campaignStatusChip, campaignStatusLabels } from '@/lib/labels'
import { useCampaigns } from '@/features/crm/hooks'
import type { CampaignChannel, CampaignListItem } from '@/lib/types'

const channelIcons: Record<CampaignChannel, typeof Mail> = {
  Email: Mail,
  InApp: Smartphone,
  Whatsapp: MessageCircle,
}

/** Lista de campañas del aliado. */
export default function CampaignsPage() {
  const { data, isLoading } = useCampaigns()

  return (
    <>
      <PageHeader
        title="Campañas"
        subtitle="Recordatorios y promociones a tus clientes, según lo que se les esté venciendo."
        actions={
          <Link to="/app/crm/campanas/nueva" className="btn-primary btn-md">
            <Plus className="size-4" />
            Nueva campaña
          </Link>
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : data?.length ? (
        <ul className="space-y-2">
          {data.map((campaign) => (
            <CampaignRow key={campaign.id} campaign={campaign} />
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={<Megaphone className="size-6" />}
          title="Todavía no has enviado campañas"
          description="Empieza por la más obvia: avisarle a quien está por vencérsele el SOAT o la tecnomecánica."
          action={
            <Link to="/app/crm/campanas/nueva" className="btn-primary btn-md">
              <Plus className="size-4" />
              Crear la primera
            </Link>
          }
        />
      )}
    </>
  )
}

function CampaignRow({ campaign }: { campaign: CampaignListItem }) {
  const done = campaign.status === 'Sent'
  const progress = campaign.recipientCount > 0
    ? Math.round((campaign.sentCount / campaign.recipientCount) * 100)
    : 0

  return (
    <li>
      <Link
        to={`/app/crm/campanas/${campaign.id}`}
        className="block rounded-2xl bg-white px-4 py-4 ring-1 ring-carbon-100 transition hover:ring-brand-200"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-carbon-900">{campaign.name}</p>
              <span className={campaignStatusChip[campaign.status]}>
                {campaignStatusLabels[campaign.status]}
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-carbon-500">{campaign.subject}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              {campaign.channels.map((channel) => {
                const Icon = channelIcons[channel]
                return (
                  <span
                    key={channel}
                    className="flex size-7 items-center justify-center rounded-lg bg-carbon-50 text-carbon-500"
                  >
                    <Icon className="size-3.5" />
                  </span>
                )
              })}
            </div>

            <div className="text-right text-xs">
              <p className="flex items-center justify-end gap-1 font-semibold text-carbon-700">
                <Users className="size-3.5" />
                {campaign.recipientCount}
              </p>
              <p className="text-carbon-400">
                {done
                  ? formatDate(campaign.sentAtUtc)
                  : campaign.scheduledAtUtc
                    ? `Programada ${formatDate(campaign.scheduledAtUtc)}`
                    : formatDate(campaign.createdAtUtc)}
              </p>
            </div>
          </div>
        </div>

        {/* Mientras se envía, la barra es lo único que dice que algo está pasando. */}
        {campaign.status === 'Sending' && (
          <div className="mt-3">
            <div className="h-1.5 overflow-hidden rounded-full bg-carbon-100">
              <div
                className="h-full rounded-full bg-warn-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-carbon-500">
              {campaign.sentCount} de {campaign.recipientCount} enviados
            </p>
          </div>
        )}

        {done && campaign.recipientCount > 0 && (
          <p className="mt-2 text-xs text-carbon-500">
            {campaign.sentCount} entregados
            {campaign.failedCount > 0 && (
              <span className={cn('ml-1', 'text-danger-600')}>· {campaign.failedCount} fallaron</span>
            )}
          </p>
        )}
      </Link>
    </li>
  )
}
