import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as agentConfigsApi from "../api/agentConfigs.api";
import type { AgentType, UpsertAgentConfigPayload } from "../api/agentConfigs.api";

export function useAgentConfigs() {
  return useQuery({
    queryKey: ["agent-configs"],
    queryFn: agentConfigsApi.fetchAgentConfigs,
  });
}

export function useSaveAgentConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ type, payload }: { type: AgentType; payload: UpsertAgentConfigPayload }) =>
      agentConfigsApi.saveAgentConfig(type, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agent-configs"] }),
  });
}

export function useGeneratePrompt() {
  return useMutation({
    mutationFn: ({ agentType, description }: { agentType: AgentType; description: string }) =>
      agentConfigsApi.generatePrompt(agentType, description),
  });
}
