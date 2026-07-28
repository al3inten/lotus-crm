import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as notificationsApi from "../api/notifications.api";

export const notificationKeys = {
  all: ["notifications"] as const,
  reminders: ["notifications", "reminders"] as const,
};

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: notificationsApi.fetchNotifications,
    refetchInterval: 30000, // Poll every 30 seconds
  });
}

export function useReminders() {
  return useQuery({
    queryKey: notificationKeys.reminders,
    queryFn: notificationsApi.fetchReminders,
    refetchInterval: 60000, // Poll every minute
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
    meta: { successMessage: "Notification marked read" },
  });
}

export function useDismissReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.dismissReminder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.reminders });
    },
  });
}

export function useDismissAllReminders() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.dismissAllReminders,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.reminders });
    },
    meta: { successMessage: "Reminders cleared" },
  });
}

export function usePushRepeatEnquiryAlert() {
  return useMutation({
    mutationFn: notificationsApi.pushRepeatEnquiryAlert,
    meta: { successMessage: "Alert sent" },
  });
}
