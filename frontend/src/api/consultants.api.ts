import { axiosClient } from "./axiosClient";
import type { ConsultantDirectory } from "../types";

export interface CreateConsultantPayload {
  name: string;
  mobile: string;
  branchId: string;
}

export interface UpdateConsultantPayload {
  name?: string;
  mobile?: string;
  branchId?: string;
  isActive?: boolean;
}

export async function fetchConsultants(branchId?: string): Promise<ConsultantDirectory[]> {
  const { data } = await axiosClient.get<ConsultantDirectory[]>("/consultants", {
    params: branchId ? { branchId } : {},
  });
  return data;
}

export async function createConsultant(payload: CreateConsultantPayload): Promise<ConsultantDirectory> {
  const { data } = await axiosClient.post<ConsultantDirectory>("/consultants", payload);
  return data;
}

export async function updateConsultant(id: string, payload: UpdateConsultantPayload): Promise<ConsultantDirectory> {
  const { data } = await axiosClient.patch<ConsultantDirectory>(`/consultants/${id}`, payload);
  return data;
}

export async function deleteConsultant(id: string): Promise<void> {
  await axiosClient.delete(`/consultants/${id}`);
}
