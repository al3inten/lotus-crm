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
  EnquiryNote,
  DateFieldKey,
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
  // Test Drive: scheduled date/time for the first drive.
  testDriveScheduledAt?: string;
  // Later-stage milestone dates.
  bookedAt?: string;
  retailDoneAt?: string;
  rtoDoneAt?: string;
  deliveredAt?: string;
  // Booking-phase finance.
  financeRequired?: boolean;
  financeDocumentCollected?: boolean;
  financeLoanApproved?: boolean;
  financeDoReceived?: boolean;
}

export async function changeEnquiryStatus(enquiryId: string, payload: ChangeStatusPayload): Promise<Enquiry> {
  const { data } = await axiosClient.patch<Enquiry>(`/enquiries/${enquiryId}/status`, payload);
  return data;
}

export async function updateEnquiryDetails(enquiryId: string, payload: LeadEnrichmentPayload): Promise<Enquiry> {
  const { data } = await axiosClient.patch<Enquiry>(`/enquiries/${enquiryId}/details`, payload);
  return data;
}

export interface BookingDetailsPayload {
  bookedAt?: string;
  financeRequired?: boolean;
  financeDocumentCollected?: boolean;
  financeLoanApproved?: boolean;
  financeDoReceived?: boolean;
}
export async function updateBookingDetails(enquiryId: string, payload: BookingDetailsPayload): Promise<Enquiry> {
  const { data } = await axiosClient.patch<Enquiry>(`/enquiries/${enquiryId}/booking`, payload);
  return data;
}

export interface RetailDetailsPayload {
  retailDoneAt?: string;
}
export async function updateRetailDetails(enquiryId: string, payload: RetailDetailsPayload): Promise<Enquiry> {
  const { data } = await axiosClient.patch<Enquiry>(`/enquiries/${enquiryId}/retail`, payload);
  return data;
}

export interface RtoDetailsPayload {
  rtoDoneAt?: string;
}
export async function updateRtoDetails(enquiryId: string, payload: RtoDetailsPayload): Promise<Enquiry> {
  const { data } = await axiosClient.patch<Enquiry>(`/enquiries/${enquiryId}/rto`, payload);
  return data;
}

export interface DeliveryDatePayload {
  deliveredAt?: string;
}
export async function updateDeliveryDate(enquiryId: string, payload: DeliveryDatePayload): Promise<Enquiry> {
  const { data } = await axiosClient.patch<Enquiry>(`/enquiries/${enquiryId}/delivery-date`, payload);
  return data;
}

export interface UpdateKeyDatePayload {
  field: DateFieldKey;
  date: string;
  reason: string;
}
export async function updateKeyDate(enquiryId: string, payload: UpdateKeyDatePayload): Promise<Enquiry> {
  const { data } = await axiosClient.patch<Enquiry>(`/enquiries/${enquiryId}/key-dates`, payload);
  return data;
}

export async function reassignEnquiry(enquiryId: string, toUserId: string, reason?: string): Promise<Enquiry> {
  const { data } = await axiosClient.patch<Enquiry>(`/enquiries/${enquiryId}/reassign`, { toUserId, reason });
  return data;
}

export interface TestDrivePayload {
  conductedById: string;
  carModel?: string;
  variant?: string;
  scheduledAt?: string;
  completedAt?: string;
  address?: string;
  rating?: number;
  comments?: string;
}
export async function saveTestDrive(enquiryId: string, payload: TestDrivePayload): Promise<TestDriveFeedback> {
  const { data } = await axiosClient.post<TestDriveFeedback>(`/enquiries/${enquiryId}/test-drive`, payload);
  return data;
}

export interface UpdateTestDrivePayload {
  completedAt?: string;
  address?: string;
  rating?: number;
  comments?: string;
}
/** Mark a scheduled test drive done / update its feedback. */
export async function updateTestDrive(
  enquiryId: string,
  testDriveId: string,
  payload: UpdateTestDrivePayload
): Promise<TestDriveFeedback> {
  const { data } = await axiosClient.patch<TestDriveFeedback>(
    `/enquiries/${enquiryId}/test-drive/${testDriveId}`,
    payload
  );
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

export interface NotePayload {
  body: string;
}

/** Private notes — the server always scopes GET to the caller's own notes only. */
export async function addNote(enquiryId: string, payload: NotePayload): Promise<EnquiryNote> {
  const { data } = await axiosClient.post<EnquiryNote>(`/enquiries/${enquiryId}/notes`, payload);
  return data;
}

export async function getNotes(enquiryId: string): Promise<EnquiryNote[]> {
  const { data } = await axiosClient.get<EnquiryNote[]>(`/enquiries/${enquiryId}/notes`);
  return data;
}
