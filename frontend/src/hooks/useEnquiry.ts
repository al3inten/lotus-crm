import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as enquiriesApi from "../api/enquiries.api";

export const enquiryKeys = {
  detail: (enquiryId: string) => ["enquiries", enquiryId] as const,
  comments: (enquiryId: string) => ["enquiries", enquiryId, "comments"] as const,
  notes: (enquiryId: string) => ["enquiries", enquiryId, "notes"] as const,
};

export function useEnquiry(enquiryId: string | undefined) {
  return useQuery({
    queryKey: enquiryKeys.detail(enquiryId ?? ""),
    queryFn: () => enquiriesApi.fetchEnquiry(enquiryId!),
    enabled: !!enquiryId,
  });
}

function useInvalidateEnquiry(enquiryId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: enquiryKeys.detail(enquiryId) });
    queryClient.invalidateQueries({ queryKey: ["leads"] });
  };
}

export function useChangeStatus(enquiryId: string) {
  const invalidate = useInvalidateEnquiry(enquiryId);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: enquiriesApi.ChangeStatusPayload) => enquiriesApi.changeEnquiryStatus(enquiryId, payload),
    onSuccess: () => {
      invalidate();
      // A stale followUpDueAt is auto-closed on the stage advance (see enquiries.service.ts
      // changeStatus) and logged as a comment — refresh both so the Follow-ups queue and
      // the Activity Timeline drop it immediately.
      queryClient.invalidateQueries({ queryKey: enquiryKeys.comments(enquiryId) });
      queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
    },
    meta: { successMessage: "Status updated" },
  });
}

export function useUpdateEnquiryDetails(enquiryId: string) {
  const invalidate = useInvalidateEnquiry(enquiryId);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof enquiriesApi.updateEnquiryDetails>[1]) =>
      enquiriesApi.updateEnquiryDetails(enquiryId, payload),
    onSuccess: () => {
      invalidate();
      // A details edit is logged as a comment (shows on the Activity Timeline) — refresh it too.
      queryClient.invalidateQueries({ queryKey: enquiryKeys.comments(enquiryId) });
    },
    meta: { successMessage: "Details updated" },
  });
}

export function useUpdateBookingDetails(enquiryId: string) {
  const invalidate = useInvalidateEnquiry(enquiryId);
  return useMutation({
    mutationFn: (payload: enquiriesApi.BookingDetailsPayload) => enquiriesApi.updateBookingDetails(enquiryId, payload),
    onSuccess: invalidate,
    meta: { successMessage: "Booking details saved" },
  });
}

export function useUpdateRetailDetails(enquiryId: string) {
  const invalidate = useInvalidateEnquiry(enquiryId);
  return useMutation({
    mutationFn: (payload: enquiriesApi.RetailDetailsPayload) => enquiriesApi.updateRetailDetails(enquiryId, payload),
    onSuccess: invalidate,
    meta: { successMessage: "Retail details saved" },
  });
}

export function useUpdateRtoDetails(enquiryId: string) {
  const invalidate = useInvalidateEnquiry(enquiryId);
  return useMutation({
    mutationFn: (payload: enquiriesApi.RtoDetailsPayload) => enquiriesApi.updateRtoDetails(enquiryId, payload),
    onSuccess: invalidate,
    meta: { successMessage: "RTO details saved" },
  });
}

export function useUpdateDeliveryDate(enquiryId: string) {
  const invalidate = useInvalidateEnquiry(enquiryId);
  return useMutation({
    mutationFn: (payload: enquiriesApi.DeliveryDatePayload) => enquiriesApi.updateDeliveryDate(enquiryId, payload),
    onSuccess: invalidate,
    meta: { successMessage: "Delivery date updated" },
  });
}

export function useUpdateKeyDate(enquiryId: string) {
  const invalidate = useInvalidateEnquiry(enquiryId);
  return useMutation({
    mutationFn: (payload: enquiriesApi.UpdateKeyDatePayload) => enquiriesApi.updateKeyDate(enquiryId, payload),
    onSuccess: invalidate,
    meta: { successMessage: "Key date updated" },
  });
}

export function useReassign(enquiryId: string) {
  const invalidate = useInvalidateEnquiry(enquiryId);
  return useMutation({
    mutationFn: ({ toUserId, reason }: { toUserId: string; reason?: string }) =>
      enquiriesApi.reassignEnquiry(enquiryId, toUserId, reason),
    onSuccess: invalidate,
    meta: { successMessage: "Enquiry reassigned" },
  });
}

/** Permanently deletes an enquiry — no invalidate-in-place, the caller navigates away
 * on success since the enquiry no longer exists to refetch. */
export function useDeleteEnquiry(enquiryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => enquiriesApi.deleteEnquiry(enquiryId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: enquiryKeys.detail(enquiryId) });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    meta: { successMessage: "Lead deleted" },
  });
}

export function useSaveTestDrive(enquiryId: string) {
  const invalidate = useInvalidateEnquiry(enquiryId);
  return useMutation({
    mutationFn: (payload: enquiriesApi.TestDrivePayload) => enquiriesApi.saveTestDrive(enquiryId, payload),
    onSuccess: invalidate,
    meta: { successMessage: "Test drive saved" },
  });
}

export function useUpdateTestDrive(enquiryId: string) {
  const invalidate = useInvalidateEnquiry(enquiryId);
  return useMutation({
    mutationFn: ({ testDriveId, payload }: { testDriveId: string; payload: enquiriesApi.UpdateTestDrivePayload }) =>
      enquiriesApi.updateTestDrive(enquiryId, testDriveId, payload),
    onSuccess: invalidate,
    meta: { successMessage: "Test drive updated" },
  });
}

export function useSaveQuotation(enquiryId: string) {
  const invalidate = useInvalidateEnquiry(enquiryId);
  return useMutation({
    mutationFn: (payload: enquiriesApi.QuotationPayload) => enquiriesApi.saveQuotation(enquiryId, payload),
    onSuccess: invalidate,
    meta: { successMessage: "Quotation saved" },
  });
}

export function useSaveExchangeEvaluation(enquiryId: string) {
  const invalidate = useInvalidateEnquiry(enquiryId);
  return useMutation({
    mutationFn: (payload: enquiriesApi.ExchangeEvaluationPayload) => enquiriesApi.saveExchangeEvaluation(enquiryId, payload),
    onSuccess: invalidate,
    meta: { successMessage: "Exchange evaluation saved" },
  });
}

export function useSaveFinanceApplication(enquiryId: string) {
  const invalidate = useInvalidateEnquiry(enquiryId);
  return useMutation({
    mutationFn: (payload: enquiriesApi.FinanceApplicationPayload) => enquiriesApi.saveFinanceApplication(enquiryId, payload),
    onSuccess: invalidate,
    meta: { successMessage: "Finance application saved" },
  });
}

export function useSaveDeliveryDetails(enquiryId: string) {
  const invalidate = useInvalidateEnquiry(enquiryId);
  return useMutation({
    mutationFn: (payload: enquiriesApi.DeliveryDetailsPayload) => enquiriesApi.saveDeliveryDetails(enquiryId, payload),
    onSuccess: invalidate,
    meta: { successMessage: "Delivery details saved" },
  });
}

export function useSaveFollowUp(enquiryId: string) {
  const invalidate = useInvalidateEnquiry(enquiryId);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: enquiriesApi.FollowUpPayload) => enquiriesApi.saveFollowUp(enquiryId, payload),
    onSuccess: () => {
      invalidate();
      // Also refresh the standalone Follow-ups queue/calendar — they key on their own
      // filters, so a plain enquiryKeys.detail() invalidation above never reaches them.
      queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
    },
    meta: { successMessage: "Follow-up saved" },
  });
}

export function useCloseFollowUp(enquiryId: string) {
  const invalidate = useInvalidateEnquiry(enquiryId);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: enquiriesApi.CloseFollowUpPayload) => enquiriesApi.closeFollowUp(enquiryId, payload),
    onSuccess: () => {
      invalidate();
      // Closing is logged as a comment (shows on the Activity Timeline) — refresh both
      // it and the standalone Follow-ups queue/calendar.
      queryClient.invalidateQueries({ queryKey: enquiryKeys.comments(enquiryId) });
      queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
    },
    meta: { successMessage: "Follow-up closed" },
  });
}

export function useReopenEnquiry(enquiryId: string) {
  const invalidate = useInvalidateEnquiry(enquiryId);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: enquiriesApi.ReopenPayload = {}) => enquiriesApi.reopenEnquiry(enquiryId, payload),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: enquiryKeys.comments(enquiryId) });
    },
    meta: { successMessage: "Lead reopened" },
  });
}

export function useComments(enquiryId: string | undefined) {
  return useQuery({
    queryKey: enquiryKeys.comments(enquiryId ?? ""),
    queryFn: () => enquiriesApi.getComments(enquiryId!),
    enabled: !!enquiryId,
  });
}

export function useAddComment(enquiryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: enquiriesApi.CommentPayload) => enquiriesApi.addComment(enquiryId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enquiryKeys.comments(enquiryId) });
    },
    meta: { successMessage: "Comment added" },
  });
}

export function useNotes(enquiryId: string | undefined) {
  return useQuery({
    queryKey: enquiryKeys.notes(enquiryId ?? ""),
    queryFn: () => enquiriesApi.getNotes(enquiryId!),
    enabled: !!enquiryId,
  });
}

export function useAddNote(enquiryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: enquiriesApi.NotePayload) => enquiriesApi.addNote(enquiryId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enquiryKeys.notes(enquiryId) });
    },
    meta: { successMessage: "Note added" },
  });
}
