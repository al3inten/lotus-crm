import { useQuery, keepPreviousData } from "@tanstack/react-query";
import * as followUpsApi from "../api/followUps.api";

export function useUpcomingFollowUps(filters: followUpsApi.FollowUpFilters) {
  return useQuery({
    queryKey: ["follow-ups", "upcoming", filters],
    queryFn: () => followUpsApi.fetchUpcomingFollowUps(filters),
    placeholderData: keepPreviousData,
  });
}

export function useFollowUpCalendar(filters: followUpsApi.FollowUpCalendarFilters | null) {
  return useQuery({
    queryKey: ["follow-ups", "calendar", filters],
    queryFn: () => followUpsApi.fetchFollowUpCalendar(filters!),
    enabled: !!filters,
    placeholderData: keepPreviousData,
  });
}
