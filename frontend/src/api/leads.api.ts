import { axiosClient } from "./axiosClient";
import type { Enquiry, LeadSource, EnquiryType, LeadWithHistory, PaginatedEnquiries } from "../types";

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

export interface CreateEnquiryPayload {
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
