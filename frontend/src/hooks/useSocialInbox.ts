import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as socialInboxApi from "../api/socialInbox.api";
import type { SocialChannel, ConvertConversationPayload } from "../api/socialInbox.api";

export function useConversations(filters: { channel?: SocialChannel; onlyUnresolved?: boolean }) {
  return useQuery({
    queryKey: ["social-inbox", filters],
    queryFn: () => socialInboxApi.fetchConversations(filters),
    refetchInterval: 15_000,
  });
}

export function useConversation(conversationId: string | undefined) {
  return useQuery({
    queryKey: ["social-inbox", "detail", conversationId],
    queryFn: () => socialInboxApi.fetchConversation(conversationId!),
    enabled: !!conversationId,
    refetchInterval: 10_000,
  });
}

export function useConvertConversation(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ConvertConversationPayload) => socialInboxApi.convertConversation(conversationId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-inbox"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    meta: { successMessage: "Conversation converted to lead" },
  });
}

export function useIgnoreConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => socialInboxApi.ignoreConversation(conversationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["social-inbox"] }),
    meta: { successMessage: "Conversation ignored" },
  });
}
