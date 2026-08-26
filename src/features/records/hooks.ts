import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useInvalidateVehicle } from '@/features/vehicles/hooks'
import type {
  CostSummary,
  DocumentPayload,
  Expense,
  ExpensePayload,
  Fine,
  FinePayload,
  FuelLog,
  FuelPayload,
  FuelStats,
  MaintenancePayload,
  MaintenanceRecord,
  Reminder,
  ReminderPayload,
  ServicePlanItem,
  ServicePlanPayload,
  TireSet,
  TireSetPayload,
  VehicleDocument,
  Workshop,
  WorkshopNotesPayload,
} from '@/lib/types'

/**
 * Todos los módulos de un vehículo comparten la misma forma de API
 * (/vehicles/{id}/{recurso}), así que comparten también la forma de consultarlos.
 * Cada mutación invalida su propia lista y además el vehículo completo, porque casi
 * cualquier registro afecta kilometraje, alertas y tablero.
 */
function resourceKey(vehicleId: string, resource: string) {
  return ['vehicles', vehicleId, resource] as const
}

function useResourceList<T>(vehicleId: string | undefined, resource: string, query = '') {
  return useQuery({
    queryKey: [...resourceKey(vehicleId!, resource), query],
    queryFn: async () => (await api.get<T[]>(`/vehicles/${vehicleId}/${resource}${query}`)).data,
    enabled: !!vehicleId,
  })
}

/** Mutación sobre un recurso del vehículo, con la invalidación ya resuelta. */
function useResourceMutation<TVariables, TResult>(
  vehicleId: string,
  request: (variables: TVariables) => Promise<TResult>,
) {
  const client = useQueryClient()
  const invalidateVehicle = useInvalidateVehicle()

  return useMutation({
    mutationFn: request,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['vehicles', vehicleId] })
      invalidateVehicle(vehicleId)
    },
  })
}

// ---------------------------------------------------------------- documentos

export const useDocuments = (vehicleId?: string, includeArchived = false) =>
  useResourceList<VehicleDocument>(vehicleId, 'documents', `?includeArchived=${includeArchived}`)

export const useSaveDocument = (vehicleId: string) =>
  useResourceMutation(vehicleId, async ({ id, payload }: { id?: string; payload: DocumentPayload }) =>
    id
      ? (await api.put<VehicleDocument>(`/vehicles/${vehicleId}/documents/${id}`, payload)).data
      : (await api.post<VehicleDocument>(`/vehicles/${vehicleId}/documents`, payload)).data,
  )

export const useRenewDocument = (vehicleId: string) =>
  useResourceMutation(
    vehicleId,
    async ({ id, payload }: { id: string; payload: DocumentPayload }) =>
      (await api.post<VehicleDocument>(`/vehicles/${vehicleId}/documents/${id}/renew`, payload)).data,
  )

export const useDeleteDocument = (vehicleId: string) =>
  useResourceMutation(vehicleId, async (id: string) => {
    await api.delete(`/vehicles/${vehicleId}/documents/${id}`)
  })

// ---------------------------------------------------------------- mantenimiento

export const useMaintenance = (vehicleId?: string) =>
  useResourceList<MaintenanceRecord>(vehicleId, 'maintenance')

export const useSaveMaintenance = (vehicleId: string) =>
  useResourceMutation(vehicleId, async ({ id, payload }: { id?: string; payload: MaintenancePayload }) =>
    id
      ? (await api.put<MaintenanceRecord>(`/vehicles/${vehicleId}/maintenance/${id}`, payload)).data
      : (await api.post<MaintenanceRecord>(`/vehicles/${vehicleId}/maintenance`, payload)).data,
  )

export const useDeleteMaintenance = (vehicleId: string) =>
  useResourceMutation(vehicleId, async (id: string) => {
    await api.delete(`/vehicles/${vehicleId}/maintenance/${id}`)
  })

// ---------------------------------------------------------------- plan de mantenimiento

export const useServicePlan = (vehicleId?: string) =>
  useResourceList<ServicePlanItem>(vehicleId, 'service-plan')

export const useSavePlanItem = (vehicleId: string) =>
  useResourceMutation(vehicleId, async ({ id, payload }: { id?: string; payload: ServicePlanPayload }) =>
    id
      ? (await api.put<ServicePlanItem>(`/vehicles/${vehicleId}/service-plan/${id}`, payload)).data
      : (await api.post<ServicePlanItem>(`/vehicles/${vehicleId}/service-plan`, payload)).data,
  )

export const useMarkPlanDone = (vehicleId: string) =>
  useResourceMutation(vehicleId, async ({ id, odometer }: { id: string; odometer?: number }) => {
    const query = odometer ? `?odometer=${odometer}` : ''
    return (await api.post<ServicePlanItem>(`/vehicles/${vehicleId}/service-plan/${id}/done${query}`)).data
  })

export const useApplyPlanTemplate = (vehicleId: string) =>
  useResourceMutation<void, ServicePlanItem[]>(
    vehicleId,
    async () => (await api.post<ServicePlanItem[]>(`/vehicles/${vehicleId}/service-plan/apply-template`)).data,
  )

export const useDeletePlanItem = (vehicleId: string) =>
  useResourceMutation(vehicleId, async (id: string) => {
    await api.delete(`/vehicles/${vehicleId}/service-plan/${id}`)
  })

// ---------------------------------------------------------------- combustible

export const useFuelLogs = (vehicleId?: string) => useResourceList<FuelLog>(vehicleId, 'fuel')

export function useFuelStats(vehicleId?: string) {
  return useQuery({
    queryKey: ['vehicles', vehicleId, 'fuel-stats'],
    queryFn: async () => (await api.get<FuelStats>(`/vehicles/${vehicleId}/fuel/stats`)).data,
    enabled: !!vehicleId,
  })
}

export const useSaveFuelLog = (vehicleId: string) =>
  useResourceMutation(vehicleId, async ({ id, payload }: { id?: string; payload: FuelPayload }) =>
    id
      ? (await api.put<FuelLog>(`/vehicles/${vehicleId}/fuel/${id}`, payload)).data
      : (await api.post<FuelLog>(`/vehicles/${vehicleId}/fuel`, payload)).data,
  )

export const useDeleteFuelLog = (vehicleId: string) =>
  useResourceMutation(vehicleId, async (id: string) => {
    await api.delete(`/vehicles/${vehicleId}/fuel/${id}`)
  })

// ---------------------------------------------------------------- gastos

export const useExpenses = (vehicleId?: string) => useResourceList<Expense>(vehicleId, 'expenses')

export function useCostSummary(vehicleId?: string, months = 12) {
  return useQuery({
    queryKey: ['vehicles', vehicleId, 'cost-summary', months],
    queryFn: async () =>
      (await api.get<CostSummary>(`/vehicles/${vehicleId}/expenses/summary?months=${months}`)).data,
    enabled: !!vehicleId,
  })
}

export const useSaveExpense = (vehicleId: string) =>
  useResourceMutation(vehicleId, async ({ id, payload }: { id?: string; payload: ExpensePayload }) =>
    id
      ? (await api.put<Expense>(`/vehicles/${vehicleId}/expenses/${id}`, payload)).data
      : (await api.post<Expense>(`/vehicles/${vehicleId}/expenses`, payload)).data,
  )

export const useDeleteExpense = (vehicleId: string) =>
  useResourceMutation(vehicleId, async (id: string) => {
    await api.delete(`/vehicles/${vehicleId}/expenses/${id}`)
  })

// ---------------------------------------------------------------- recordatorios

export const useReminders = (vehicleId?: string, includeDone = false) =>
  useResourceList<Reminder>(vehicleId, 'reminders', `?includeDone=${includeDone}`)

export const useSaveReminder = (vehicleId: string) =>
  useResourceMutation(vehicleId, async ({ id, payload }: { id?: string; payload: ReminderPayload }) =>
    id
      ? (await api.put<Reminder>(`/vehicles/${vehicleId}/reminders/${id}`, payload)).data
      : (await api.post<Reminder>(`/vehicles/${vehicleId}/reminders`, payload)).data,
  )

export const useCompleteReminder = (vehicleId: string) =>
  useResourceMutation(
    vehicleId,
    async (id: string) => (await api.post<Reminder>(`/vehicles/${vehicleId}/reminders/${id}/complete`)).data,
  )

export const useDeleteReminder = (vehicleId: string) =>
  useResourceMutation(vehicleId, async (id: string) => {
    await api.delete(`/vehicles/${vehicleId}/reminders/${id}`)
  })

// ---------------------------------------------------------------- llantas

export const useTireSets = (vehicleId?: string) => useResourceList<TireSet>(vehicleId, 'tires')

export const useInstallTires = (vehicleId: string) =>
  useResourceMutation(
    vehicleId,
    async (payload: TireSetPayload) => (await api.post<TireSet>(`/vehicles/${vehicleId}/tires`, payload)).data,
  )

export const useRegisterRotation = (vehicleId: string) =>
  useResourceMutation(
    vehicleId,
    async (id: string) => (await api.post<TireSet>(`/vehicles/${vehicleId}/tires/${id}/rotation`)).data,
  )

export const useDeleteTireSet = (vehicleId: string) =>
  useResourceMutation(vehicleId, async (id: string) => {
    await api.delete(`/vehicles/${vehicleId}/tires/${id}`)
  })

// ---------------------------------------------------------------- comparendos

export const useFines = (vehicleId?: string) => useResourceList<Fine>(vehicleId, 'fines')

export const useSaveFine = (vehicleId: string) =>
  useResourceMutation(vehicleId, async ({ id, payload }: { id?: string; payload: FinePayload }) =>
    id
      ? (await api.put<Fine>(`/vehicles/${vehicleId}/fines/${id}`, payload)).data
      : (await api.post<Fine>(`/vehicles/${vehicleId}/fines`, payload)).data,
  )

export const usePayFine = (vehicleId: string) =>
  useResourceMutation(
    vehicleId,
    async (id: string) => (await api.post<Fine>(`/vehicles/${vehicleId}/fines/${id}/pay`)).data,
  )

export const useDeleteFine = (vehicleId: string) =>
  useResourceMutation(vehicleId, async (id: string) => {
    await api.delete(`/vehicles/${vehicleId}/fines/${id}`)
  })

// ---------------------------------------------------------------- talleres

export function useWorkshops() {
  return useQuery({
    queryKey: ['workshops'],
    queryFn: async () => (await api.get<Workshop[]>('/workshops')).data,
  })
}

/**
 * Guarda la calificación, las notas y el favorito. Los talleres no se crean ni se editan desde
 * aquí: entran guardando un aliado del directorio.
 */
export function useSaveWorkshopNotes() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: WorkshopNotesPayload }) =>
      (await api.put<Workshop>(`/workshops/${id}`, payload)).data,
    onSuccess: () => client.invalidateQueries({ queryKey: ['workshops'] }),
  })
}

/**
 * Autoriza o revoca que el aliado detrás de este taller guarde tus datos y te escriba. Es una
 * decisión sobre datos personales, así que va por su propio endpoint y no dentro del formulario.
 */
export function useSetWorkshopSharing() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, share }: { id: string; share: boolean }) =>
      (await api.put<Workshop>(`/workshops/${id}/sharing`, { share })).data,
    onSuccess: () => client.invalidateQueries({ queryKey: ['workshops'] }),
  })
}

export function useDeleteWorkshop() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/workshops/${id}`)
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ['workshops'] }),
  })
}
