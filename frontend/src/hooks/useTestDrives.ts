import { useQuery, keepPreviousData } from "@tanstack/react-query";
import * as testDrivesApi from "../api/testDrives.api";

export function useTestDrives(filters: testDrivesApi.TestDriveFilters) {
  return useQuery({
    queryKey: ["test-drives", filters],
    queryFn: () => testDrivesApi.fetchTestDrives(filters),
    placeholderData: keepPreviousData,
  });
}
