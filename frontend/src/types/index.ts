export const ROLES = ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER", "CR_TEAM", "CONSULTANT"] as const;
export type Role = (typeof ROLES)[number];

export const LEAD_SOURCES = [
  "WALK_IN",
  "MANUAL_OTHER",
  "META_ADS",
  "WHATSAPP",
  "INSTAGRAM",
  "GOOGLE_SHEETS",
  "REFERRAL",
  "VOICE_AGENT",
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

// Sources captured digitally, arriving with only the lightweight intake fields — a CR
// completes the rest later via "Complete Customer Details" on the Lead Detail page.
// Mirrors backend DIGITAL_SOURCES in backend/src/config/constants.ts.
export const DIGITAL_SOURCES: LeadSource[] = ["META_ADS", "WHATSAPP", "INSTAGRAM", "GOOGLE_SHEETS"];

export const ENQUIRY_TYPES = ["NEW_CAR", "USED_CAR", "SERVICE_RELATED", "ACCESSORY", "OTHER"] as const;
export type EnquiryType = (typeof ENQUIRY_TYPES)[number];

// Business department the enquiry belongs to — distinct from EnquiryType (see backend
// schema.prisma comment on the Department enum).
export const DEPARTMENTS = ["SALES", "SERVICE", "USED_CAR", "ACCESSORIES", "HR", "OTHER_TERRITORY", "OTHERS"] as const;
export type Department = (typeof DEPARTMENTS)[number];

export const LEAD_SUBSOURCES = [
  "WALK_IN",
  "HMIL_WEBSITE",
  "HMIL_SOCIAL_MEDIA",
  "HMIL_CHATBOT",
  "SOCIAL_MEDIA",
  "HYPERLOCAL",
  "CARPORTAL",
  "CRM",
  "REFERRAL",
  "INCOMING_CALL",
  "DEALER_ACTIVITY",
  "SC_OWN_SOURCE",
  "HMIL_EVENT",
] as const;
export type LeadSubsource = (typeof LEAD_SUBSOURCES)[number];

export const ENQUIRY_CATEGORIES = ["HOT", "WARM", "COLD"] as const;
export type EnquiryCategory = (typeof ENQUIRY_CATEGORIES)[number];

export const TRANSMISSION_TYPES = ["MANUAL", "AUTOMATIC"] as const;
export type TransmissionType = (typeof TRANSMISSION_TYPES)[number];

export const FUEL_TYPES = ["PETROL", "DIESEL", "CNG_PETROL", "ELECTRIC"] as const;
export type FuelType = (typeof FUEL_TYPES)[number];

export interface VehicleVariant {
  id: string;
  modelId: string;
  name: string;
  transmissionType: TransmissionType;
  fuelType: FuelType;
  isActive: boolean;
}

export interface VehicleModel {
  id: string;
  name: string;
  isActive: boolean;
  variants: VehicleVariant[];
}

export const ENQUIRY_STATUSES = [
  "NEW",
  "CONTACTED",
  "FOLLOW_UP",
  "APPOINTMENT_SCHEDULED",
  "APPOINTMENT_NO_SHOW",
  "TEST_DRIVE_DONE",
  "FEEDBACK_COLLECTED",
  "QUOTATION_SHARED",
  "NEGOTIATION",
  "BOOKING_CONFIRMED",
  "FINANCE_IN_PROGRESS",
  "EXCHANGE_IN_PROGRESS",
  "SALE_CLOSED",
  "DELIVERY_IN_PROGRESS",
  "DELIVERED",
  "LOST",
] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export const LOSS_REASONS = [
  "PRICE_TOO_HIGH",
  "BOUGHT_COMPETITOR",
  "BOUGHT_ANOTHER_BRANCH",
  "NOT_INTERESTED_ANYMORE",
  "FINANCE_REJECTED",
  "NO_RESPONSE",
  "OTHER",
] as const;
export type LossReason = (typeof LOSS_REASONS)[number];

export const FINANCE_STATUSES = ["NOT_STARTED", "DOCS_PENDING", "SUBMITTED", "APPROVED", "REJECTED"] as const;
export type FinanceStatus = (typeof FINANCE_STATUSES)[number];

// Mirrors backend ALLOWED_TRANSITIONS in backend/src/config/constants.ts —
// client-side only for UX (disabling invalid options); server re-validates.
export const ALLOWED_TRANSITIONS: Record<EnquiryStatus, EnquiryStatus[]> = {
  NEW: ["CONTACTED", "FOLLOW_UP", "LOST"],
  CONTACTED: ["APPOINTMENT_SCHEDULED", "FOLLOW_UP", "LOST"],
  FOLLOW_UP: ["CONTACTED", "APPOINTMENT_SCHEDULED", "LOST"],
  APPOINTMENT_SCHEDULED: ["TEST_DRIVE_DONE", "APPOINTMENT_NO_SHOW", "LOST"],
  APPOINTMENT_NO_SHOW: ["APPOINTMENT_SCHEDULED", "FOLLOW_UP", "LOST"],
  TEST_DRIVE_DONE: ["FEEDBACK_COLLECTED", "APPOINTMENT_SCHEDULED", "FOLLOW_UP", "LOST"],
  FEEDBACK_COLLECTED: ["QUOTATION_SHARED", "APPOINTMENT_SCHEDULED", "FOLLOW_UP", "LOST"],
  QUOTATION_SHARED: ["NEGOTIATION", "APPOINTMENT_SCHEDULED", "FOLLOW_UP", "LOST"],
  NEGOTIATION: ["BOOKING_CONFIRMED", "APPOINTMENT_SCHEDULED", "FOLLOW_UP", "LOST"],
  BOOKING_CONFIRMED: ["FINANCE_IN_PROGRESS", "EXCHANGE_IN_PROGRESS", "SALE_CLOSED", "LOST"],
  FINANCE_IN_PROGRESS: ["EXCHANGE_IN_PROGRESS", "SALE_CLOSED", "LOST"],
  EXCHANGE_IN_PROGRESS: ["FINANCE_IN_PROGRESS", "SALE_CLOSED", "LOST"],
  SALE_CLOSED: ["DELIVERY_IN_PROGRESS"],
  DELIVERY_IN_PROGRESS: ["DELIVERED"],
  DELIVERED: [],
  LOST: [],
};

// Sidebar/dashboard modules a custom role can toggle. Mirrors backend MODULE_KEYS.
export const MODULES = [
  { key: "dashboard", label: "Dashboard" },
  { key: "leads", label: "Leads" },
  { key: "social-inbox", label: "Social Inbox" },
  { key: "departments", label: "Departments" },
  { key: "reports", label: "Reports" },
  { key: "ai-agents", label: "AI Agents" },
  { key: "media-library", label: "Media Library" },
  { key: "templates", label: "Templates" },
  { key: "call-campaigns", label: "Call Campaigns" },
  { key: "bulk-messages", label: "Bulk Messages" },
  { key: "integrations", label: "Integrations" },
  { key: "vehicles", label: "Vehicles" },
] as const;
export type ModuleKey = (typeof MODULES)[number]["key"];

export interface RoleDefinition {
  id: string;
  name: string;
  branchId?: string | null;
  branch?: { id: string; name: string } | null;
  baseRole: Role;
  permissions: ModuleKey[];
  isActive: boolean;
  _count?: { users: number };
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
  roleName?: string | null;
  /** Module keys this user may see; null = no custom role, fall back to base-role defaults. */
  permissions?: ModuleKey[] | null;
  roleDefinition?: { id: string; name: string } | null;
  branchId: string | null;
  branch?: { id: string; name: string } | null;
  isActive: boolean;
  isAvailableForRouting: boolean;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  city: string;
  address?: string | null;
  autoAssignEnabled: boolean;
  autoCallEnabled: boolean;
  isActive: boolean;
}

export interface Lead {
  id: string;
  name: string;
  phoneRaw: string;
  phoneNormalized: string;
  email?: string | null;
  alternateMobile?: string | null;
  dob?: string | null;
  profession?: string | null;
  pincode?: string | null;
  address?: string | null;
  createdAt: string;
  _count?: { enquiries: number; touches: number };
}

export interface LeadDraft {
  id: string;
  branchId?: string | null;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface LeadTouch {
  id: string;
  enquiryId?: string | null;
  source: LeadSource;
  note?: string | null;
  createdAt: string;
}

export interface EnquiryStatusHistoryEntry {
  id: string;
  fromStatus: EnquiryStatus | null;
  toStatus: EnquiryStatus;
  note?: string | null;
  createdAt: string;
  changedBy?: { id: string; name: string };
}

export interface Enquiry {
  id: string;
  leadId: string;
  lead: Lead;
  branchId: string;
  branch: Branch;
  carModel: string;
  source: LeadSource;
  enquiryType: EnquiryType;
  location?: string | null;
  status: EnquiryStatus;
  followUpDueAt?: string | null;
  lossReason?: LossReason | null;
  lossNote?: string | null;
  department?: Department | null;
  subsource?: LeadSubsource | null;
  variant?: string | null;
  enquiryCategory?: EnquiryCategory | null;
  financeRequired?: boolean | null;
  financeRemarks?: string | null;
  appointmentScheduled: boolean;
  appointmentAt?: string | null;
  testDriveInterested: boolean;
  testDriveCount?: number | null;
  exchangeCarModel?: string | null;
  exchangeCarYear?: number | null;
  exchangeCarKms?: number | null;
  exchangeCarOwners?: number | null;
  calledDate?: string | null;
  remarks?: string | null;
  assignedCrId?: string | null;
  assignedCr?: { id: string; name: string } | null;
  consultantId?: string | null;
  consultant?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
  statusHistory?: EnquiryStatusHistoryEntry[];
  testDriveFeedbacks?: TestDriveFeedback[];
  quotation?: Quotation | null;
  exchangeEvaluation?: ExchangeEvaluation | null;
  financeApplication?: FinanceApplication | null;
  deliveryDetails?: DeliveryDetails | null;
}

export interface TestDriveFeedback {
  id: string;
  conductedById: string;
  conductedBy?: { id: string; name: string };
  scheduledAt?: string | null;
  completedAt?: string | null;
  rating?: number | null;
  comments?: string | null;
  createdAt?: string;
}

export interface Quotation {
  id: string;
  quotedById: string;
  variant?: string | null;
  onRoadPrice: string;
  discount?: string | null;
  finalPrice: string;
  validUntil?: string | null;
  pdfUrl?: string | null;
}

export interface ExchangeEvaluation {
  id: string;
  oldCarMake: string;
  oldCarModel: string;
  oldCarYear: number;
  oldCarKms: number;
  oldCarCondition?: string | null;
  valuationAmount: string;
  evaluatedById: string;
}

export interface FinanceApplication {
  id: string;
  bankOrNbfc: string;
  loanAmount?: string | null;
  status: FinanceStatus;
  docsChecklist?: Record<string, boolean> | null;
  rejectionReason?: string | null;
}

export interface DeliveryDetails {
  id: string;
  rcTransferDone: boolean;
  insuranceDone: boolean;
  accessoriesFitted: boolean;
  deliveryDate?: string | null;
  deliveredAt?: string | null;
  notes?: string | null;
}

export interface LeadWithHistory extends Lead {
  enquiries: Enquiry[];
  touches: LeadTouch[];
  touchesBySource: Record<string, number>;
  messagesByChannel: Record<string, number>;
}

export interface PaginatedEnquiries {
  items: Enquiry[];
  total: number;
  page: number;
  pageSize: number;
}
