import { axiosClient } from "./axiosClient";
import type { PaginatedCustomers } from "../types";

import type { CustomerTier } from "../types";

export interface CustomerFilters {
  search?: string;
  branchId?: string;
  tier?: CustomerTier;
  page?: number;
  pageSize?: number;
}

export async function fetchCustomers(filters: CustomerFilters): Promise<PaginatedCustomers> {
  const { data } = await axiosClient.get<PaginatedCustomers>("/leads/customers", { params: filters });
  return data;
}
