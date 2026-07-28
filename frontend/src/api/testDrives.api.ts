import { axiosClient } from "./axiosClient";

export type TestDriveStatus = "OVERDUE" | "UPCOMING" | "COMPLETED" | "ALL";
export type TestDriveSortBy = "scheduledAt" | "createdAt" | "cr" | "consultant";

export interface TestDriveFilters {
  /** Matches customer name/phone only — use assignedCrId/consultantId to filter by rep. */
  search?: string;
  status?: TestDriveStatus;
  /** Calendar range (YYYY-MM-DD, inclusive) to filter test drives scheduled within.
   *  A single day is just dateFrom === dateTo; either end may be given alone. */
  dateFrom?: string;
  dateTo?: string;
  branchId?: string;
  assignedCrId?: string;
  consultantId?: string;
  sortBy?: TestDriveSortBy;
  order?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface TestDriveItem {
  id: string;
  enquiryId: string;
  leadId: string;
  leadName: string;
  phoneRaw: string;
  carModel: string;
  variant: string | null;
  scheduledAt: string | null;
  completedAt: string | null;
  rating: number | null;
  address: string | null;
  comments: string | null;
  createdAt: string;
  status: Exclude<TestDriveStatus, "ALL">;
  branch: { id: string; name: string } | null;
  assignedCr: { id: string; name: string } | null;
  consultant: { id: string; name: string } | null;
}

export interface TestDriveStats {
  overdue: number;
  upcoming: number;
  completed: number;
  total: number;
}

export interface TestDriveFacet {
  id: string;
  name: string;
  count: number;
}

export interface TestDriveListResponse {
  items: TestDriveItem[];
  total: number;
  page: number;
  pageSize: number;
  stats: TestDriveStats;
  crs: TestDriveFacet[];
  consultants: TestDriveFacet[];
  /** True when the current user may see test drives beyond their own (manager/admin). */
  canSeeOthers: boolean;
  /** True for SUPER_ADMIN / ADMIN — may filter across branches. */
  crossBranch: boolean;
}

export async function fetchTestDrives(filters: TestDriveFilters): Promise<TestDriveListResponse> {
  const { data } = await axiosClient.get<TestDriveListResponse>("/test-drives", { params: filters });
  return data;
}
