import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  Dashboard,
  VehicleAlert,
  VehicleDetail,
  VehicleListItem,
  VehicleMember,
  VehiclePayload,
  VehicleRole,
} from '@/lib/types'

export const vehicleKeys = {
  all: ['vehicles'] as const,
  detail: (id: string) => ['vehicles', id] as const,
  alerts: (id: string) => ['vehicles', id, 'alerts'] as const,
  dashboard: ['dashboard'] as const,
}

export function useVehicles() {
  return useQuery({
    queryKey: vehicleKeys.all,
    queryFn: async () => (await api.get<VehicleListItem[]>('/vehicles')).data,
  })
}

export function useVehicle(id?: string) {
  return useQuery({
    queryKey: vehicleKeys.detail(id!),
    queryFn: async () => (await api.get<VehicleDetail>(`/vehicles/${id}`)).data,
    enabled: !!id,
  })
}

export function useVehicleAlerts(id?: string) {
  return useQuery({
    queryKey: vehicleKeys.alerts(id!),
    queryFn: async () => (await api.get<VehicleAlert[]>(`/vehicles/${id}/alerts`)).data,
    enabled: !!id,
  })
}

export function useDashboard() {
  return useQuery({
    queryKey: vehicleKeys.dashboard,
    queryFn: async () => (await api.get<Dashboard>('/dashboard')).data,
  })
}

/**
 * Invalida todo lo que depende de un vehículo. Cualquier registro nuevo puede mover el
 * kilometraje, y con él las alertas, el plan y el tablero, así que se refrescan juntos.
 */
export function useInvalidateVehicle() {
  const client = useQueryClient()

  return (vehicleId?: string) => {
    client.invalidateQueries({ queryKey: vehicleKeys.all })
    client.invalidateQueries({ queryKey: vehicleKeys.dashboard })
    if (vehicleId) client.invalidateQueries({ queryKey: ['vehicles', vehicleId] })
  }
}

export function useUpdateVehicle(id: string) {
  const invalidate = useInvalidateVehicle()

  return useMutation({
    mutationFn: async (payload: VehiclePayload) =>
      (await api.put<VehicleDetail>(`/vehicles/${id}`, payload)).data,
    onSuccess: () => invalidate(id),
  })
}

export function useDeleteVehicle() {
  const invalidate = useInvalidateVehicle()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/vehicles/${id}`)
    },
    onSuccess: () => invalidate(),
  })
}

export function useUpdateOdometer(id: string) {
  const invalidate = useInvalidateVehicle()

  return useMutation({
    mutationFn: async (payload: { odometer: number; date?: string; notes?: string }) =>
      (await api.post<VehicleDetail>(`/vehicles/${id}/odometer`, payload)).data,
    onSuccess: () => invalidate(id),
  })
}

export function useSetHistoryPublic(id: string) {
  const invalidate = useInvalidateVehicle()

  return useMutation({
    mutationFn: async (enabled: boolean) =>
      (await api.post<VehicleDetail>(`/vehicles/${id}/public-history?enabled=${enabled}`)).data,
    onSuccess: () => invalidate(id),
  })
}

export function useShareVehicle(id: string) {
  const invalidate = useInvalidateVehicle()

  return useMutation({
    mutationFn: async (payload: { email: string; role: VehicleRole; displayName?: string }) =>
      (await api.post<VehicleMember>(`/vehicles/${id}/members`, payload)).data,
    onSuccess: () => invalidate(id),
  })
}

export function useRemoveMember(id: string) {
  const invalidate = useInvalidateVehicle()

  return useMutation({
    mutationFn: async (memberId: string) => {
      await api.delete(`/vehicles/${id}/members/${memberId}`)
    },
    onSuccess: () => invalidate(id),
  })
}
