import { axiosClient } from "./axiosClient";

export type MediaType = "IMAGE" | "VIDEO" | "DOCUMENT";

export interface MediaAsset {
  id: string;
  label: string;
  mediaType: MediaType;
  carModel?: string | null;
  cloudinaryUrl: string;
  createdAt: string;
}

export async function fetchMedia(params: { mediaType?: MediaType; carModel?: string }): Promise<MediaAsset[]> {
  const { data } = await axiosClient.get<MediaAsset[]>("/media", { params });
  return data;
}

export async function uploadMedia(file: File, label: string, mediaType: MediaType, carModel?: string): Promise<MediaAsset> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("label", label);
  formData.append("mediaType", mediaType);
  if (carModel) formData.append("carModel", carModel);
  const { data } = await axiosClient.post<MediaAsset>("/media", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function deleteMedia(mediaId: string): Promise<void> {
  await axiosClient.delete(`/media/${mediaId}`);
}
