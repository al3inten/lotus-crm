import { axiosClient } from "./axiosClient";
import type { AppNotification, Reminder } from "../types";

export async function fetchNotifications(): Promise<AppNotification[]> {
  const { data } = await axiosClient.get<AppNotification[]>("/notifications");
  return data;
}

export async function fetchReminders(): Promise<Reminder[]> {
  const { data } = await axiosClient.get<Reminder[]>("/notifications/reminders");
  return data;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await axiosClient.patch(`/notifications/${id}/read`);
}

/** Flag a returning customer's repeat contact — notifies the enquiry's CR + branch manager(s). */
export async function pushRepeatEnquiryAlert(enquiryId: string): Promise<{ notified: number }> {
  const { data } = await axiosClient.post<{ notified: number }>("/notifications/repeat-enquiry", { enquiryId });
  return data;
}
