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

export interface FollowUpCalendarCountsParams {
  start: string;
  end: string;
  search?: string;
  status?: EnquiryStatus;
  enquiryCategory?: EnquiryCategory;
  source?: LeadSource;
  branchId?: string;
  assignedCrId?: string;
}

export async function fetchFollowUpCalendarCounts(params: FollowUpCalendarCountsParams): Promise<Record<string, number>> {
  const { data } = await axiosClient.get<Record<string, number>>("/follow-ups/calendar-counts", { params });
  return data;
}
