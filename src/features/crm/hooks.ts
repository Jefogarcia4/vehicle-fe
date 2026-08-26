import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  Campaign,
  CampaignChannel,
  CampaignListItem,
  CampaignPayload,
  CampaignRecipient,
  CampaignSegment,
  CrmSummary,
  Customer,
  CustomerListItem,
  CustomerPayload,
  CustomerVehiclePayload,
  ImportPreview,
  ImportResult,
  MessagePreview,
  Paged,
  SegmentPreview,
} from '@/lib/types'

/**
 * CRM del aliado. Todo cuelga de /crm y el backend resuelve de qué negocio son los datos a
 * partir de la sesión, así que ningún hook necesita pasar el id del aliado.
 */

export interface CustomerFilters {
  q?: string
  city?: string
  subscribed?: boolean
  expiringWithinDays?: number
  page?: number
}

/** Invalida todo lo que un cambio de clientes deja desactualizado. */
function refreshCrm(client: ReturnType<typeof useQueryClient>) {
  client.invalidateQueries({ queryKey: ['crm-customers'] })
  client.invalidateQueries({ queryKey: ['crm-summary'] })
  // El segmento de las campañas se calcula sobre estos mismos clientes.
  client.invalidateQueries({ queryKey: ['crm-segment'] })
}

// ---------------------------------------------------------------- tablero y clientes

export function useCrmSummary() {
  return useQuery({
    queryKey: ['crm-summary'],
    queryFn: async () => (await api.get<CrmSummary>('/crm/summary')).data,
  })
}

export function useCrmCities() {
  return useQuery({
    queryKey: ['crm-cities'],
    queryFn: async () => (await api.get<string[]>('/crm/cities')).data,
    staleTime: 10 * 60_000,
  })
}

export function useCustomers(filters: CustomerFilters) {
  return useQuery({
    queryKey: ['crm-customers', filters],
    queryFn: async () =>
      (await api.get<Paged<CustomerListItem>>('/crm/customers', { params: filters })).data,
  })
}

export function useCustomer(id?: string) {
  return useQuery({
    queryKey: ['crm-customer', id],
    queryFn: async () => (await api.get<Customer>(`/crm/customers/${id}`)).data,
    enabled: !!id,
  })
}

export function useSaveCustomer() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, payload }: { id?: string; payload: CustomerPayload }) =>
      id
        ? (await api.put<Customer>(`/crm/customers/${id}`, payload)).data
        : (await api.post<Customer>('/crm/customers', payload)).data,
    onSuccess: (customer) => {
      client.setQueryData(['crm-customer', customer.id], customer)
      refreshCrm(client)
    },
  })
}

export function useDeleteCustomer() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/crm/customers/${id}`)
    },
    onSuccess: () => refreshCrm(client),
  })
}

/** Alta, edición y baja de un vehículo. Las tres devuelven la ficha completa del cliente. */
export function useSaveCustomerVehicle() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async ({
      customerId,
      vehicleId,
      payload,
    }: {
      customerId: string
      vehicleId?: string
      payload: CustomerVehiclePayload
    }) =>
      vehicleId
        ? (await api.put<Customer>(`/crm/customers/${customerId}/vehicles/${vehicleId}`, payload)).data
        : (await api.post<Customer>(`/crm/customers/${customerId}/vehicles`, payload)).data,
    onSuccess: (customer) => {
      client.setQueryData(['crm-customer', customer.id], customer)
      refreshCrm(client)
    },
  })
}

export function useDeleteCustomerVehicle() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async ({ customerId, vehicleId }: { customerId: string; vehicleId: string }) =>
      (await api.delete<Customer>(`/crm/customers/${customerId}/vehicles/${vehicleId}`)).data,
    onSuccess: (customer) => {
      client.setQueryData(['crm-customer', customer.id], customer)
      refreshCrm(client)
    },
  })
}

// ---------------------------------------------------------------- importación

export function useImportTemplate() {
  return useQuery({
    queryKey: ['crm-import-template'],
    queryFn: async () => (await api.get<{ csv: string }>('/crm/import/template')).data.csv,
    staleTime: Infinity,
  })
}

/** Lee el archivo y dice qué haría, sin escribir nada. */
export function usePreviewImport() {
  return useMutation({
    mutationFn: async (csv: string) =>
      (await api.post<ImportPreview>('/crm/import/preview', { csv })).data,
  })
}

export function useRunImport() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async ({ csv, assumeConsent }: { csv: string; assumeConsent: boolean }) =>
      (await api.post<ImportResult>('/crm/import', { csv, assumeConsent })).data,
    onSuccess: () => refreshCrm(client),
  })
}

// ---------------------------------------------------------------- campañas

export function useCampaigns() {
  return useQuery({
    queryKey: ['crm-campaigns'],
    queryFn: async () => (await api.get<CampaignListItem[]>('/crm/campaigns')).data,
  })
}

/**
 * Una campaña. Mientras se está enviando se refresca sola: el despacho ocurre en el servidor y
 * sin esto el contador se quedaría congelado.
 */
export function useCampaign(id?: string) {
  return useQuery({
    queryKey: ['crm-campaign', id],
    queryFn: async () => (await api.get<Campaign>(`/crm/campaigns/${id}`)).data,
    enabled: !!id,
    refetchInterval: (query) =>
      query.state.data?.status === 'Sending' || query.state.data?.status === 'Scheduled' ? 3000 : false,
  })
}

export function useSaveCampaign() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, payload }: { id?: string; payload: CampaignPayload }) =>
      id
        ? (await api.put<Campaign>(`/crm/campaigns/${id}`, payload)).data
        : (await api.post<Campaign>('/crm/campaigns', payload)).data,
    onSuccess: (campaign) => {
      client.setQueryData(['crm-campaign', campaign.id], campaign)
      client.invalidateQueries({ queryKey: ['crm-campaigns'] })
    },
  })
}

export function useDeleteCampaign() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/crm/campaigns/${id}`)
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ['crm-campaigns'] }),
  })
}

export function useSendCampaign() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => (await api.post<Campaign>(`/crm/campaigns/${id}/send`)).data,
    onSuccess: (campaign) => {
      client.setQueryData(['crm-campaign', campaign.id], campaign)
      client.invalidateQueries({ queryKey: ['crm-campaigns'] })
      client.invalidateQueries({ queryKey: ['crm-summary'] })
    },
  })
}

export function useCancelCampaign() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => (await api.post<Campaign>(`/crm/campaigns/${id}/cancel`)).data,
    onSuccess: (campaign) => {
      client.setQueryData(['crm-campaign', campaign.id], campaign)
      client.invalidateQueries({ queryKey: ['crm-campaigns'] })
    },
  })
}

export function useCampaignRecipients(id?: string, enabled = true) {
  return useQuery({
    queryKey: ['crm-recipients', id],
    queryFn: async () =>
      (await api.get<CampaignRecipient[]>(`/crm/campaigns/${id}/recipients`)).data,
    enabled: !!id && enabled,
  })
}

/**
 * A cuántos llegaría el segmento. Se consulta mientras el aliado mueve los filtros, así que
 * mantiene el resultado anterior visible para que el número no parpadee en cada ajuste.
 */
export function useSegmentPreview(segment: CampaignSegment, channels: CampaignChannel[]) {
  return useQuery({
    queryKey: ['crm-segment', segment, channels],
    queryFn: async () =>
      (await api.post<SegmentPreview>('/crm/campaigns/preview-segment', { segment, channels })).data,
    placeholderData: (previous) => previous,
  })
}

export function usePreviewMessage() {
  return useMutation({
    mutationFn: async (payload: CampaignPayload) =>
      (await api.post<MessagePreview>('/crm/campaigns/preview-message', payload)).data,
  })
}

export function useMessageTokens() {
  return useQuery({
    queryKey: ['crm-message-tokens'],
    queryFn: async () =>
      (await api.get<Array<{ token: string; description: string }>>('/crm/message-tokens')).data,
    staleTime: Infinity,
  })
}
