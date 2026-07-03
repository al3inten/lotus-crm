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
} from "../types";

export async function fetchEnquiry(enquiryId: string): Promise<Enquiry> {
  const { data } = await axiosClient.get<Enquiry>(`/enquiries/${enquiryId}`);
  return data;
}

export interface ChangeStatusPayload {
  toStatus: EnquiryStatus;
  note?: string;
  lossReason?: LossReason;
  followUpDueAt?: string;
  consultantId?: string;
}

export async function changeEnquiryStatus(enquiryId: string, payload: ChangeStatusPayload): Promise<Enquiry> {
  const { data } = await axiosClient.patch<Enquiry>(`/enquiries/${enquiryId}/status`, payload);
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
