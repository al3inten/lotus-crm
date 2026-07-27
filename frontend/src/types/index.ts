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
  "CTB",
  "CRM",
  "REFERRAL",
  "CUSTOMER_REFERRAL",
  "EMPLOYEE_REFERRAL",
  "INCOMING_CALL",
  "DEALER_ACTIVITY",
  "SC_OWN_SOURCE",
  "HMIL_EVENT",
  "EXCHANGE_CAMP",
] as const;
export type LeadSubsource = (typeof LEAD_SUBSOURCES)[number];

// The client-facing "Source" picklist (Excel taxonomy) — distinct from LeadSource, which
// drives webhook/automation logic (auto-assign, auto-dial). This is a manual classification
// field only, used to filter the Subsource picklist below.
export const SOURCE_CATEGORIES = ["WALK_IN", "DIGITAL", "DIGITAL_WALK_IN", "REFERRAL", "FIELD_ACTIVITY", "TELE_IN"] as const;
export type SourceCategory = (typeof SOURCE_CATEGORIES)[number];

// Maps each Source Category to its allowed Subsource options, per the client's color-coded
// Excel picklist spec.
export const SOURCE_CATEGORY_SUBSOURCES: Record<SourceCategory, LeadSubsource[]> = {
  WALK_IN: ["WALK_IN"],
  DIGITAL: ["HMIL_WEBSITE", "HMIL_SOCIAL_MEDIA", "HMIL_CHATBOT", "SOCIAL_MEDIA", "HYPERLOCAL", "CARPORTAL", "CTB", "CRM"],
  DIGITAL_WALK_IN: ["HMIL_WEBSITE", "HMIL_SOCIAL_MEDIA", "HMIL_CHATBOT", "SOCIAL_MEDIA", "HYPERLOCAL", "CARPORTAL", "CTB", "CRM"],
  REFERRAL: ["CUSTOMER_REFERRAL", "EMPLOYEE_REFERRAL"],
  FIELD_ACTIVITY: ["DEALER_ACTIVITY", "SC_OWN_SOURCE", "HMIL_EVENT", "EXCHANGE_CAMP"],
  TELE_IN: ["INCOMING_CALL"],
};

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
  "UNDER_FOLLOW_UP",
  "APPOINTMENT_FIXED",
  "TEST_DRIVE",
  "BOOKED",
  "RETAIL_DONE",
  "RTO_DONE",
  "DELIVERED",
  "CLOSED",
] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

/** Human labels for each status (badges, dropdowns). */
export const STATUS_LABELS: Record<EnquiryStatus, string> = {
  NEW: "New Lead",
  UNDER_FOLLOW_UP: "Under Follow-up",
  APPOINTMENT_FIXED: "Appointment Fixed",
  TEST_DRIVE: "Test Drive",
  BOOKED: "Booking",
  RETAIL_DONE: "Retail",
  RTO_DONE: "RTO",
  DELIVERED: "Delivered",
  CLOSED: "Closed (Lost)",
};

export const LOSS_REASONS = [
  "LOST_TO_DEALER",
  "BOOKING_CANCEL",
  "RETAIL_CANCEL",
  "OUT_OF_TERRITORY",
  "NOT_CONTACTABLE",
  "PRICE_ISSUE",
  "PURCHASED_ANOTHER_BRAND",
  "OTHER_REASON",
] as const;
export type LossReason = (typeof LOSS_REASONS)[number];

export const FINANCE_STATUSES = ["NOT_STARTED", "DOCS_PENDING", "SUBMITTED", "APPROVED", "REJECTED"] as const;
export type FinanceStatus = (typeof FINANCE_STATUSES)[number];

// Mirrors backend ALLOWED_TRANSITIONS in backend/src/config/constants.ts —
// client-side only for UX (disabling invalid options); server re-validates.
// Strict forward-only pipeline (mirrors backend ALLOWED_TRANSITIONS). Each stage advances
// only to the next; UNDER_FOLLOW_UP is an early sub-state, CLOSED an off-ramp until delivery.
export const ALLOWED_TRANSITIONS: Record<EnquiryStatus, EnquiryStatus[]> = {
  NEW: ["APPOINTMENT_FIXED", "CLOSED"],
  UNDER_FOLLOW_UP: ["APPOINTMENT_FIXED", "CLOSED"],
  APPOINTMENT_FIXED: ["TEST_DRIVE", "CLOSED"],
  TEST_DRIVE: ["BOOKED", "CLOSED"],
  BOOKED: ["RETAIL_DONE", "CLOSED"],
  RETAIL_DONE: ["RTO_DONE", "CLOSED"],
  RTO_DONE: ["DELIVERED", "CLOSED"],
  DELIVERED: [],
  CLOSED: [],
};

// Sidebar/dashboard modules a custom role can toggle. Mirrors backend MODULE_KEYS.
export const MODULES = [
  { key: "dashboard", label: "Dashboard" },
  { key: "leads", label: "Leads" },
  { key: "follow-ups", label: "Follow-ups" },
  { key: "social-inbox", label: "Social Inbox" },
  // Key stays "departments" — it's persisted in RoleDefinition.permissions, so renaming
  // it would orphan every existing role's saved permissions. Only the label changed.
  { key: "departments", label: "Branches" },
  { key: "reports", label: "Reports" },
  { key: "ai-agents", label: "AI Agents" },
  { key: "media-library", label: "Media Library" },
  { key: "templates", label: "Templates" },
  { key: "call-campaigns", label: "Call Campaigns" },
  { key: "bulk-messages", label: "Bulk Messages" },
  { key: "integrations", label: "Integrations" },
  { key: "vehicles", label: "Vehicles" },
  { key: "settings", label: "Settings" },
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

/**
 * An org unit inside a branch (Sales, Service, HR...) that employees belong to.
 * Distinct from the `Department` enum used to categorise enquiries.
 */
export interface StaffDepartment {
  id: string;
  name: string;
  branchId: string;
  branch?: { id: string; name: string } | null;
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
  staffDepartmentId?: string | null;
  staffDepartment?: { id: string; name: string } | null;
  isActive: boolean;
  isAvailableForRouting: boolean;
  avatarUrl?: string | null;
  lastActiveAt?: string | null;
  onBreak?: boolean;
  breakStartedAt?: string | null;
}

/** A floor-staff member's live working state, for the dashboard activity monitor. */
export interface TeamActivityMember {
  id: string;
  name: string;
  role: Role;
  avatarUrl?: string | null;
  lastActiveAt?: string | null;
  onBreak: boolean;
  breakStartedAt?: string | null;
  isAvailableForRouting: boolean;
  branch?: { id: string; name: string } | null;
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
  area?: string | null;
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

export const DATE_FIELD_KEYS = [
  "APPOINTMENT_AT",
  "TEST_DRIVE_SCHEDULED_AT",
  "BOOKED_AT",
  "RETAIL_DONE_AT",
] as const;
export type DateFieldKey = (typeof DATE_FIELD_KEYS)[number];

export interface DateChangeHistoryEntry {
  id: string;
  field: DateFieldKey;
  oldValue?: string | null;
  newValue: string;
  reason: string;
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
  sourceCategory?: SourceCategory | null;
  subsource?: LeadSubsource | null;
  referrerName?: string | null;
  variant?: string | null;
  enquiryCategory?: EnquiryCategory | null;
  financeRequired?: boolean | null;
  financeRemarks?: string | null;
  // Booking-phase finance checks (only meaningful when financeRequired is true).
  financeDocumentCollected?: boolean | null;
  financeLoanApproved?: boolean | null;
  financeDoReceived?: boolean | null;
  // Pipeline milestone dates.
  bookedAt?: string | null;
  retailDoneAt?: string | null;
  rtoDoneAt?: string | null;
  deliveredAt?: string | null;
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
  followUps?: FollowUp[];
  dateChangeHistory?: DateChangeHistoryEntry[];
}

export const FOLLOW_UP_TYPES = ["CALL", "WHATSAPP", "VISIT", "EMAIL"] as const;
export type FollowUpType = (typeof FOLLOW_UP_TYPES)[number];

export interface FollowUp {
  id: string;
  enquiryId: string;
  followUpDate: string;
  followUpTime?: string | null;
  type: FollowUpType;
  remark: string;
  nextFollowUpDate?: string | null;
  nextFollowUpTime?: string | null;
  createdById: string;
  createdBy?: { id: string; name: string };
  createdAt: string;
}

export interface Comment {
  id: string;
  enquiryId: string;
  userId: string;
  user: Pick<User, "id" | "name" | "role">;
  body: string;
  createdAt: string;
  updatedAt: string;
}

// Private per-author scratchpad note — unlike Comment, only ever visible to the person
// who wrote it, so there's no `user` list to render other than "me".
export interface EnquiryNote {
  id: string;
  enquiryId: string;
  authorId: string;
  author: { id: string; name: string };
  body: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface Reminder {
  id: string;
  type: "FOLLOW_UP" | "BIRTHDAY" | "ANNIVERSARY";
  title: string;
  body: string;
  linkUrl: string;
}

export interface TestDriveFeedback {
  id: string;
  conductedById: string;
  conductedBy?: { id: string; name: string };
  carModel?: string | null;
  variant?: string | null;
  scheduledAt?: string | null;
  completedAt?: string | null;
  address?: string | null;
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
  createdAt: string;
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

export const CUSTOMER_TIERS = ["DIAMOND", "GOLD", "PROSPECT"] as const;
export type CustomerTier = (typeof CUSTOMER_TIERS)[number];

export interface CustomerStats {
  total: number;
  diamond: number;
  gold: number;
  prospect: number;
}

/** A person (Lead, unique by phone) with an auto-computed loyalty tier. */
export interface Customer {
  id: string;
  name: string;
  phoneRaw: string;
  email?: string | null;
  profession?: string | null;
  createdAt: string;
  tier: CustomerTier;
  enquiryCount: number;
  touchCount: number;
  purchaseCount: number;
  ownedVehicles: string[];
  latestEnquiryId?: string | null;
  latestStatus?: EnquiryStatus | null;
  latestCarModel?: string | null;
  lastActivityAt: string;
  branches: string[];
}

export interface PaginatedCustomers {
  items: Customer[];
  total: number;
  page: number;
  pageSize: number;
  stats: CustomerStats;
}
