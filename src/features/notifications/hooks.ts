import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { NotificationList } from '@/lib/types'

/** Bandeja de avisos del usuario. Hoy la alimentan las campañas de los aliados. */
export function useNotifications(enabled = true) {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get<NotificationList>('/notifications')).data,
    enabled,
  })
}

/**
 * Solo el contador de la campanita. Va aparte de la lista porque la barra lo necesita en toda
 * la app, y se refresca cada pocos minutos para no consultar de más.
 */
export function useUnreadCount(enabled = true) {
  return useQuery({
    queryKey: ['notifications-unread'],
    queryFn: async () => (await api.get<{ count: number }>('/notifications/unread-count')).data.count,
    enabled,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  })
}

export function useMarkNotificationRead() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/notifications/${id}/read`)
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['notifications'] })
      client.invalidateQueries({ queryKey: ['notifications-unread'] })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await api.post('/notifications/read-all')
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['notifications'] })
      client.invalidateQueries({ queryKey: ['notifications-unread'] })
    },
  })
}

export function useDeleteNotification() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/notifications/${id}`)
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['notifications'] })
      client.invalidateQueries({ queryKey: ['notifications-unread'] })
    },
  })
}
