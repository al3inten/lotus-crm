import { axiosClient } from "./axiosClient";
import type { AppNotification } from "../types";

export async function fetchNotifications(): Promise<AppNotification[]> {
  const { data } = await axiosClient.get<AppNotification[]>("/notifications");
  return data;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await axiosClient.patch(`/notifications/${id}/read`);
}
