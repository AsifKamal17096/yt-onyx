"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, UploadCloud } from "lucide-react";
import { useToast } from "@/components/admin/Toast";
import { downscaleForUpload } from "@/lib/downscale-image";
import { CSRF_FIELD } from "@/lib/csrf-field";
import { cn } from "@/lib/cn";

/**
 * One-image uploader for a category image, the hero photograph or a
 * replacement logo. Uploading replaces whatever was there before.
 */
export function SingleImageUpload({
  target,
  ownerId,
  currentUrl,
  csrf,
  label,
  hint,
  onClear,
  clearField,
  aspect = "aspect-[16/9]",
}: {
  target: "category" | "hero" | "logo";
  ownerId?: string;
  currentUrl: string | null;
  csrf: string;
  label: string;
  hint?: string;
  onClear?: (formData: FormData) => void;
  clearField?: string;
  aspect?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = async (original: File) => {
    setBusy(true);
    setProgress(0);

    // Resized in the browser first; serverless hosts cap request bodies.
    const file = await downscaleForUpload(original);

    const form = new FormData();
    form.append(CSRF_FIELD, csrf);
    form.append("target", target);
    if (target === "category" && ownerId) form.append("categoryId", ownerId);
    form.append("files", file);

    const request = new XMLHttpRequest();
    request.open("POST", "/api/admin/upload");

    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        setProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    request.addEventListener("load", () => {
      setBusy(false);
      try {
        const data = JSON.parse(request.responseText);
        if (!data.ok) {
          toast(data.rejected?.[0]?.reason ?? "Upload failed.", "error");
          return;
        }
        toast("Image updated.");
        router.refresh();
      } catch {
        toast("Upload failed.", "error");
      }
    });

    request.addEventListener("error", () => {
      setBusy(false);
      toast("Upload failed — check your connection.", "error");
    });

    request.send(form);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[0.66rem] font-medium uppercase tracking-[0.16em] text-muted">
        {label}
      </span>

      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const file = event.dataTransfer.files?.[0];
          if (file) void upload(file);
        }}
        className={cn(
          "relative flex items-center justify-center overflow-hidden border border-dashed border-line bg-white",
          aspect,
        )}
      >
        {currentUrl ? (
          <Image
            src={currentUrl}
            alt=""
            fill
            sizes="400px"
            className={cn(
              "object-cover",
              target === "logo" && "object-contain p-4",
            )}
          />
        ) : null}

        {busy ? (
          <div className="relative z-10 flex items-center gap-2 bg-cream/90 px-4 py-2 text-xs text-ink">
            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.8} />
            {progress}%
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={cn(
              "relative z-10 flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-[0.14em] transition-colors",
              currentUrl
                ? "bg-ink/80 text-cream hover:bg-ink"
                : "text-muted hover:text-ink",
            )}
          >
            <UploadCloud className="h-4 w-4" strokeWidth={1.5} />
            {currentUrl ? "Replace" : "Upload"}
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
            event.target.value = "";
          }}
        />
      </div>

      <div className="flex items-start justify-between gap-3">
        {hint ? (
          <p className="text-xs leading-relaxed text-muted">{hint}</p>
        ) : (
          <span />
        )}
        {currentUrl && onClear && clearField ? (
          <button
            type="button"
            onClick={() => {
              const form = new FormData();
              form.append(CSRF_FIELD, csrf);
              form.append("field", clearField);
              onClear(form);
              toast("Image removed.");
              router.refresh();
            }}
            className="inline-flex shrink-0 items-center gap-1.5 text-xs text-muted transition-colors hover:text-red-700"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
            Remove
          </button>
        ) : null}
      </div>
    </div>
  );
}
