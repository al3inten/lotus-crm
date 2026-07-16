import { axiosClient } from "./axiosClient";
import type { EnquiryStatus, EnquiryCategory, LeadSource, FollowUpType } from "../types";

export type FollowUpTimeframe = "overdue" | "today" | "week" | "later" | "all";
export type FollowUpSortBy = "dueDate" | "createdAt" | "cr" | "status";

export interface FollowUpFilters {
  search?: string;
  timeframe?: FollowUpTimeframe;
  /** Exact calendar day (YYYY-MM-DD) to filter follow-ups due on. */
  dueDate?: string;
  status?: EnquiryStatus;
  enquiryCategory?: EnquiryCategory;
  source?: LeadSource;
  branchId?: string;
  assignedCrId?: string;
  sortBy?: FollowUpSortBy;
  order?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface UpcomingFollowUp {
  enquiryId: string;
  leadId: string;
  leadName: string;
  phoneRaw: string;
  carModel: string;
  source: LeadSource;
  status: EnquiryStatus;
  enquiryCategory: EnquiryCategory | null;
  followUpDueAt: string;
  branch: { id: string; name: string } | null;
  assignedCr: { id: string; name: string } | null;
  lastFollowUp: { type: FollowUpType; remark: string; createdAt: string } | null;
}

export interface FollowUpStats {
  overdue: number;
  today: number;
  thisWeek: number;
  later: number;
  total: number;
}

export interface FollowUpCrFacet {
  id: string;
  name: string;
  count: number;
}

export interface UpcomingFollowUpsResponse {
  items: UpcomingFollowUp[];
  total: number;
  page: number;
  pageSize: number;
  stats: FollowUpStats;
  crs: FollowUpCrFacet[];
  /** True when the current user may see follow-ups beyond their own (manager/admin). */
  canSeeOthers: boolean;
  /** True for SUPER_ADMIN / ADMIN — may filter across branches. */
  crossBranch: boolean;
}

export async function fetchUpcomingFollowUps(filters: FollowUpFilters): Promise<UpcomingFollowUpsResponse> {
  const { data } = await axiosClient.get<UpcomingFollowUpsResponse>("/follow-ups/upcoming", { params: filters });
  return data;
}

export interface FollowUpCalendarFilters {
  start: string;
  end: string;
  branchId?: string;
  assignedCrId?: string;
}

export interface FollowUpCalendarCr {
  id: string;
  name: string;
  count: number;
  /** Per-day breakdown for this CR, keyed by YYYY-MM-DD. */
  countsByDate: Record<string, number>;
}

export interface FollowUpCalendarResponse {
  /** Total follow-ups due per day, keyed by YYYY-MM-DD. */
  counts: Record<string, number>;
  /** Per-CR totals over the range (populated for managers/admins). */
  byCr: FollowUpCalendarCr[];
  total: number;
  canSeeOthers: boolean;
  crossBranch: boolean;
}

export async function fetchFollowUpCalendar(filters: FollowUpCalendarFilters): Promise<FollowUpCalendarResponse> {
  const { data } = await axiosClient.get<FollowUpCalendarResponse>("/follow-ups/calendar", { params: filters });
  return data;
}
