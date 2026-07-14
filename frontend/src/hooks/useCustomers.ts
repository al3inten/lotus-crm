import { useQuery, keepPreviousData } from "@tanstack/react-query";
import * as customersApi from "../api/customers.api";

export function useCustomers(filters: customersApi.CustomerFilters) {
  return useQuery({
    queryKey: ["customers", filters],
    queryFn: () => customersApi.fetchCustomers(filters),
    placeholderData: keepPreviousData,
  });
}
