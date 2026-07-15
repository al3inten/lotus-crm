import { useQuery } from "@tanstack/react-query";
import { fetchGlobalSearch } from "../api/search.api";

export function useGlobalSearch(query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: ["global-search", trimmed],
    queryFn: () => fetchGlobalSearch(trimmed),
    enabled: trimmed.length >= 2,
    staleTime: 15_000,
  });
}
