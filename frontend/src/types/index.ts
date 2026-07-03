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

export const ENQUIRY_TYPES = ["NEW_CAR", "USED_CAR", "SERVICE_RELATED", "ACCESSORY", "OTHER"] as const;
export type EnquiryType = (typeof ENQUIRY_TYPES)[number];

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
  TEST_DRIVE_DONE: ["FEEDBACK_COLLECTED", "LOST"],
  FEEDBACK_COLLECTED: ["QUOTATION_SHARED", "LOST"],
  QUOTATION_SHARED: ["NEGOTIATION", "LOST"],
  NEGOTIATION: ["BOOKING_CONFIRMED", "LOST"],
  BOOKING_CONFIRMED: ["FINANCE_IN_PROGRESS", "EXCHANGE_IN_PROGRESS", "SALE_CLOSED", "LOST"],
  FINANCE_IN_PROGRESS: ["EXCHANGE_IN_PROGRESS", "SALE_CLOSED", "LOST"],
  EXCHANGE_IN_PROGRESS: ["SALE_CLOSED", "LOST"],
  SALE_CLOSED: ["DELIVERY_IN_PROGRESS"],
  DELIVERY_IN_PROGRESS: ["DELIVERED"],
  DELIVERED: [],
  LOST: [],
};

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
  branchId: string | null;
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
  isActive: boolean;
}

export interface Lead {
  id: string;
  name: string;
  phoneRaw: string;
  phoneNormalized: string;
  email?: string | null;
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
  assignedCrId?: string | null;
  assignedCr?: { id: string; name: string } | null;
  consultantId?: string | null;
  consultant?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
  statusHistory?: EnquiryStatusHistoryEntry[];
  testDriveFeedback?: TestDriveFeedback | null;
  quotation?: Quotation | null;
  exchangeEvaluation?: ExchangeEvaluation | null;
  financeApplication?: FinanceApplication | null;
  deliveryDetails?: DeliveryDetails | null;
}

export interface TestDriveFeedback {
  id: string;
  conductedById: string;
  scheduledAt?: string | null;
  completedAt?: string | null;
  rating?: number | null;
  comments?: string | null;
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
}

export interface PaginatedEnquiries {
  items: Enquiry[];
  total: number;
  page: number;
  pageSize: number;
}
