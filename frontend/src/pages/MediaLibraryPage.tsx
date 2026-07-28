import { useRef, useState } from "react";
import type { DragEvent } from "react";
import { FileText, Image as ImageIcon, Search, Trash2, UploadCloud, Video, X } from "lucide-react";
import { useMediaAssets, useUploadMedia, useDeleteMedia } from "../hooks/useMedia";
import { Button } from "../components/common/Button";
import { Input, Select } from "../components/common/Input";
import { Modal } from "../components/common/Modal";
import { Card } from "../components/common/Card";
import type { MediaAsset, MediaType } from "../api/media.api";
import { useCanWrite } from "../hooks/usePermission";

const MAX_FILE_BYTES = 50 * 1024 * 1024; // must match backend's multer limit

const ACCEPT_BY_TYPE: Record<MediaType, string> = {
  IMAGE: "image/*",
  VIDEO: "video/*",
  DOCUMENT: ".pdf,.doc,.docx,.ppt,.pptx",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileDropzone({
  file,
  mediaType,
  error,
  onSelect,
}: {
  file: File | null;
  mediaType: MediaType;
  error: string | null;
  onSelect: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    const picked = files?.[0] ?? null;
    if (picked && picked.size > MAX_FILE_BYTES) {
      onSelect(null);
      return;
    }
    onSelect(picked);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  if (file) {
    const isImage = file.type.startsWith("image/");
    return (
      <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
        {isImage ? (
          <img src={URL.createObjectURL(file)} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
        ) : (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            {mediaType === "VIDEO" ? <Video size={20} /> : <FileText size={20} />}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900">{file.name}</p>
          <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
        </div>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600"
          aria-label="Remove file"
        >
          <X size={15} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
          isDragging ? "border-primary-400 bg-primary-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
        }`}
      >
        <UploadCloud size={22} className="text-gray-400" />
        <p className="text-sm text-gray-600">
          <span className="font-medium text-primary-600">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-gray-400">
          {mediaType === "IMAGE" ? "PNG, JPG up to 50MB" : mediaType === "VIDEO" ? "MP4, MOV up to 50MB" : "PDF, DOC up to 50MB"}
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_BY_TYPE[mediaType]}
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function UploadMediaForm({ onDone }: { onDone: () => void }) {
  const uploadMedia = useUploadMedia();
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [mediaType, setMediaType] = useState<MediaType>("IMAGE");
  const [carModel, setCarModel] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSelect = (picked: File | null) => {
    setSubmitError(null);
    if (picked === null) {
      setFile(null);
      return;
    }
    if (picked.size > MAX_FILE_BYTES) {
      setFileError(`"${picked.name}" is ${formatBytes(picked.size)} — the limit is 50MB.`);
      setFile(null);
      return;
    }
    setFileError(null);
    setFile(picked);
  };

  const handleSubmit = async () => {
    if (!file || !label) return;
    setSubmitError(null);
    try {
      await uploadMedia.mutateAsync({ file, label, mediaType, carModel: carModel || undefined });
      onDone();
    } catch {
      setSubmitError("Upload failed — check your connection and try again.");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Select
        label="Type"
        value={mediaType}
        onChange={(e) => {
          setMediaType(e.target.value as MediaType);
          handleSelect(null);
        }}
      >
        <option value="IMAGE">Image</option>
        <option value="VIDEO">Video</option>
        <option value="DOCUMENT">Document (brochure)</option>
      </Select>
      <FileDropzone file={file} mediaType={mediaType} error={fileError} onSelect={handleSelect} />
      <Input label="Label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Creta Exterior - White" />
      <Input label="Car Model (optional)" value={carModel} onChange={(e) => setCarModel(e.target.value)} placeholder="Creta" />
      {submitError && <p className="text-sm text-red-600">{submitError}</p>}
      <Button
        type="button"
        isLoading={uploadMedia.isPending}
        disabled={!file || !label}
        onClick={handleSubmit}
        icon={<UploadCloud size={15} />}
        className="w-fit"
      >
        Upload
      </Button>
    </div>
  );
}

function MediaCard({ asset, onDelete, isDeleting, canDelete }: { asset: MediaAsset; onDelete: () => void; isDeleting: boolean; canDelete: boolean }) {
  return (
    <Card padded={false} className="group relative overflow-hidden">
      {canDelete && (
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          aria-label={`Delete ${asset.label}`}
          className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-red-600 group-hover:opacity-100 disabled:opacity-50"
        >
          <Trash2 size={14} />
        </button>
      )}
      {asset.mediaType === "IMAGE" ? (
        <img src={asset.cloudinaryUrl} alt={asset.label} className="h-32 w-full object-cover" />
      ) : asset.mediaType === "VIDEO" ? (
        <video src={asset.cloudinaryUrl} className="h-32 w-full object-cover" controls />
      ) : (
        <a
          href={asset.cloudinaryUrl}
          target="_blank"
          rel="noreferrer"
          className="flex h-32 w-full items-center justify-center bg-gray-50 text-gray-400 hover:bg-gray-100"
        >
          <FileText size={28} />
        </a>
      )}
      <div className="flex flex-col gap-0.5 p-3">
        <p className="truncate text-sm font-medium text-gray-900">{asset.label}</p>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {asset.carModel && <span>{asset.carModel}</span>}
          <span className="ml-auto">{new Date(asset.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
        </div>
      </div>
    </Card>
  );
}

export function MediaLibraryPage() {
  const [showUpload, setShowUpload] = useState(false);
  const [mediaType, setMediaType] = useState<MediaType | "">("");
  const [carModel, setCarModel] = useState("");
  const { data: assets, isLoading } = useMediaAssets({
    mediaType: mediaType || undefined,
    carModel: carModel || undefined,
  });
  const deleteMedia = useDeleteMedia();
  const canWrite = useCanWrite("media-library");

  const handleDelete = (assetId: string, label: string) => {
    if (!window.confirm(`Delete "${label}"? This removes it from Cloudinary and any campaigns using it.`)) return;
    deleteMedia.mutate(assetId);
  };

  return (
    <div className="mx-auto w-full max-w-7xl flex flex-col gap-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0B0F19] px-6 py-8 shadow-2xl shadow-primary-900/10 ring-1 ring-slate-900/5 dark:bg-slate-950 dark:ring-white/10 sm:px-9 sm:py-9">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h1v1H0V0zm23 23h1v1h-1v-1z' fill='white'/%3E%3C/svg%3E\")", backgroundSize: "24px 24px" }}
        />
        <div className="pointer-events-none absolute -left-20 -top-20 h-[300px] w-[300px] rounded-full bg-primary-500/10 blur-[80px]" />

        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center rounded-full bg-primary-500/10 px-2.5 py-0.5 text-xs sm:text-sm font-medium text-primary-300 ring-1 ring-inset ring-primary-500/20 backdrop-blur-md">
              Assets Hub
            </span>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Media Library
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-300">
              Manage car photos, videos, and brochures for your chatbot and campaigns.
            </p>
          </div>
            {canWrite && (
              <div className="shrink-0">
                <Button
                  onClick={() => setShowUpload(true)}
                  icon={<UploadCloud size={15} />}
                >
                  Upload Media
                </Button>
              </div>
            )}
          </div>
        </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={mediaType}
          onChange={(e) => setMediaType(e.target.value as MediaType | "")}
          className="w-40"
          aria-label="Filter by type"
        >
          <option value="">All types</option>
          <option value="IMAGE">Images</option>
          <option value="VIDEO">Videos</option>
          <option value="DOCUMENT">Documents</option>
        </Select>
        <div className="relative w-56">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            value={carModel}
            onChange={(e) => setCarModel(e.target.value)}
            placeholder="Search by car model"
            className="pl-8"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : assets && assets.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {assets.map((asset) => (
            <MediaCard
              key={asset.id}
              asset={asset}
              onDelete={() => handleDelete(asset.id, asset.label)}
              isDeleting={deleteMedia.isPending && deleteMedia.variables === asset.id}
              canDelete={canWrite}
            />
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center gap-2 py-12 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
            <ImageIcon size={20} />
          </span>
          <p className="text-sm font-medium text-gray-900">No media yet</p>
          <p className="max-w-xs text-xs text-gray-500">
            Upload car photos, walkaround videos, or brochures so your team and AI agents can share them with leads.
          </p>
        </Card>
      )}

      <Modal isOpen={showUpload} onClose={() => setShowUpload(false)} title="Upload Media">
        <UploadMediaForm onDone={() => setShowUpload(false)} />
      </Modal>
    </div>
  );
}
