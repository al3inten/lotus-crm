import { axiosClient } from "./axiosClient";

export interface SystemSettings {
  quotationEnabled: boolean;
}

export async function getSystemSettings(): Promise<SystemSettings> {
  const res = await axiosClient.get("/settings");
  return res.data;
}

export async function updateSystemSettings(data: { quotationEnabled: boolean }): Promise<SystemSettings> {
  const res = await axiosClient.patch("/settings", data);
  return res.data;
}
