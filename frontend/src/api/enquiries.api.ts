import { axiosClient } from "./axiosClient";
import type {
  Enquiry,
  EnquiryStatus,
  LossReason,
  TestDriveFeedback,
  Quotation,
  ExchangeEvaluation,
  FinanceApplication,
  FinanceStatus,
  DeliveryDetails,
  Comment,
} from "../types";
import type { LeadEnrichmentPayload } from "./leads.api";

export async function fetchEnquiry(enquiryId: string): Promise<Enquiry> {
  const { data } = await axiosClient.get<Enquiry>(`/enquiries/${enquiryId}`);
  return data;
}

export interface ChangeStatusPayload {
  toStatus: EnquiryStatus;
  note?: string;
  lossReason?: LossReason;
  followUpDueAt?: string;
  appointmentAt?: string;
  consultantId?: string;
}

export async function changeEnquiryStatus(enquiryId: string, payload: ChangeStatusPayload): Promise<Enquiry> {
  const { data } = await axiosClient.patch<Enquiry>(`/enquiries/${enquiryId}/status`, payload);
  return data;
}

export async function updateEnquiryDetails(enquiryId: string, payload: LeadEnrichmentPayload): Promise<Enquiry> {
  const { data } = await axiosClient.patch<Enquiry>(`/enquiries/${enquiryId}/details`, payload);
  return data;
}

export async function reassignEnquiry(enquiryId: string, toUserId: string, reason?: string): Promise<Enquiry> {
  const { data } = await axiosClient.patch<Enquiry>(`/enquiries/${enquiryId}/reassign`, { toUserId, reason });
  return data;
}

export interface TestDrivePayload {
  conductedById: string;
  scheduledAt?: string;
  completedAt?: string;
  rating?: number;
  comments?: string;
}
export async function saveTestDrive(enquiryId: string, payload: TestDrivePayload): Promise<TestDriveFeedback> {
  const { data } = await axiosClient.post<TestDriveFeedback>(`/enquiries/${enquiryId}/test-drive`, payload);
  return data;
}

export interface QuotationPayload {
  quotedById: string;
  variant?: string;
  onRoadPrice: number;
  discount?: number;
  finalPrice: number;
  validUntil?: string;
  pdfUrl?: string;
}
export async function saveQuotation(enquiryId: string, payload: QuotationPayload): Promise<Quotation> {
  const { data } = await axiosClient.post<Quotation>(`/enquiries/${enquiryId}/quotation`, payload);
  return data;
}

export interface ExchangeEvaluationPayload {
  oldCarMake: string;
  oldCarModel: string;
  oldCarYear: number;
  oldCarKms: number;
  oldCarCondition?: string;
  valuationAmount: number;
  evaluatedById: string;
}
export async function saveExchangeEvaluation(
  enquiryId: string,
  payload: ExchangeEvaluationPayload
): Promise<ExchangeEvaluation> {
  const { data } = await axiosClient.post<ExchangeEvaluation>(`/enquiries/${enquiryId}/exchange-evaluation`, payload);
  return data;
}

export interface FinanceApplicationPayload {
  bankOrNbfc: string;
  loanAmount?: number;
  status?: FinanceStatus;
  docsChecklist?: Record<string, boolean>;
  rejectionReason?: string;
}
export async function saveFinanceApplication(
  enquiryId: string,
  payload: FinanceApplicationPayload
): Promise<FinanceApplication> {
  const { data } = await axiosClient.post<FinanceApplication>(`/enquiries/${enquiryId}/finance`, payload);
  return data;
}

export interface DeliveryDetailsPayload {
  rcTransferDone?: boolean;
  insuranceDone?: boolean;
  accessoriesFitted?: boolean;
  deliveryDate?: string;
  deliveredAt?: string;
  notes?: string;
}
export async function saveDeliveryDetails(enquiryId: string, payload: DeliveryDetailsPayload): Promise<DeliveryDetails> {
  const { data } = await axiosClient.post<DeliveryDetails>(`/enquiries/${enquiryId}/delivery`, payload);
  return data;
}

export interface FollowUpPayload {
  followUpDate: string;
  followUpTime?: string;
  type: "CALL" | "WHATSAPP" | "VISIT" | "EMAIL";
  remark: string;
  nextFollowUpDate?: string;
  nextFollowUpTime?: string;
}

export async function saveFollowUp(enquiryId: string, payload: FollowUpPayload) {
  const { data } = await axiosClient.post(`/enquiries/${enquiryId}/follow-ups`, payload);
  return data;
}

export interface CommentPayload {
  body: string;
  mentionedUserIds?: string[];
}

export async function addComment(enquiryId: string, payload: CommentPayload): Promise<Comment> {
  const { data } = await axiosClient.post<Comment>(`/enquiries/${enquiryId}/comments`, payload);
  return data;
}

export async function getComments(enquiryId: string): Promise<Comment[]> {
  const { data } = await axiosClient.get<Comment[]>(`/enquiries/${enquiryId}/comments`);
  return data;
}
