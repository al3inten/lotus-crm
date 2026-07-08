import { axiosClient } from "./axiosClient";
import type {
  Enquiry,
  LeadSource,
  EnquiryType,
  Department,
  LeadSubsource,
  EnquiryCategory,
  LeadDraft,
  LeadWithHistory,
  PaginatedEnquiries,
} from "../types";

export interface LeadFilters {
  search?: string;
  status?: string;
  source?: string;
  branchId?: string;
  assignedCrId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

/** Offline-intake enrichment fields — all optional, shared by create and complete-details payloads. */
export interface LeadEnrichmentPayload {
  alternateMobile?: string;
  dob?: string;
  profession?: string;
  pincode?: string;
  address?: string;
  department?: Department;
  subsource?: LeadSubsource;
  variant?: string;
  enquiryCategory?: EnquiryCategory;
  financeRequired?: boolean;
  financeRemarks?: string;
  appointmentScheduled?: boolean;
  appointmentAt?: string;
  testDriveInterested?: boolean;
  testDriveCount?: number;
  exchangeCarModel?: string;
  exchangeCarYear?: number;
  exchangeCarKms?: number;
  exchangeCarOwners?: number;
  calledDate?: string;
  remarks?: string;
}

export interface CreateEnquiryPayload extends LeadEnrichmentPayload {
  name: string;
  phone: string;
  email?: string;
  carModel: string;
  source: LeadSource;
  enquiryType: EnquiryType;
  location?: string;
  branchId: string;
  assignedCrId?: string;
}

export type WalkInLeadPayload = Omit<CreateEnquiryPayload, "source">;

export interface CreateEnquiryResult {
  lead: { id: string; name: string; phoneNormalized: string };
  enquiry: Enquiry;
  isRepeatLead: boolean;
  priorEnquiryCount: number;
  /** True when the contact was attached to an existing active enquiry instead of creating a new one. */
  attachedToExisting: boolean;
}

export async function fetchLeads(filters: LeadFilters): Promise<PaginatedEnquiries> {
  const { data } = await axiosClient.get<PaginatedEnquiries>("/leads", { params: filters });
  return data;
}

export async function fetchLeadHistory(leadId: string): Promise<LeadWithHistory> {
  const { data } = await axiosClient.get<LeadWithHistory>(`/leads/${leadId}`);
  return data;
}

export async function createWalkInLead(payload: WalkInLeadPayload): Promise<CreateEnquiryResult> {
  const { data } = await axiosClient.post<CreateEnquiryResult>("/leads/walk-in", payload);
  return data;
}

export async function createEnquiry(payload: CreateEnquiryPayload): Promise<CreateEnquiryResult> {
  const { data } = await axiosClient.post<CreateEnquiryResult>("/leads", payload);
  return data;
}

export interface ImportSummary {
  totalRows: number;
  created: number;
  merged: number;
  failed: number;
  errors: { row: number; message: string }[];
}

export async function importLeadsFile(file: File, branchId: string): Promise<ImportSummary> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("branchId", branchId);
  const { data } = await axiosClient.post<ImportSummary>("/leads/import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function fetchDrafts(): Promise<LeadDraft[]> {
  const { data } = await axiosClient.get<LeadDraft[]>("/leads/drafts");
  return data;
}

export async function saveDraft(branchId: string | undefined, data: Record<string, unknown>): Promise<LeadDraft> {
  const { data: draft } = await axiosClient.post<LeadDraft>("/leads/drafts", { branchId, data });
  return draft;
}

export async function updateDraft(id: string, data: Record<string, unknown>): Promise<LeadDraft> {
  const { data: draft } = await axiosClient.patch<LeadDraft>(`/leads/drafts/${id}`, { data });
  return draft;
}

export async function deleteDraft(id: string): Promise<void> {
  await axiosClient.delete(`/leads/drafts/${id}`);
}

export async function downloadLeadImportTemplate(): Promise<void> {
  const { data } = await axiosClient.get("/leads/import/template", { responseType: "blob" });
  const url = window.URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = url;
  link.download = "lead-import-template.xlsx";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
