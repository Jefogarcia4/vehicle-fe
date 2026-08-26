import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  ConfirmLookupPayload,
  DriverProfile,
  OfficialRecord,
  PlateLookupDraft,
  PlateLookupPayload,
  VehicleDetail,
} from '@/lib/types'

/**
 * Alta de un vehículo por placa.
 *
 * Son dos llamadas y no una porque la consulta se cobra: primero se busca y se muestra lo
 * encontrado, y solo al confirmar se crea el vehículo reusando esa misma respuesta.
 */

/** Si el servidor tiene configurada la consulta. Sin esto la app ofrece el alta manual. */
export function useLookupEnabled() {
  return useQuery({
    queryKey: ['lookup-status'],
    queryFn: async () => (await api.get<{ enabled: boolean }>('/vehicles/lookup/status')).data.enabled,
    staleTime: 30 * 60_000,
  })
}

export function useLookupPlate() {
  return useMutation({
    mutationFn: async (payload: PlateLookupPayload) =>
      (await api.post<PlateLookupDraft>('/vehicles/lookup', payload)).data,
  })
}

export function useConfirmLookup() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (payload: ConfirmLookupPayload) =>
      (await api.post<VehicleDetail>('/vehicles/lookup/confirm', payload)).data,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['vehicles'] })
      client.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

/** Todo lo que las fuentes oficiales saben del vehículo. */
export function useOfficialRecord(vehicleId?: string) {
  return useQuery({
    queryKey: ['official', vehicleId],
    queryFn: async () => (await api.get<OfficialRecord>(`/vehicles/${vehicleId}/official`)).data,
    enabled: !!vehicleId,
  })
}

/**
 * El conductor en sesión: sus categorías, certificados y trámites.
 *
 * No cuelga de un vehículo porque no es del vehículo —quien tiene tres carros tiene una sola
 * licencia—. El servidor responde 204 mientras no se haya consultado ninguna placa a su nombre.
 */
export function useDriverProfile() {
  return useQuery({
    queryKey: ['driver'],
    queryFn: async () => (await api.get<DriverProfile | ''>('/driver')).data || null,
    staleTime: 5 * 60_000,
  })
}

/**
 * Vuelve a consultar la placa. Cuesta créditos, así que la pantalla lo advierte antes de
 * llamarlo y no se dispara solo.
 */
export function useRefreshOfficial(vehicleId: string) {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (payload: PlateLookupPayload) =>
      (await api.post(`/vehicles/${vehicleId}/official/refresh`, payload)).data,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['official', vehicleId] })
      client.invalidateQueries({ queryKey: ['vehicles', vehicleId] })
      // La consulta trae también la licencia del titular, que vive en el perfil.
      client.invalidateQueries({ queryKey: ['driver'] })
    },
  })
}
