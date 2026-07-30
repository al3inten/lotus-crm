import { EnquiryStatus, LeadSource } from "@prisma/client";

// Strict, forward-only pipeline — each stage advances to exactly the next one, so the
// process can't be skipped or jumped around:
//   NEW → APPOINTMENT_FIXED → TEST_DRIVE → BOOKED → RETAIL_DONE → RTO_DONE → DELIVERED
// UNDER_FOLLOW_UP is no longer directly reachable from NEW (New Lead moves straight to
// Appointment Fixed); it's kept here only so enquiries already in that status can still
// progress. Every open stage also has three off-ramps, available until the car is delivered:
//   - DELIVERED ("Win" — closed early as a sale)
//   - CLOSED_TEMP ("Closed Temporarily" — parked, not a real loss, see CloseReason)
//   - LOST (permanent loss, see LossReason)
// CLOSED is retired (kept in the enum only for historical rows) — see LOST/CLOSED_TEMP.
export const ALLOWED_TRANSITIONS: Record<EnquiryStatus, EnquiryStatus[]> = {
  NEW: ["APPOINTMENT_FIXED", "DELIVERED", "CLOSED_TEMP", "LOST"],
  UNDER_FOLLOW_UP: ["APPOINTMENT_FIXED", "DELIVERED", "CLOSED_TEMP", "LOST"],
  APPOINTMENT_FIXED: ["TEST_DRIVE", "DELIVERED", "CLOSED_TEMP", "LOST"],
  TEST_DRIVE: ["BOOKED", "DELIVERED", "CLOSED_TEMP", "LOST"],
  BOOKED: ["RETAIL_DONE", "DELIVERED", "CLOSED_TEMP", "LOST"],
  RETAIL_DONE: ["RTO_DONE", "DELIVERED", "CLOSED_TEMP", "LOST"],
  RTO_DONE: ["DELIVERED", "CLOSED_TEMP", "LOST"],
  DELIVERED: [],
  CLOSED: [],
  CLOSED_TEMP: [],
  LOST: [],
};

// Statuses that require a lossReason to be supplied.
export const TERMINAL_LOSS_STATUS: EnquiryStatus = "LOST";

// Statuses with no further pipeline moves (derived from ALLOWED_TRANSITIONS) — once an
// enquiry reaches one of these, it's done and should drop out of follow-up/reminder queues.
export const TERMINAL_STATUSES: EnquiryStatus[] = (Object.keys(ALLOWED_TRANSITIONS) as EnquiryStatus[]).filter(
  (status) => ALLOWED_TRANSITIONS[status].length === 0
);

// Sources captured digitally (Phase 2 will wire real ingestion for these).
// These respect the branch's autoAssignEnabled toggle for round-robin routing.
export const DIGITAL_SOURCES: LeadSource[] = ["META_ADS", "WHATSAPP", "INSTAGRAM", "GOOGLE_SHEETS"];

// Sources that are always manually assigned (a human is already present/handling intake).
export const MANUAL_SOURCES: LeadSource[] = ["WALK_IN", "MANUAL_OTHER", "REFERRAL"];

export const CONSULTANT_REQUIRED_AT_STATUS: EnquiryStatus = "APPOINTMENT_FIXED";

// Forward-pipeline rank — lets "stage-onward" edits (e.g. Booking/Retail details) check
// "has this enquiry reached at least X" instead of "is it exactly at X right now", so those
// details stay editable at later stages too instead of locking the moment the enquiry moves on.
export const STAGE_RANK: Record<EnquiryStatus, number> = {
  NEW: 0,
  UNDER_FOLLOW_UP: 0,
  APPOINTMENT_FIXED: 1,
  TEST_DRIVE: 2,
  BOOKED: 3,
  RETAIL_DONE: 4,
  RTO_DONE: 5,
  DELIVERED: 6,
  CLOSED: -1,
  CLOSED_TEMP: -1,
  LOST: -1,
};

// Module keys a RoleDefinition can toggle on/off — these are the sidebar/dashboard
// sections of the frontend. Keep in sync with frontend/src/types (MODULES).
export const MODULE_KEYS = [
  "dashboard",
  "leads",
  "customers",
  "follow-ups",
  "test-drives",
  "vehicles",
  "social-inbox",
  "call-campaigns",
  "bulk-messages",
  "templates",
  "media-library",
  "reports",
  "ai-agents",
  "branches",
  "integrations",
] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];

export type PermissionLevel = "none" | "read" | "write";

export type PermissionsMap = Record<ModuleKey, PermissionLevel>;

// Prisma's interactive-transaction default (5s maxWait / 5s timeout) is too tight once the
// DB is a network hop away (e.g. app and Postgres in different regions). These transactions
// run several sequential queries, so give them headroom rather than racing the default.
export const TRANSACTION_OPTIONS = { maxWait: 10_000, timeout: 20_000 };
