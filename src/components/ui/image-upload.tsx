"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface ImageUploadProps {
  value: string[];
  onChange: (url: string) => void;
  onRemove: (url: string) => void;
  maxFiles?: number;
  folder?: string;
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  maxFiles = 5,
  folder = "el-huyaam/products",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = maxFiles - value.length;
    const toUpload = Array.from(files).slice(0, remaining);

    setUploading(true);
    try {
      await Promise.all(
        toUpload.map(async (file) => {
          const form = new FormData();
          form.append("file", file);
          form.append("folder", folder);

          const res = await fetch("/api/upload", { method: "POST", body: form });
          const data = await res.json();
          if (!data.success) throw new Error(data.error ?? "Upload failed");
          onChange(data.data.url);
        })
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const canAdd = value.length < maxFiles;

  return (
    <div className="space-y-3">
      {/* Preview grid */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {value.map((url, idx) => (
            <div
              key={url}
              className="relative w-28 h-28 border border-brand-200 bg-brand-50 overflow-hidden group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Image ${idx + 1}`} className="object-cover w-full h-full" />
              <button
                type="button"
                onClick={() => onRemove(url)}
                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash className="w-3 h-3" />
              </button>
              {idx === 0 && (
                <span className="absolute bottom-0 left-0 right-0 bg-brand-900/60 text-white text-[9px] uppercase tracking-widest text-center py-0.5">
                  Principal
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {canAdd && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            multiple={maxFiles > 1}
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-full border-2 border-dashed border-brand-200 p-6 flex flex-col items-center justify-center gap-2 text-brand-400 hover:bg-brand-50 hover:border-brand-400 hover:text-brand-600 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-xs uppercase tracking-widest font-medium">Téléchargement...</span>
              </>
            ) : (
              <>
                <ImagePlus className="w-6 h-6" />
                <span className="text-xs uppercase tracking-widest font-medium">
                  Choisir {maxFiles > 1 ? "des images" : "une image"}
                </span>
                <span className="text-[10px] text-brand-300">
                  {value.length}/{maxFiles} · JPEG, PNG, WebP · max 10 Mo
                </span>
              </>
            )}
          </button>
        </>
      )}

      {!canAdd && (
        <p className="text-xs text-brand-400">Maximum {maxFiles} images atteint.</p>
      )}
    </div>
  );
}
