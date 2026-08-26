import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  Partner,
  PartnerCard,
  PartnerCategory,
  PartnerPayload,
  PartnerRecommendation,
  PartnerSearchParams,
  PublicPartner,
  Workshop,
} from '@/lib/types'

/**
 * Módulo de aliados. Se separa en tres grupos: el catálogo y el directorio (público), el
 * panel del propio aliado, y las recomendaciones que cruzan las alertas con el directorio.
 */

// ---------------------------------------------------------------- catálogo y directorio

/** Categorías de servicio. Cambian muy poco, así que se cachean por media hora. */
export function usePartnerCategories() {
  return useQuery({
    queryKey: ['partner-categories'],
    queryFn: async () => (await api.get<PartnerCategory[]>('/partner-categories')).data,
    staleTime: 30 * 60_000,
  })
}

export function usePartnerDirectory(params: PartnerSearchParams) {
  return useQuery({
    queryKey: ['partner-directory', params],
    queryFn: async () => (await api.get<PartnerCard[]>('/public/partners', { params })).data,
  })
}

export function usePublicPartner(slug?: string) {
  return useQuery({
    queryKey: ['partner', slug],
    queryFn: async () => (await api.get<PublicPartner>(`/public/partners/${slug}`)).data,
    enabled: !!slug,
  })
}

export function usePartnerCities() {
  return useQuery({
    queryKey: ['partner-cities'],
    queryFn: async () => (await api.get<string[]>('/public/partner-cities')).data,
    staleTime: 30 * 60_000,
  })
}

// ---------------------------------------------------------------- panel del aliado

/**
 * Perfil del usuario en sesión. La API responde 204 cuando la cuenta no es aliado, que es el
 * caso normal, así que eso llega como null y no como error.
 */
export function useMyPartner() {
  return useQuery({
    queryKey: ['partner-me'],
    queryFn: async () => (await api.get<Partner | ''>('/partners/me')).data || null,
  })
}

export function useUpdatePartner() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (payload: PartnerPayload) => (await api.put<Partner>('/partners/me', payload)).data,
    onSuccess: (partner) => {
      client.setQueryData(['partner-me'], partner)
      // El perfil alimenta el directorio y las recomendaciones: ambos quedan desactualizados.
      client.invalidateQueries({ queryKey: ['partner-directory'] })
      client.invalidateQueries({ queryKey: ['recommendations'] })
    },
  })
}

/** Activa o pausa la aparición en el directorio, sin perder el perfil. */
export function useSetPartnerVisibility() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (active: boolean) =>
      (await api.put<Partner>('/partners/me/visibility', { active })).data,
    onSuccess: (partner) => {
      client.setQueryData(['partner-me'], partner)
      client.invalidateQueries({ queryKey: ['partner-directory'] })
    },
  })
}

// ---------------------------------------------------------------- recomendaciones

/**
 * Aliados sugeridos para lo que está por vencerse. La ciudad solo desempata: se usa cuando el
 * vehículo no tiene una registrada, así que se manda la del perfil del usuario.
 */
export function useRecommendations(city?: string | null, limit = 3) {
  return useQuery({
    queryKey: ['recommendations', 'garage', city, limit],
    queryFn: async () =>
      (await api.get<PartnerRecommendation[]>('/recommendations', { params: { city, limit } })).data,
  })
}

export function useVehicleRecommendations(vehicleId?: string, city?: string | null, limit = 3) {
  return useQuery({
    queryKey: ['recommendations', 'vehicle', vehicleId, city, limit],
    queryFn: async () =>
      (
        await api.get<PartnerRecommendation[]>(`/vehicles/${vehicleId}/recommendations`, {
          params: { city, limit },
        })
      ).data,
    enabled: !!vehicleId,
  })
}

/** Copia un aliado del directorio a la libreta de talleres del usuario. */
export function useSavePartnerToDirectory() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (partnerId: string) =>
      (await api.post<Workshop>(`/workshops/from-partner/${partnerId}`)).data,
    onSuccess: () => client.invalidateQueries({ queryKey: ['workshops'] }),
  })
}
