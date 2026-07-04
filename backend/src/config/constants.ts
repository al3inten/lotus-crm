import { EnquiryStatus, LeadSource } from "@prisma/client";

export const ALLOWED_TRANSITIONS: Record<EnquiryStatus, EnquiryStatus[]> = {
  NEW: ["CONTACTED", "FOLLOW_UP", "LOST"],
  CONTACTED: ["APPOINTMENT_SCHEDULED", "FOLLOW_UP", "LOST"],
  FOLLOW_UP: ["CONTACTED", "APPOINTMENT_SCHEDULED", "LOST"],
  APPOINTMENT_SCHEDULED: ["TEST_DRIVE_DONE", "APPOINTMENT_NO_SHOW", "LOST"],
  APPOINTMENT_NO_SHOW: ["APPOINTMENT_SCHEDULED", "FOLLOW_UP", "LOST"],
  // Clients often want a second test drive (another variant, spouse's opinion) — the CR
  // can loop back to APPOINTMENT_SCHEDULED from anywhere between test drive and negotiation.
  TEST_DRIVE_DONE: ["FEEDBACK_COLLECTED", "APPOINTMENT_SCHEDULED", "FOLLOW_UP", "LOST"],
  FEEDBACK_COLLECTED: ["QUOTATION_SHARED", "APPOINTMENT_SCHEDULED", "FOLLOW_UP", "LOST"],
  QUOTATION_SHARED: ["NEGOTIATION", "APPOINTMENT_SCHEDULED", "FOLLOW_UP", "LOST"],
  NEGOTIATION: ["BOOKING_CONFIRMED", "APPOINTMENT_SCHEDULED", "FOLLOW_UP", "LOST"],
  // Finance and exchange can happen in either order (or both) before the sale closes.
  BOOKING_CONFIRMED: ["FINANCE_IN_PROGRESS", "EXCHANGE_IN_PROGRESS", "SALE_CLOSED", "LOST"],
  FINANCE_IN_PROGRESS: ["EXCHANGE_IN_PROGRESS", "SALE_CLOSED", "LOST"],
  EXCHANGE_IN_PROGRESS: ["FINANCE_IN_PROGRESS", "SALE_CLOSED", "LOST"],
  SALE_CLOSED: ["DELIVERY_IN_PROGRESS"],
  DELIVERY_IN_PROGRESS: ["DELIVERED"],
  DELIVERED: [],
  LOST: [],
};

// Statuses that require a lossReason to be supplied.
export const TERMINAL_LOSS_STATUS: EnquiryStatus = "LOST";

// Sources captured digitally (Phase 2 will wire real ingestion for these).
// These respect the branch's autoAssignEnabled toggle for round-robin routing.
export const DIGITAL_SOURCES: LeadSource[] = ["META_ADS", "WHATSAPP", "INSTAGRAM", "GOOGLE_SHEETS"];

// Sources that are always manually assigned (a human is already present/handling intake).
export const MANUAL_SOURCES: LeadSource[] = ["WALK_IN", "MANUAL_OTHER", "REFERRAL"];

export const CONSULTANT_REQUIRED_AT_STATUS: EnquiryStatus = "APPOINTMENT_SCHEDULED";

// Module keys a RoleDefinition can toggle on/off — these are the sidebar/dashboard
// sections of the frontend. Keep in sync with frontend/src/types (MODULES).
export const MODULE_KEYS = [
  "dashboard",
  "leads",
  "social-inbox",
  "departments",
  "reports",
  "ai-agents",
  "media-library",
  "templates",
  "call-campaigns",
  "bulk-messages",
  "integrations",
] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];

// Prisma's interactive-transaction default (5s maxWait / 5s timeout) is too tight once the
// DB is a network hop away (e.g. app and Postgres in different regions). These transactions
// run several sequential queries, so give them headroom rather than racing the default.
export const TRANSACTION_OPTIONS = { maxWait: 10_000, timeout: 20_000 };
