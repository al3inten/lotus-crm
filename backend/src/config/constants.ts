import { EnquiryStatus, LeadSource } from "@prisma/client";

// Strict, forward-only pipeline — each stage advances to exactly the next one, so the
// process can't be skipped or jumped around:
//   NEW → APPOINTMENT_FIXED → TEST_DRIVE → BOOKED → RETAIL_DONE → RTO_DONE → DELIVERED
// UNDER_FOLLOW_UP is an optional early sub-state between NEW and the appointment, and
// CLOSED (Lost) is an off-ramp available at every stage until the car is delivered.
export const ALLOWED_TRANSITIONS: Record<EnquiryStatus, EnquiryStatus[]> = {
  NEW: ["UNDER_FOLLOW_UP", "APPOINTMENT_FIXED", "CLOSED"],
  UNDER_FOLLOW_UP: ["APPOINTMENT_FIXED", "CLOSED"],
  APPOINTMENT_FIXED: ["TEST_DRIVE", "CLOSED"],
  TEST_DRIVE: ["BOOKED", "CLOSED"],
  BOOKED: ["RETAIL_DONE", "CLOSED"],
  RETAIL_DONE: ["RTO_DONE", "CLOSED"],
  RTO_DONE: ["DELIVERED", "CLOSED"],
  DELIVERED: [],
  CLOSED: [],
};

// Statuses that require a lossReason to be supplied.
export const TERMINAL_LOSS_STATUS: EnquiryStatus = "CLOSED";

// Sources captured digitally (Phase 2 will wire real ingestion for these).
// These respect the branch's autoAssignEnabled toggle for round-robin routing.
export const DIGITAL_SOURCES: LeadSource[] = ["META_ADS", "WHATSAPP", "INSTAGRAM", "GOOGLE_SHEETS"];

// Sources that are always manually assigned (a human is already present/handling intake).
export const MANUAL_SOURCES: LeadSource[] = ["WALK_IN", "MANUAL_OTHER", "REFERRAL"];

export const CONSULTANT_REQUIRED_AT_STATUS: EnquiryStatus = "APPOINTMENT_FIXED";

// Module keys a RoleDefinition can toggle on/off — these are the sidebar/dashboard
// sections of the frontend. Keep in sync with frontend/src/types (MODULES).
export const MODULE_KEYS = [
  "dashboard",
  "leads",
  "follow-ups",
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
