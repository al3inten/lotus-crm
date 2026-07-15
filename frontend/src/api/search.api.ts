import { axiosClient } from "./axiosClient";
import type { EnquiryStatus } from "../types";

export interface SearchLeadResult {
  enquiryId: string;
  leadId: string;
  name: string;
  phone: string;
  carModel: string;
  status: EnquiryStatus;
  branchName: string;
}

export interface SearchVehicleResult {
  id: string;
  name: string;
}

export interface GlobalSearchResult {
  leads: SearchLeadResult[];
  vehicles: SearchVehicleResult[];
}

export async function fetchGlobalSearch(query: string): Promise<GlobalSearchResult> {
  const { data } = await axiosClient.get<GlobalSearchResult>("/search", { params: { q: query } });
  return data;
}
