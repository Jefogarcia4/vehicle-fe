/**
 * Tipos que viajan por la API. Los enums llegan como texto desde .NET, así que aquí se
 * declaran como uniones de string: se pueden comparar y usar como llave de los mapas de
 * etiquetas sin ninguna conversión.
 */

export type VehicleType = 'Car' | 'Motorcycle' | 'Pickup' | 'Suv' | 'Van' | 'Truck' | 'Bus' | 'Other'
export type FuelType = 'Gasoline' | 'Diesel' | 'Gas' | 'Electric' | 'Hybrid' | 'PlugInHybrid' | 'Other'
export type TransmissionType = 'Manual' | 'Automatic' | 'Cvt' | 'DualClutch' | 'Other'
export type DistanceUnit = 'Kilometers' | 'Miles'
export type VolumeUnit = 'Gallons' | 'Liters'
export type VehicleRole = 'Owner' | 'Driver' | 'Workshop' | 'Viewer'

export type MaintenanceType =
  | 'OilChange' | 'Filters' | 'Brakes' | 'Tires' | 'Alignment' | 'Battery' | 'TimingBelt'
  | 'Suspension' | 'Clutch' | 'Cooling' | 'Transmission' | 'Electrical' | 'AirConditioning'
  | 'BodyWork' | 'Diagnostics' | 'Wash' | 'Accessories' | 'PreventiveCheck' | 'Engine'
  | 'Exhaust' | 'Other'

export type DocumentType =
  | 'Soat' | 'TechnicalInspection' | 'InsurancePolicy' | 'VehicleTax' | 'DriverLicense'
  | 'Registration' | 'OperationCard' | 'GasCertificate' | 'SafetyKit' | 'Other'

export type ExpenseCategory =
  | 'Fuel' | 'Maintenance' | 'Toll' | 'Parking' | 'Wash' | 'Fine' | 'Insurance' | 'Tax'
  | 'Accessories' | 'Financing' | 'Other'

export type ReminderType = 'Document' | 'Maintenance' | 'Tires' | 'Insurance' | 'Tax' | 'Custom'
export type FineStatus = 'Pending' | 'Paid' | 'Appealed' | 'Cancelled'
export type TirePosition = 'FrontLeft' | 'FrontRight' | 'RearLeft' | 'RearRight' | 'Spare' | 'Front' | 'Rear'

export type AlertKind = 'Document' | 'Service' | 'Tire' | 'Reminder' | 'Fine'
export type AlertSeverity = 'Info' | 'Warning' | 'Critical' | 'Expired'

// ---------------------------------------------------------------- auth

export interface User {
  id: string
  email: string
  fullName: string
  phone?: string | null
  city?: string | null
  roles: string[]
}

export interface AuthResponse {
  token: string
  expiresAtUtc: string
  user: User
}

// ---------------------------------------------------------------- vehículos

export interface VehicleListItem {
  id: string
  nickname: string
  plate: string
  type: VehicleType
  brand: string
  model: string
  year: number
  color?: string | null
  photoUrl?: string | null
  currentOdometer: number
  distanceUnit: DistanceUnit
  isOwner: boolean
  role: VehicleRole
  healthScore: number
  alertCount: number
  nextAlertLabel?: string | null
  nextAlertDays?: number | null
}

export interface VehicleMember {
  id: string
  email: string
  displayName?: string | null
  role: VehicleRole
  isAccepted: boolean
}

export interface VehicleDetail extends VehicleListItem {
  trim?: string | null
  vin?: string | null
  engineNumber?: string | null
  engineDisplacementCc?: number | null
  fuelType: FuelType
  transmission: TransmissionType
  doors?: number | null
  seats?: number | null
  volumeUnit: VolumeUnit
  initialOdometer: number
  lastOdometerAtUtc?: string | null
  purchaseDate?: string | null
  purchasePrice?: number | null
  city?: string | null
  notes?: string | null
  isActive: boolean
  publicSlug: string
  isHistoryPublic: boolean
  averageKmPerDay: number
  members: VehicleMember[]
}

export interface VehiclePayload {
  nickname: string
  plate: string
  type: VehicleType
  brand: string
  model: string
  trim?: string | null
  year: number
  color?: string | null
  vin?: string | null
  engineNumber?: string | null
  engineDisplacementCc?: number | null
  fuelType: FuelType
  transmission: TransmissionType
  doors?: number | null
  seats?: number | null
  distanceUnit: DistanceUnit
  volumeUnit: VolumeUnit
  currentOdometer: number
  purchaseDate?: string | null
  purchasePrice?: number | null
  city?: string | null
  photoUrl?: string | null
  notes?: string | null
  seedServicePlan?: boolean
}

// ---------------------------------------------------------------- alertas y tablero

export interface VehicleAlert {
  vehicleId: string
  vehicleName: string
  plate: string
  kind: AlertKind
  severity: AlertSeverity
  title: string
  subtitle?: string | null
  dueDate?: string | null
  daysRemaining?: number | null
  dueOdometer?: number | null
  kmRemaining?: number | null
  relatedId?: string | null
  /** Documento a renovar, cuando la alerta viene de uno. Es lo que cruza con las categorías de aliados. */
  documentType?: DocumentType | null
  /** Trabajo que resolvería la alerta, cuando se trata de un servicio o de llantas. */
  serviceType?: MaintenanceType | null
  weight: number
}

export interface Activity {
  vehicleId: string
  vehicleName: string
  kind: 'maintenance' | 'fuel' | 'expense' | 'fine'
  title: string
  subtitle?: string | null
  date: string
  amount?: number | null
  odometer?: number | null
}

export interface Dashboard {
  vehicleCount: number
  overallHealth: number
  expiredCount: number
  criticalCount: number
  warningCount: number
  monthSpend: number
  yearSpend: number
  vehicles: VehicleListItem[]
  alerts: VehicleAlert[]
  recentActivity: Activity[]
}

// ---------------------------------------------------------------- documentos

export interface VehicleDocument {
  id: string
  vehicleId: string
  type: DocumentType
  name: string
  number?: string | null
  issuer?: string | null
  issueDate?: string | null
  expiryDate: string
  cost?: number | null
  fileUrl?: string | null
  notes?: string | null
  remindDaysBefore: number
  isArchived: boolean
  daysToExpire: number
}

export interface DocumentPayload {
  type: DocumentType
  name?: string | null
  number?: string | null
  issuer?: string | null
  issueDate?: string | null
  expiryDate: string
  cost?: number | null
  fileUrl?: string | null
  notes?: string | null
  remindDaysBefore: number
}

// ---------------------------------------------------------------- mantenimiento

export interface MaintenanceItem {
  id: string
  description: string
  category: MaintenanceType
  partNumber?: string | null
  brand?: string | null
  quantity: number
  unitCost: number
  subtotal: number
  warrantyMonths?: number | null
  warrantyKm?: number | null
}

export interface MaintenanceRecord {
  id: string
  vehicleId: string
  workshopId?: string | null
  workshopName?: string | null
  date: string
  odometer: number
  title: string
  type: MaintenanceType
  notes?: string | null
  laborCost: number
  partsCost: number
  totalCost: number
  invoiceNumber?: string | null
  invoiceUrl?: string | null
  nextServiceOdometer?: number | null
  nextServiceDate?: string | null
  warrantyMonths?: number | null
  warrantyKm?: number | null
  warrantyUntil?: string | null
  warrantyUntilOdometer?: number | null
  isUnderWarranty: boolean
  photos: string[]
  items: MaintenanceItem[]
}

export interface MaintenanceItemPayload {
  description: string
  category: MaintenanceType
  partNumber?: string | null
  brand?: string | null
  quantity: number
  unitCost: number
  warrantyMonths?: number | null
  warrantyKm?: number | null
}

export interface MaintenancePayload {
  workshopId?: string | null
  workshopName?: string | null
  date: string
  odometer: number
  title: string
  type: MaintenanceType
  notes?: string | null
  laborCost: number
  partsCost: number
  invoiceNumber?: string | null
  invoiceUrl?: string | null
  nextServiceOdometer?: number | null
  nextServiceDate?: string | null
  warrantyMonths?: number | null
  warrantyKm?: number | null
  photos: string[]
  items: MaintenanceItemPayload[]
  completesPlanItemIds: string[]
}

// ---------------------------------------------------------------- plan de mantenimiento

export interface ServicePlanItem {
  id: string
  vehicleId: string
  name: string
  type: MaintenanceType
  intervalKm?: number | null
  intervalMonths?: number | null
  lastServiceOdometer?: number | null
  lastServiceDate?: string | null
  isActive: boolean
  notes?: string | null
  dueOdometer?: number | null
  dueDate?: string | null
  kmRemaining?: number | null
  daysRemaining?: number | null
  progressPercent: number
  estimatedDaysByUsage?: number | null
}

export interface ServicePlanPayload {
  name: string
  type: MaintenanceType
  intervalKm?: number | null
  intervalMonths?: number | null
  lastServiceOdometer?: number | null
  lastServiceDate?: string | null
  isActive: boolean
  notes?: string | null
}

// ---------------------------------------------------------------- combustible

export interface FuelLog {
  id: string
  vehicleId: string
  date: string
  odometer: number
  volume: number
  pricePerUnit: number
  totalCost: number
  fuelType: FuelType
  station?: string | null
  isFullTank: boolean
  notes?: string | null
  distanceSinceLast?: number | null
  efficiency?: number | null
  costPerDistance?: number | null
}

export interface FuelStats {
  count: number
  totalSpent: number
  totalVolume: number
  totalDistance: number
  averageEfficiency?: number | null
  bestEfficiency?: number | null
  worstEfficiency?: number | null
  averageCostPerDistance?: number | null
  lastPricePerUnit?: number | null
  lastVsAveragePercent?: number | null
}

export interface FuelPayload {
  date: string
  odometer: number
  volume: number
  pricePerUnit: number
  totalCost: number
  fuelType: FuelType
  station?: string | null
  isFullTank: boolean
  notes?: string | null
}

// ---------------------------------------------------------------- gastos

export interface Expense {
  id: string
  vehicleId: string
  date: string
  category: ExpenseCategory
  description: string
  amount: number
  odometer?: number | null
  receiptUrl?: string | null
  notes?: string | null
}

export interface ExpensePayload {
  date: string
  category: ExpenseCategory
  description: string
  amount: number
  odometer?: number | null
  receiptUrl?: string | null
  notes?: string | null
}

export interface CategoryTotal {
  category: ExpenseCategory
  amount: number
  count: number
}

export interface MonthlyTotal {
  year: number
  month: number
  amount: number
}

export interface CostSummary {
  fuel: number
  maintenance: number
  documents: number
  fines: number
  other: number
  total: number
  distance: number
  costPerDistance?: number | null
  monthlyAverage?: number | null
  byCategory: CategoryTotal[]
  byMonth: MonthlyTotal[]
}

// ---------------------------------------------------------------- recordatorios

export interface Reminder {
  id: string
  vehicleId: string
  type: ReminderType
  title: string
  notes?: string | null
  dueDate?: string | null
  dueOdometer?: number | null
  remindDaysBefore: number
  remindKmBefore: number
  repeatMonths?: number | null
  repeatKm?: number | null
  isDone: boolean
  completedAtUtc?: string | null
  daysRemaining?: number | null
  kmRemaining?: number | null
}

export interface ReminderPayload {
  type: ReminderType
  title: string
  notes?: string | null
  dueDate?: string | null
  dueOdometer?: number | null
  remindDaysBefore: number
  remindKmBefore: number
  repeatMonths?: number | null
  repeatKm?: number | null
}

// ---------------------------------------------------------------- llantas

export interface Tire {
  id: string
  position: TirePosition
  dotCode?: string | null
  treadDepthMm?: number | null
  pressurePsi?: number | null
  lastCheckDate?: string | null
  notes?: string | null
  isWorn: boolean
}

export interface TireSet {
  id: string
  vehicleId: string
  brand: string
  model?: string | null
  size?: string | null
  installDate: string
  installOdometer: number
  expectedLifeKm: number
  cost?: number | null
  lastRotationOdometer?: number | null
  lastRotationDate?: string | null
  rotationIntervalKm: number
  isCurrent: boolean
  removedDate?: string | null
  removedOdometer?: number | null
  notes?: string | null
  kmUsed: number
  lifeUsedPercent: number
  kmRemaining: number
  kmToRotation: number
  tires: Tire[]
}

export interface TireSetPayload {
  brand: string
  model?: string | null
  size?: string | null
  installDate: string
  installOdometer: number
  expectedLifeKm: number
  cost?: number | null
  rotationIntervalKm: number
  notes?: string | null
  tires: Array<{
    position: TirePosition
    dotCode?: string | null
    treadDepthMm?: number | null
    pressurePsi?: number | null
    lastCheckDate?: string | null
    notes?: string | null
  }>
}

// ---------------------------------------------------------------- comparendos

export interface Fine {
  id: string
  vehicleId: string
  number?: string | null
  date: string
  place?: string | null
  code?: string | null
  description: string
  amount: number
  discountDeadline?: string | null
  discountedAmount?: number | null
  status: FineStatus
  paidDate?: string | null
  receiptUrl?: string | null
  notes?: string | null
  daysToDiscountDeadline?: number | null
}

export interface FinePayload {
  number?: string | null
  date: string
  place?: string | null
  code?: string | null
  description: string
  amount: number
  discountDeadline?: string | null
  discountedAmount?: number | null
  status: FineStatus
  paidDate?: string | null
  receiptUrl?: string | null
  notes?: string | null
}

// ---------------------------------------------------------------- talleres

/**
 * Taller guardado en la libreta del usuario. Entra desde el directorio de aliados, no se crea a
 * mano: el nombre, el teléfono y la dirección los sirve el aliado desde su perfil, y aquí solo
 * viven las anotaciones del usuario.
 */
export interface Workshop {
  id: string
  /** Aliado del que salió. Enlaza con su ficha pública. */
  partnerId?: string | null
  partnerSlug?: string | null
  isVerified: boolean
  /** Autorizaste a este aliado a guardar tus datos y enviarte recordatorios. */
  shareWithPartner: boolean
  name: string
  specialty?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  notes?: string | null
  rating?: number | null
  isFavorite: boolean
  visitCount: number
  totalSpent: number
  lastVisit?: string | null
}

/** Lo único que el usuario puede cambiar: su propia experiencia con el taller. */
export interface WorkshopNotesPayload {
  rating?: number | null
  isFavorite: boolean
  notes?: string | null
}

// ---------------------------------------------------------------- hoja de vida pública

export interface PublicService {
  date: string
  odometer: number
  title: string
  type: MaintenanceType
  workshopName?: string | null
  items: string[]
}

export interface PublicDocument {
  type: DocumentType
  name: string
  expiryDate: string
  isValid: boolean
}

export interface PublicVehicle {
  slug: string
  brand: string
  model: string
  trim?: string | null
  year: number
  type: VehicleType
  color?: string | null
  fuelType: FuelType
  transmission: TransmissionType
  engineDisplacementCc?: number | null
  photoUrl?: string | null
  maskedPlate: string
  currentOdometer: number
  distanceUnit: DistanceUnit
  firstRecordDate?: string | null
  serviceCount: number
  lastServiceDate?: string | null
  lastServiceOdometer?: number | null
  kmPerYear?: number | null
  tireBrand?: string | null
  tireLifeUsedPercent?: number | null
  documents: PublicDocument[]
  history: PublicService[]
}

// ---------------------------------------------------------------- aliados

/**
 * Categoría de aliado. `icon` es la llave del ícono lucide y las listas de tipos que resuelve
 * se quedan en el backend: aquí solo llega lo que la interfaz necesita mostrar.
 */
export interface PartnerCategory {
  id: string
  name: string
  slug: string
  icon: string
  description?: string | null
  sortOrder: number
  partnerCount: number
}

export interface PartnerLocation {
  name?: string | null
  department?: string | null
  city?: string | null
  address?: string | null
  phone?: string | null
}

/** Tarjeta del directorio y de las recomendaciones. */
export interface PartnerCard {
  id: string
  name: string
  publicSlug: string
  description?: string | null
  city?: string | null
  department?: string | null
  phone?: string | null
  whatsappNumber?: string | null
  logoUrl?: string | null
  isVerified: boolean
  acceptsAppointments: boolean
  offersHomeService: boolean
  categories: PartnerCategory[]
  /** Ciudad principal más las de sus sedes. */
  cities: string[]
  /** Marcas en las que se especializa. Vacío significa todas. */
  brands: string[]
}

/** Ficha pública completa del aliado. */
export interface PublicPartner extends PartnerCard {
  address?: string | null
  photoUrl?: string | null
  websiteUrl?: string | null
  instagramUrl?: string | null
  facebookUrl?: string | null
  scheduleNote?: string | null
  appointmentUrl?: string | null
  vehicleTypes: VehicleType[]
  locations: PartnerLocation[]
  memberSinceUtc: string
}

/** Perfil como lo ve el propio aliado en su panel. */
export interface Partner extends PublicPartner {
  legalId?: string | null
  email?: string | null
  isActive: boolean
}

export interface PartnerPayload {
  name: string
  legalId?: string | null
  description?: string | null
  phone?: string | null
  whatsappNumber?: string | null
  email?: string | null
  address?: string | null
  city?: string | null
  department?: string | null
  logoUrl?: string | null
  photoUrl?: string | null
  websiteUrl?: string | null
  instagramUrl?: string | null
  facebookUrl?: string | null
  scheduleNote?: string | null
  acceptsAppointments: boolean
  appointmentUrl?: string | null
  offersHomeService: boolean
  vehicleTypes: VehicleType[]
  brands: string[]
  categoryIds: string[]
  locations: PartnerLocation[]
}

/** Datos mínimos para abrir el perfil. El resto se completa después en el panel. */
export interface PartnerSignupPayload {
  businessName: string
  phone?: string
  department?: string
  city?: string
  address?: string
  categoryIds: string[]
  vehicleTypes: VehicleType[]
}

export interface RegisterPartnerPayload extends PartnerSignupPayload {
  fullName: string
  email: string
  password: string
}

export interface PartnerSearchParams {
  category?: string
  city?: string
  q?: string
  vehicleType?: VehicleType
}

/** Una alerta próxima a vencerse con los aliados que la resuelven. */
export interface PartnerRecommendation {
  alert: VehicleAlert
  categories: PartnerCategory[]
  partners: PartnerCard[]
}

// ---------------------------------------------------------------- CRM del aliado

export type CustomerSource = 'Manual' | 'Import' | 'App'
export type CampaignStatus = 'Draft' | 'Scheduled' | 'Sending' | 'Sent' | 'Cancelled'
export type CampaignChannel = 'Email' | 'InApp' | 'Whatsapp'
export type DeliveryStatus = 'Pending' | 'Sent' | 'Failed' | 'Skipped'
export type NotificationKind = 'PartnerCampaign' | 'System'

export interface CustomerVehicle {
  id: string
  plate: string
  type: VehicleType
  brand?: string | null
  model?: string | null
  year?: number | null
  color?: string | null
  odometer?: number | null
  odometerDate?: string | null
  soatExpiry?: string | null
  technicalInspectionExpiry?: string | null
  lastServiceDate?: string | null
  lastServiceOdometer?: number | null
  nextServiceDate?: string | null
  nextServiceOdometer?: number | null
  notes?: string | null
  /** Días para lo primero que vence. Negativo si ya venció. */
  daysToNextExpiry?: number | null
  nextExpiryLabel?: string | null
}

export interface CustomerListItem {
  id: string
  fullName: string
  email?: string | null
  phone?: string | null
  city?: string | null
  acceptsMarketing: boolean
  isUnsubscribed: boolean
  /** También tiene cuenta en Rueda Al Día: le pueden llegar avisos en la app. */
  isAppUser: boolean
  source: CustomerSource
  lastVisitDate?: string | null
  visitCount: number
  totalSpent: number
  vehicleCount: number
  plates: string[]
  daysToNextExpiry?: number | null
  nextExpiryLabel?: string | null
}

export interface Customer extends CustomerListItem {
  documentId?: string | null
  address?: string | null
  notes?: string | null
  locationId?: string | null
  consentAtUtc?: string | null
  unsubscribedAtUtc?: string | null
  isActive: boolean
  vehicles: CustomerVehicle[]
}

export interface CustomerPayload {
  fullName: string
  email?: string | null
  phone?: string | null
  documentId?: string | null
  city?: string | null
  address?: string | null
  notes?: string | null
  locationId?: string | null
  acceptsMarketing: boolean
  isActive: boolean
  lastVisitDate?: string | null
}

export interface CustomerVehiclePayload {
  plate: string
  type: VehicleType
  brand?: string | null
  model?: string | null
  year?: number | null
  color?: string | null
  odometer?: number | null
  odometerDate?: string | null
  soatExpiry?: string | null
  technicalInspectionExpiry?: string | null
  lastServiceDate?: string | null
  lastServiceOdometer?: number | null
  nextServiceDate?: string | null
  nextServiceOdometer?: number | null
  notes?: string | null
}

export interface Paged<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface CrmSummary {
  customerCount: number
  vehicleCount: number
  subscribedCount: number
  unsubscribedCount: number
  appUserCount: number
  expiringSoonCount: number
  expiredCount: number
  inactiveCount: number
  campaignCount: number
  messagesSent: number
  /** False cuando no hay SMTP configurado: los correos se simulan. */
  emailEnabled: boolean
}

// ---- Importación ----

export interface ImportRow {
  line: number
  fullName?: string | null
  email?: string | null
  phone?: string | null
  city?: string | null
  plate?: string | null
  brand?: string | null
  model?: string | null
  soatExpiry?: string | null
  technicalInspectionExpiry?: string | null
  acceptsMarketing: boolean
  /** "nuevo" | "actualiza" | "error" */
  action: string
  error?: string | null
  existingCustomerId?: string | null
}

export interface ImportPreview {
  totalRows: number
  newCustomers: number
  updatedCustomers: number
  invalid: number
  rows: ImportRow[]
  unknownColumns: string[]
}

export interface ImportResult {
  created: number
  updated: number
  vehiclesAdded: number
  skipped: number
}

// ---- Campañas ----

export interface CampaignSegment {
  expiringWithinDays?: number | null
  includeSoat: boolean
  includeTechnicalInspection: boolean
  includeService: boolean
  inactiveForMonths?: number | null
  vehicleTypes: VehicleType[]
  brands: string[]
  minOdometer?: number | null
  maxOdometer?: number | null
  cities: string[]
  locationId?: string | null
}

export interface CampaignListItem {
  id: string
  name: string
  status: CampaignStatus
  channels: CampaignChannel[]
  subject: string
  scheduledAtUtc?: string | null
  sentAtUtc?: string | null
  recipientCount: number
  sentCount: number
  failedCount: number
  createdAtUtc: string
}

export interface Campaign extends CampaignListItem {
  body: string
  ctaLabel?: string | null
  ctaUrl?: string | null
  segment: CampaignSegment
}

export interface CampaignPayload {
  name: string
  channels: CampaignChannel[]
  subject: string
  body: string
  ctaLabel?: string | null
  ctaUrl?: string | null
  segment: CampaignSegment
  scheduledAtUtc?: string | null
}

export interface SegmentPreviewItem {
  customerId: string
  fullName: string
  email?: string | null
  phone?: string | null
  isAppUser: boolean
  plate?: string | null
  vehicleLabel?: string | null
  daysToNextExpiry?: number | null
  nextExpiryLabel?: string | null
  reachableBy: CampaignChannel[]
}

export interface SegmentPreview {
  total: number
  reachableByEmail: number
  reachableInApp: number
  reachableByWhatsapp: number
  /** Cumplen el segmento pero no hay cómo escribirles por los canales elegidos. */
  unreachable: number
  messageCount: number
  sample: SegmentPreviewItem[]
}

export interface MessagePreview {
  subject: string
  body: string
  basedOn?: string | null
}

export interface CampaignRecipient {
  id: string
  customerId: string
  customerName: string
  channel: CampaignChannel
  address?: string | null
  status: DeliveryStatus
  error?: string | null
  sentAtUtc?: string | null
  /** Enlace de WhatsApp con el mensaje ya escrito. */
  whatsappUrl?: string | null
}

// ---------------------------------------------------------------- avisos

export interface AppNotification {
  id: string
  kind: NotificationKind
  title: string
  body: string
  ctaLabel?: string | null
  ctaUrl?: string | null
  partnerName?: string | null
  partnerLogoUrl?: string | null
  partnerSlug?: string | null
  isRead: boolean
  createdAtUtc: string
}

export interface NotificationList {
  items: AppNotification[]
  unreadCount: number
}

export interface UnsubscribeInfo {
  partnerName: string
  partnerLogoUrl?: string | null
  maskedContact?: string | null
  alreadyUnsubscribed: boolean
}

// ---------------------------------------------------------------- consulta por placa

export type ServiceClass = 'Particular' | 'Public' | 'Official' | 'Diplomatic' | 'Other'
export type LienKind = 'Pledge' | 'Seizure' | 'Other'

/** Lo único que se le pide al usuario para dar de alta un vehículo. */
export interface PlateLookupPayload {
  plate: string
  documentType: string
  documentNumber: string
  lastName?: string
  city?: string
}

export interface LookupDocument {
  type: DocumentType
  number?: string | null
  issuer?: string | null
  issueDate?: string | null
  expiryDate: string
  daysToExpire: number
  isValid: boolean
}

export interface LookupLien {
  kind: LienKind
  holder: string
  registeredOn?: string | null
}

export interface LookupValuation {
  commercialValue: number
  marketMin?: number | null
  marketMax?: number | null
}

export interface LookupLicense {
  category: string
  expiresOn: string
  daysToExpire: number
  status?: string | null
}

export interface PicoYPlaca {
  city?: string | null
  department?: string | null
  vehicleType?: string | null
  hasRestriction: boolean
  appliesToday: boolean
  appliesTomorrow: boolean
  digitsToday: number[]
  digitsTomorrow: number[]
  schedule?: string | null
  /**
   * Cómo se define la restricción: por dígito o por día de la semana. Con "byDay" los dígitos
   * vienen vacíos y mostrar solo eso haría creer que no hay restricción.
   */
  scheme?: string | null
  /** Días de la semana en que le toca, cuando la medida es por día. */
  weekDays: string[]
  /** Qué dígito de la placa manda: "ultimo", "penultimo". */
  plateDigit?: string | null
  validity?: string | null
  sourceUrl?: string | null
  /** Nombre del festivo de hoy, si lo es. En festivo la medida no se aplica. */
  holidayToday?: string | null
  holidayTomorrow?: string | null
}

/**
 * Lo que se encontró de una placa. Trae `lookupId` porque la consulta ya se pagó: al confirmar
 * se reusa esa respuesta en vez de volver a consultar.
 */
export interface PlateLookupDraft {
  lookupId: string
  plate: string
  found: boolean
  brand?: string | null
  model?: string | null
  year?: number | null
  color?: string | null
  type: VehicleType
  fuelType: FuelType
  engineDisplacementCc?: number | null
  vin?: string | null
  engineNumber?: string | null
  chassis?: string | null
  bodyType?: string | null
  registeredService?: ServiceClass | null
  registrationDate?: string | null
  transitAuthority?: string | null
  officialStatus?: string | null
  ownerHistoryCount?: number | null
  suggestedNickname: string
  soat?: LookupDocument | null
  technicalInspection?: LookupDocument | null
  liens: LookupLien[]
  valuation?: LookupValuation | null
  licenses: LookupLicense[]
  picoYPlaca: PicoYPlaca[]
  warnings: string[]
  /** Créditos que consumió la consulta. */
  cost: number
}

/** Lo que la consulta no puede saber y hay que preguntar al confirmar. */
export interface ConfirmLookupPayload {
  lookupId: string
  nickname?: string | null
  currentOdometer: number
  type?: VehicleType
  city?: string | null
  seedServicePlan: boolean
}

// ---------------------------------------------------------------- ficha oficial

export type LookupStatus = 'Ok' | 'Info' | 'Error' | 'Danger' | 'Warning'

/** Ficha del vehículo tal como la tiene el registro. */
export interface OfficialVehicle {
  brand?: string | null
  line?: string | null
  year?: number | null
  color?: string | null
  vin?: string | null
  engineNumber?: string | null
  engineDisplacementCc?: number | null
  fuelType?: FuelType | null
  chassis?: string | null
  bodyType?: string | null
  registeredService?: ServiceClass | null
  registrationDate?: string | null
  transitAuthority?: string | null
  officialStatus?: string | null
  ownerHistoryCount?: number | null
  fasecoldaCode?: string | null
  isInspectionExempt: boolean
  firstInspectionDue?: string | null
  /** Null significa que nunca se ha consultado. */
  syncedAtUtc?: string | null
}

export interface Lien {
  id: string
  kind: LienKind
  holder: string
  holderDocument?: string | null
  holderDocumentType?: string | null
  registeredOn?: string | null
  inConfecamaras: boolean
  isReleased: boolean
  releasedOn?: string | null
  notes?: string | null
}

export interface Valuation {
  id: string
  date: string
  commercialValue: number
  marketMin?: number | null
  marketMax?: number | null
  source: string
  /** Cómo se encontró la ficha: por VIN o por código. Dice qué tan exacto es el avalúo. */
  matchedBy?: string | null
  /** Referencia comercial exacta que se avaluó. Dos versiones del mismo modelo no valen igual. */
  reference?: string | null
  /** Diferencia contra el avalúo anterior. Null en el primero. */
  changeFromPrevious?: number | null
}

export type DriverCertificateKind = 'Medical' | 'Aptitude'

export interface DriverLicense {
  id: string
  category: string
  number?: string | null
  issuedBy?: string | null
  authorityTransit?: string | null
  resolutionNumber?: string | null
  issuedOn?: string | null
  /** Null cuando el registro no mandó un vencimiento legible. */
  expiresOn?: string | null
  daysToExpire?: number | null
  /** Vencimiento del examen médico de esta categoría, que suele llegar antes. */
  examExpiresOn?: string | null
  status?: string | null
  restrictions?: string | null
  /** Suspendida: no se puede conducir aunque la licencia no esté vencida. */
  suspendedFrom?: string | null
  suspendedUntil?: string | null
  syncedAtUtc?: string | null
}

/** Certificado que respalda la licencia: el médico o el de la escuela de conducción. */
export interface DriverCertificate {
  id: string
  kind: DriverCertificateKind
  number: string
  category?: string | null
  issuer?: string | null
  procedure?: string | null
  status?: string | null
  issuedOn?: string | null
  expiresOn?: string | null
  daysToExpire?: number | null
  restrictions?: string | null
  limitations?: string | null
}

/** Un trámite hecho ante un organismo de tránsito. */
export interface DriverProcedure {
  number?: string | null
  date?: string | null
  name?: string | null
  entity?: string | null
  requestStatus?: string | null
  procedureStatus?: string | null
  registry?: string | null
}

/** La persona ante el registro de tránsito. */
export interface DriverProfile {
  documentType: string
  documentNumber: string
  /** Enmascarado por la fuente. */
  holderName?: string | null
  driverStatus?: string | null
  citizenStatus?: string | null
  inscriptionNumber?: string | null
  inscriptionDate?: string | null
  /** Bloqueado por validación de identidad: no puede hacer trámites. */
  identityStatus?: string | null
  identityUnblockDate?: string | null
  hasInfractions: boolean
  clearanceNumber?: string | null
  consultedAtUtc?: string | null
  syncedAtUtc?: string | null
  /** Categorías dadas de baja que no vienen en la lista. */
  retiredCount: number
  licenses: DriverLicense[]
  certificates: DriverCertificate[]
  /** Historial de trámites. No se persiste: se lee de la consulta guardada. */
  procedures: DriverProcedure[]
}

export interface LookupBlock {
  key: string
  source?: string | null
  status: LookupStatus
  /** Trajo datos. No es lo mismo que el estado: el avalúo llega como "info" con datos. */
  hasData: boolean
  fetchedAtUtc?: string | null
  message?: string | null
  portalUrl?: string | null
}

export interface LookupSummary {
  id: string
  generatedAtUtc: string
  mode?: string | null
  sandbox: boolean
  cost: number
  blocks: LookupBlock[]
}

/** De dónde salió el estado de un documento. */
export type LegalSource = 'None' | 'Registry' | 'App'

/** Estado de un documento obligatorio. */
export interface LegalDocument {
  /** Null cuando la fuente no pudo responder: no es lo mismo que no tenerlo. */
  isValid?: boolean | null
  expiresOn?: string | null
  daysToExpire?: number | null
  issuer?: string | null
  number?: string | null
  /** Exento: los vehículos nuevos no necesitan tecnomecánica hasta su primera revisión. */
  isExempt: boolean
  /** Qué dijo la fuente cuando no hay documento. */
  message?: string | null
  /** De dónde salió esta respuesta. */
  source: LegalSource
  /** La app tiene guardado un documento sin vencer que el registro no reconoce. */
  notInRegistry: boolean
}

/** Si el vehículo puede circular y venderse, en cuatro respuestas. */
export interface LegalStatus {
  soat: LegalDocument
  inspection: LegalDocument
  /** Gravámenes vigentes. Con uno solo el vehículo no se puede traspasar. */
  activeLiens: number
  pendingFines: number
  fineDebt: number
  /** Null cuando el SIMIT no respondió: cero deuda y "no se sabe" no son lo mismo. */
  finesChecked?: boolean | null
  taxPortalUrl?: string | null
  taxMessage?: string | null
}

/** Todo lo que las fuentes oficiales saben del vehículo. */
export interface OfficialRecord {
  vehicle: OfficialVehicle
  /** El veredicto: si puede circular y si se puede vender. */
  legal: LegalStatus
  liens: Lien[]
  /** Del más reciente al más viejo. */
  valuations: Valuation[]
  lastLookup?: LookupSummary | null
  picoYPlaca: PicoYPlaca[]
  /** Ciudad con la que el proveedor resolvió el pico y placa. */
  picoYPlacaCity?: string | null
  lookupCount: number
  creditsSpent: number
}
