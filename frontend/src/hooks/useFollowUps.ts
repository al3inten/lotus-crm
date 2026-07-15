import { useQuery, keepPreviousData } from "@tanstack/react-query";
import * as followUpsApi from "../api/followUps.api";

export function useUpcomingFollowUps(filters: followUpsApi.FollowUpFilters) {
  return useQuery({
    queryKey: ["follow-ups", "upcoming", filters],
    queryFn: () => followUpsApi.fetchUpcomingFollowUps(filters),
    placeholderData: keepPreviousData,
  });
}

export function useFollowUpCalendarCounts(params: followUpsApi.FollowUpCalendarCountsParams | null) {
  return useQuery({
    queryKey: ["follow-ups", "calendar-counts", params],
    queryFn: () => followUpsApi.fetchFollowUpCalendarCounts(params as followUpsApi.FollowUpCalendarCountsParams),
    enabled: !!params,
    placeholderData: keepPreviousData,
  });
}
