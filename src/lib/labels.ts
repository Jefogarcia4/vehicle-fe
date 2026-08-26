import type {
  AlertSeverity,
  CampaignChannel,
  CampaignStatus,
  CustomerSource,
  DeliveryStatus,
  DocumentType,
  ExpenseCategory,
  FineStatus,
  FuelType,
  MaintenanceType,
  TirePosition,
  TransmissionType,
  VehicleRole,
  VehicleType,
} from './types'

/**
 * Traducciones de los enums de la API. Están en un solo lugar para que una etiqueta se lea
 * igual en el tablero, en el formulario y en la hoja de vida pública.
 */

export const vehicleTypeLabels: Record<VehicleType, string> = {
  Car: 'Automóvil',
  Motorcycle: 'Motocicleta',
  Pickup: 'Camioneta pick-up',
  Suv: 'Camioneta SUV',
  Van: 'Van',
  Truck: 'Camión',
  Bus: 'Bus',
  Other: 'Otro',
}

export const fuelTypeLabels: Record<FuelType, string> = {
  Gasoline: 'Gasolina',
  Diesel: 'Diésel',
  Gas: 'Gas (GNV)',
  Electric: 'Eléctrico',
  Hybrid: 'Híbrido',
  PlugInHybrid: 'Híbrido enchufable',
  Other: 'Otro',
}

export const transmissionLabels: Record<TransmissionType, string> = {
  Manual: 'Mecánica',
  Automatic: 'Automática',
  Cvt: 'CVT',
  DualClutch: 'Doble embrague',
  Other: 'Otra',
}

export const maintenanceTypeLabels: Record<MaintenanceType, string> = {
  OilChange: 'Cambio de aceite',
  Filters: 'Filtros',
  Brakes: 'Frenos',
  Tires: 'Llantas',
  Alignment: 'Alineación y balanceo',
  Battery: 'Batería',
  TimingBelt: 'Correa de repartición',
  Suspension: 'Suspensión',
  Clutch: 'Embrague',
  Cooling: 'Refrigeración',
  Transmission: 'Transmisión',
  Electrical: 'Eléctrico',
  AirConditioning: 'Aire acondicionado',
  BodyWork: 'Latonería y pintura',
  Diagnostics: 'Diagnóstico',
  Wash: 'Lavado',
  Accessories: 'Accesorios',
  PreventiveCheck: 'Revisión preventiva',
  Engine: 'Motor',
  Exhaust: 'Escape',
  Other: 'Otro',
}

export const documentTypeLabels: Record<DocumentType, string> = {
  Soat: 'SOAT',
  TechnicalInspection: 'Tecnomecánica',
  InsurancePolicy: 'Póliza todo riesgo',
  VehicleTax: 'Impuesto vehicular',
  DriverLicense: 'Licencia de conducción',
  Registration: 'Tarjeta de propiedad',
  OperationCard: 'Tarjeta de operación',
  GasCertificate: 'Certificado de gas',
  SafetyKit: 'Kit de carretera',
  Other: 'Otro documento',
}

export const expenseCategoryLabels: Record<ExpenseCategory, string> = {
  Fuel: 'Combustible',
  Maintenance: 'Mantenimiento',
  Toll: 'Peajes',
  Parking: 'Parqueadero',
  Wash: 'Lavado',
  Fine: 'Multas',
  Insurance: 'Seguros',
  Tax: 'Impuestos',
  Accessories: 'Accesorios',
  Financing: 'Cuota del crédito',
  Other: 'Otros',
}

export const fineStatusLabels: Record<FineStatus, string> = {
  Pending: 'Pendiente',
  Paid: 'Pagado',
  Appealed: 'En impugnación',
  Cancelled: 'Anulado',
}

export const tirePositionLabels: Record<TirePosition, string> = {
  FrontLeft: 'Delantera izquierda',
  FrontRight: 'Delantera derecha',
  RearLeft: 'Trasera izquierda',
  RearRight: 'Trasera derecha',
  Spare: 'Repuesto',
  Front: 'Delantera',
  Rear: 'Trasera',
}

export const roleLabels: Record<VehicleRole, string> = {
  Owner: 'Propietario',
  Driver: 'Conductor',
  Workshop: 'Taller',
  Viewer: 'Solo lectura',
}

export const severityLabels: Record<AlertSeverity, string> = {
  Info: 'Informativo',
  Warning: 'Por vencer',
  Critical: 'Urgente',
  Expired: 'Vencido',
}

/** Clases del chip según la urgencia. Mismo lenguaje visual en toda la app. */
export const severityChip: Record<AlertSeverity, string> = {
  Info: 'chip-neutral',
  Warning: 'chip-warn',
  Critical: 'chip-danger',
  Expired: 'chip-danger',
}

/** Color de acento para barras, anillos y bordes según urgencia. */
export const severityAccent: Record<AlertSeverity, string> = {
  Info: 'bg-carbon-300',
  Warning: 'bg-warn-500',
  Critical: 'bg-danger-500',
  Expired: 'bg-danger-600',
}

export const campaignStatusLabels: Record<CampaignStatus, string> = {
  Draft: 'Borrador',
  Scheduled: 'Programada',
  Sending: 'Enviando',
  Sent: 'Enviada',
  Cancelled: 'Cancelada',
}

export const campaignStatusChip: Record<CampaignStatus, string> = {
  Draft: 'chip-neutral',
  Scheduled: 'chip-brand',
  Sending: 'chip-warn',
  Sent: 'chip-ok',
  Cancelled: 'chip-danger',
}

export const campaignChannelLabels: Record<CampaignChannel, string> = {
  Email: 'Correo',
  InApp: 'Aviso en la app',
  Whatsapp: 'WhatsApp',
}

export const deliveryStatusLabels: Record<DeliveryStatus, string> = {
  Pending: 'En cola',
  Sent: 'Enviado',
  Failed: 'Falló',
  Skipped: 'Omitido',
}

export const deliveryStatusChip: Record<DeliveryStatus, string> = {
  Pending: 'chip-neutral',
  Sent: 'chip-ok',
  Failed: 'chip-danger',
  Skipped: 'chip-warn',
}

export const customerSourceLabels: Record<CustomerSource, string> = {
  Manual: 'Registro manual',
  Import: 'Importado',
  App: 'Desde la app',
}

/** Convierte un mapa de etiquetas en opciones para un select. */
export function toOptions<T extends string>(labels: Record<T, string>): Array<{ value: T; label: string }> {
  return (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }))
}

/** Colores del puntaje de salud: verde sano, ámbar en riesgo, rojo con algo vencido. */
export function healthTone(score: number): { text: string; ring: string; bg: string; label: string } {
  if (score >= 80) return { text: 'text-ok-600', ring: 'stroke-ok-500', bg: 'bg-ok-50', label: 'Al día' }
  if (score >= 55) return { text: 'text-warn-600', ring: 'stroke-warn-500', bg: 'bg-warn-50', label: 'Requiere atención' }
  return { text: 'text-danger-600', ring: 'stroke-danger-500', bg: 'bg-danger-50', label: 'Atrasado' }
}
