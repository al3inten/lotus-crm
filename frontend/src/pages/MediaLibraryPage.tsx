import { useState } from "react";
import { useMediaAssets, useUploadMedia, useDeleteMedia } from "../hooks/useMedia";
import { Button } from "../components/common/Button";
import { Input, Select } from "../components/common/Input";
import { Modal } from "../components/common/Modal";
import type { MediaType } from "../api/media.api";

function UploadMediaForm({ onDone }: { onDone: () => void }) {
  const uploadMedia = useUploadMedia();
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState("");
  const [mediaType, setMediaType] = useState<MediaType>("IMAGE");
  const [carModel, setCarModel] = useState("");

  const handleSubmit = async () => {
    if (!file || !label) return;
    await uploadMedia.mutateAsync({ file, label, mediaType, carModel: carModel || undefined });
    onDone();
  };

  return (
    <div className="flex flex-col gap-3">
      <Input label="Label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Creta Exterior - White" />
      <Select label="Type" value={mediaType} onChange={(e) => setMediaType(e.target.value as MediaType)}>
        <option value="IMAGE">Image</option>
        <option value="VIDEO">Video</option>
        <option value="DOCUMENT">Document (brochure)</option>
      </Select>
      <Input label="Car Model (optional)" value={carModel} onChange={(e) => setCarModel(e.target.value)} placeholder="Creta" />
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
      <Button type="button" isLoading={uploadMedia.isPending} disabled={!file || !label} onClick={handleSubmit} className="w-fit">
        Upload
      </Button>
    </div>
  );
}

export function MediaLibraryPage() {
  const [showUpload, setShowUpload] = useState(false);
  const { data: assets, isLoading } = useMediaAssets();
  const deleteMedia = useDeleteMedia();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Media Library</h1>
          <p className="text-sm text-gray-500">Car photos, videos, and brochures the chatbot and campaigns can send to leads.</p>
        </div>
        <Button onClick={() => setShowUpload(true)}>+ Upload</Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {assets?.map((asset) => (
            <div key={asset.id} className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-3">
              {asset.mediaType === "IMAGE" ? (
                <img src={asset.cloudinaryUrl} alt={asset.label} className="h-32 w-full rounded object-cover" />
              ) : asset.mediaType === "VIDEO" ? (
                <video src={asset.cloudinaryUrl} className="h-32 w-full rounded object-cover" controls />
              ) : (
                <div className="flex h-32 w-full items-center justify-center rounded bg-gray-100 text-xs text-gray-500">Document</div>
              )}
              <p className="truncate text-sm font-medium text-gray-900">{asset.label}</p>
              {asset.carModel && <p className="text-xs text-gray-500">{asset.carModel}</p>}
              <Button variant="danger" onClick={() => deleteMedia.mutate(asset.id)}>
                Delete
              </Button>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showUpload} onClose={() => setShowUpload(false)} title="Upload Media">
        <UploadMediaForm onDone={() => setShowUpload(false)} />
      </Modal>
    </div>
  );
}
