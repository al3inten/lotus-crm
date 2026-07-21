import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as enquiriesApi from "../api/enquiries.api";

export const enquiryKeys = {
  detail: (enquiryId: string) => ["enquiries", enquiryId] as const,
  comments: (enquiryId: string) => ["enquiries", enquiryId, "comments"] as const,
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
  return useMutation({
    mutationFn: (payload: enquiriesApi.ChangeStatusPayload) => enquiriesApi.changeEnquiryStatus(enquiryId, payload),
    onSuccess: invalidate,
  });
}

export function useUpdateEnquiryDetails(enquiryId: string) {
  const invalidate = useInvalidateEnquiry(enquiryId);
  return useMutation({
    mutationFn: (payload: Parameters<typeof enquiriesApi.updateEnquiryDetails>[1]) =>
      enquiriesApi.updateEnquiryDetails(enquiryId, payload),
    onSuccess: invalidate,
  });
}

export function useUpdateBookingDetails(enquiryId: string) {
  const invalidate = useInvalidateEnquiry(enquiryId);
  return useMutation({
    mutationFn: (payload: enquiriesApi.BookingDetailsPayload) => enquiriesApi.updateBookingDetails(enquiryId, payload),
    onSuccess: invalidate,
  });
}

export function useReassign(enquiryId: string) {
  const invalidate = useInvalidateEnquiry(enquiryId);
  return useMutation({
    mutationFn: ({ toUserId, reason }: { toUserId: string; reason?: string }) =>
      enquiriesApi.reassignEnquiry(enquiryId, toUserId, reason),
    onSuccess: invalidate,
  });
}

export function useSaveTestDrive(enquiryId: string) {
  const invalidate = useInvalidateEnquiry(enquiryId);
  return useMutation({
    mutationFn: (payload: enquiriesApi.TestDrivePayload) => enquiriesApi.saveTestDrive(enquiryId, payload),
    onSuccess: invalidate,
  });
}

export function useUpdateTestDrive(enquiryId: string) {
  const invalidate = useInvalidateEnquiry(enquiryId);
  return useMutation({
    mutationFn: ({ testDriveId, payload }: { testDriveId: string; payload: enquiriesApi.UpdateTestDrivePayload }) =>
      enquiriesApi.updateTestDrive(enquiryId, testDriveId, payload),
    onSuccess: invalidate,
  });
}

export function useSaveQuotation(enquiryId: string) {
  const invalidate = useInvalidateEnquiry(enquiryId);
  return useMutation({
    mutationFn: (payload: enquiriesApi.QuotationPayload) => enquiriesApi.saveQuotation(enquiryId, payload),
    onSuccess: invalidate,
  });
}

export function useSaveExchangeEvaluation(enquiryId: string) {
  const invalidate = useInvalidateEnquiry(enquiryId);
  return useMutation({
    mutationFn: (payload: enquiriesApi.ExchangeEvaluationPayload) => enquiriesApi.saveExchangeEvaluation(enquiryId, payload),
    onSuccess: invalidate,
  });
}

export function useSaveFinanceApplication(enquiryId: string) {
  const invalidate = useInvalidateEnquiry(enquiryId);
  return useMutation({
    mutationFn: (payload: enquiriesApi.FinanceApplicationPayload) => enquiriesApi.saveFinanceApplication(enquiryId, payload),
    onSuccess: invalidate,
  });
}

export function useSaveDeliveryDetails(enquiryId: string) {
  const invalidate = useInvalidateEnquiry(enquiryId);
  return useMutation({
    mutationFn: (payload: enquiriesApi.DeliveryDetailsPayload) => enquiriesApi.saveDeliveryDetails(enquiryId, payload),
    onSuccess: invalidate,
  });
}

export function useSaveFollowUp(enquiryId: string) {
  const invalidate = useInvalidateEnquiry(enquiryId);
  return useMutation({
    mutationFn: (payload: enquiriesApi.FollowUpPayload) => enquiriesApi.saveFollowUp(enquiryId, payload),
    onSuccess: invalidate,
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
  });
}
