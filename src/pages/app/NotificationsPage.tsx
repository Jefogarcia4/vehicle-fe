import { Link } from 'react-router-dom'
import { Bell, CheckCheck, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { EmptyState, Loading } from '@/components/ui/feedback'
import { assetUrl } from '@/lib/api'
import { cn } from '@/lib/cn'
import { date as formatDate } from '@/lib/format'
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/features/notifications/hooks'

/** Bandeja de avisos. Hoy la llenan las campañas de los aliados que el usuario autorizó. */
export default function NotificationsPage() {
  const { data, isLoading } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()
  const remove = useDeleteNotification()

  if (isLoading) return <Loading />

  const items = data?.items ?? []

  return (
    <>
      <PageHeader
        title="Avisos"
        subtitle="Recordatorios y promociones de los talleres que autorizaste."
        actions={
          (data?.unreadCount ?? 0) > 0 && (
            <Button
              variant="ghost"
              icon={<CheckCheck className="size-4" />}
              loading={markAll.isPending}
              onClick={() => markAll.mutate()}
            >
              Marcar todo como leído
            </Button>
          )
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={<Bell className="size-6" />}
          title="Sin avisos"
          description="Cuando un taller que autorizaste te envíe un recordatorio, aparecerá aquí."
        />
      ) : (
        <ul className="space-y-2">
          {items.map((notification) => {
            const logo = assetUrl(notification.partnerLogoUrl)

            return (
              <li
                key={notification.id}
                className={cn(
                  'flex gap-3 rounded-2xl p-4 ring-1 transition',
                  notification.isRead
                    ? 'bg-white ring-carbon-100'
                    : 'bg-brand-50/50 ring-brand-200',
                )}
              >
                <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-carbon-50 text-carbon-500">
                  {logo ? (
                    <img src={logo} alt="" className="size-full object-cover" />
                  ) : (
                    <Bell className="size-5" />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {notification.partnerName && (
                        <p className="text-xs font-semibold uppercase tracking-wide text-carbon-400">
                          {notification.partnerSlug ? (
                            <Link
                              to={`/aliados/${notification.partnerSlug}`}
                              className="hover:text-brand-600"
                            >
                              {notification.partnerName}
                            </Link>
                          ) : (
                            notification.partnerName
                          )}
                        </p>
                      )}
                      <p className="mt-0.5 text-sm font-semibold text-carbon-900">
                        {notification.title}
                      </p>
                    </div>

                    <span className="shrink-0 text-xs text-carbon-400">
                      {formatDate(notification.createdAtUtc)}
                    </span>
                  </div>

                  <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-carbon-600">
                    {notification.body}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {notification.ctaLabel && notification.ctaUrl && (
                      <a
                        href={notification.ctaUrl}
                        target={notification.ctaUrl.startsWith('http') ? '_blank' : undefined}
                        rel="noreferrer"
                        className="btn-soft btn-sm"
                      >
                        {notification.ctaLabel}
                      </a>
                    )}

                    {!notification.isRead && (
                      <button
                        type="button"
                        onClick={() => markRead.mutate(notification.id)}
                        className="text-xs font-semibold text-carbon-500 hover:text-brand-600"
                      >
                        Marcar como leído
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => remove.mutate(notification.id)}
                      className="ml-auto flex items-center gap-1 text-xs font-semibold text-carbon-400 hover:text-danger-600"
                    >
                      <Trash2 className="size-3.5" />
                      Borrar
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <p className="mt-6 text-center text-xs text-carbon-400">
        ¿No quieres que un taller te escriba? Quítale el permiso desde{' '}
        <Link to="/app/talleres" className="font-semibold text-brand-600 hover:text-brand-700">
          tus talleres
        </Link>
        .
      </p>
    </>
  )
}
