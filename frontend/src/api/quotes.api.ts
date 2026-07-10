import { axiosClient } from "./axiosClient";
import type { Quotation, Enquiry, User } from "../types";

export interface PublicQuoteResponse extends Quotation {
  enquiry: Enquiry & { lead: any; branch: any };
  quotedBy: User;
}

export async function fetchPublicQuote(id: string): Promise<PublicQuoteResponse> {
  const { data } = await axiosClient.get<PublicQuoteResponse>(`/public/quotes/${id}`);
  return data;
}
