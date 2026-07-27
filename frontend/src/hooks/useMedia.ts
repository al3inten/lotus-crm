import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as mediaApi from "../api/media.api";
import type { MediaType } from "../api/media.api";

export function useMediaAssets(filters: { mediaType?: MediaType; carModel?: string } = {}) {
  return useQuery({
    queryKey: ["media", filters],
    queryFn: () => mediaApi.fetchMedia(filters),
  });
}

export function useUploadMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, label, mediaType, carModel }: { file: File; label: string; mediaType: MediaType; carModel?: string }) =>
      mediaApi.uploadMedia(file, label, mediaType, carModel),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["media"] }),
    meta: { successMessage: "Media uploaded" },
  });
}

export function useDeleteMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mediaId: string) => mediaApi.deleteMedia(mediaId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["media"] }),
    meta: { successMessage: "Media deleted" },
  });
}
