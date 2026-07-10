import { useQuery } from "@tanstack/react-query";
import * as quotesApi from "../api/quotes.api";

export function usePublicQuote(id: string | undefined) {
  return useQuery({
    queryKey: ["public-quote", id],
    queryFn: () => quotesApi.fetchPublicQuote(id!),
    enabled: !!id,
    retry: false,
  });
}
