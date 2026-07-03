import { Readable } from "stream";
import { UploadApiResponse } from "cloudinary";
import { prisma } from "../../lib/prisma";
import { NotFoundError, ValidationError } from "../../lib/errors";
import { configureCloudinary } from "../integrations/integrations.service";
import { UploadMediaInput, ListMediaQuery } from "./media.schema";

function uploadBuffer(cloudinary: Awaited<ReturnType<typeof configureCloudinary>>, buffer: Buffer, resourceType: "image" | "video" | "raw") {
  return new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: resourceType, folder: "lotus-crm" },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Cloudinary upload failed"));
        resolve(result);
      }
    );
    Readable.from(buffer).pipe(uploadStream);
  });
}

function resourceTypeFor(mediaType: UploadMediaInput["mediaType"]): "image" | "video" | "raw" {
  if (mediaType === "IMAGE") return "image";
  if (mediaType === "VIDEO") return "video";
  return "raw";
}

export async function uploadMedia(fileBuffer: Buffer, input: UploadMediaInput, uploadedById: string) {
  if (!fileBuffer.length) throw new ValidationError("No file uploaded");

  const cloudinary = await configureCloudinary();
  const result = await uploadBuffer(cloudinary, fileBuffer, resourceTypeFor(input.mediaType));

  return prisma.mediaAsset.create({
    data: {
      label: input.label,
      mediaType: input.mediaType,
      carModel: input.carModel,
      cloudinaryUrl: result.secure_url,
      cloudinaryPublicId: result.public_id,
      uploadedById,
    },
  });
}

export async function listMedia(query: ListMediaQuery) {
  return prisma.mediaAsset.findMany({
    where: {
      ...(query.mediaType ? { mediaType: query.mediaType } : {}),
      ...(query.carModel ? { carModel: { contains: query.carModel, mode: "insensitive" } } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteMedia(mediaId: string) {
  const asset = await prisma.mediaAsset.findUnique({ where: { id: mediaId } });
  if (!asset) throw new NotFoundError("Media asset not found");

  const cloudinary = await configureCloudinary();
  const resourceType = asset.mediaType === "IMAGE" ? "image" : asset.mediaType === "VIDEO" ? "video" : "raw";
  await cloudinary.uploader.destroy(asset.cloudinaryPublicId, { resource_type: resourceType }).catch(() => {
    // Best-effort — if it's already gone from Cloudinary, still remove our record.
  });

  await prisma.mediaAsset.delete({ where: { id: mediaId } });
}
