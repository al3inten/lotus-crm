import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as templatesApi from "../api/templates.api";

export function useTemplates() {
  return useQuery({
    queryKey: ["templates"],
    queryFn: templatesApi.fetchTemplates,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: templatesApi.createTemplate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["templates"] }),
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => templatesApi.deleteTemplate(templateId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["templates"] }),
  });
}
