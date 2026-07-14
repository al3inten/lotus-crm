import { useQuery, keepPreviousData } from "@tanstack/react-query";
import * as followUpsApi from "../api/followUps.api";

export function useUpcomingFollowUps(filters: followUpsApi.FollowUpFilters) {
  return useQuery({
    queryKey: ["follow-ups", "upcoming", filters],
    queryFn: () => followUpsApi.fetchUpcomingFollowUps(filters),
    placeholderData: keepPreviousData,
  });
}
