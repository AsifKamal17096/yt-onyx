"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GripVertical,
  ImagePlus,
  Loader2,
  Star,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useToast } from "@/components/admin/Toast";
import { downscaleForUpload } from "@/lib/downscale-image";
import { CSRF_FIELD } from "@/lib/csrf-field";
import { cn } from "@/lib/cn";

export type ManagedImage = {
  id: string;
  url: string;
  thumbUrl: string;
  alt: string;
  isPrimary: boolean;
};

/**
 * Multi-image upload, reorder, set-primary and delete.
 *
 * Uploads go through XMLHttpRequest rather than fetch because only XHR
 * reports progress, which matters when the owner is sending 10MB photographs
 * from a phone. Reordering is drag-and-drop with a keyboard fallback.
 */
export function ImageManager({
  productId,
  images,
  csrf,
  onReorder,
  onDelete,
  onSetPrimary,
}: {
  productId: string;
  images: ManagedImage[];
  csrf: string;
  onReorder: (formData: FormData) => void;
  onDelete: (formData: FormData) => void;
  onSetPrimary: (formData: FormData) => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [order, setOrder] = useState<string[] | null>(null);

  const ordered = order
    ? (order
        .map((id) => images.find((image) => image.id === id))
        .filter(Boolean) as ManagedImage[])
    : images;

  const upload = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;

    setProgress(0);

    // Large photographs are resized in the browser first: serverless hosts
    // reject request bodies over a few megabytes.
    const prepared = await Promise.all(list.map(downscaleForUpload));

    const form = new FormData();
    form.append("productId", productId);
    form.append(CSRF_FIELD, csrf);
    for (const file of prepared) form.append("files", file);

    const request = new XMLHttpRequest();
    request.open("POST", "/api/admin/upload");

    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        setProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    request.addEventListener("load", () => {
      setProgress(null);
      try {
        const data = JSON.parse(request.responseText);
        if (!data.ok) {
          toast(
            data.error === "unauthorized"
              ? "Your session expired. Sign in again."
              : "Upload failed.",
            "error",
          );
          return;
        }
        if (data.uploaded > 0) {
          toast(
            `${data.uploaded} image${data.uploaded === 1 ? "" : "s"} uploaded.`,
          );
        }
        for (const item of data.rejected ?? []) {
          toast(`${item.name}: ${item.reason}`, "error");
        }
        setOrder(null);
        router.refresh();
      } catch {
        toast("Upload failed.", "error");
      }
    });

    request.addEventListener("error", () => {
      setProgress(null);
      toast("Upload failed — check your connection.", "error");
    });

    request.send(form);
  };

  const commitOrder = (ids: string[]) => {
    setOrder(ids);
    const form = new FormData();
    form.append(CSRF_FIELD, csrf);
    form.append("productId", productId);
    form.append("order", ids.join(","));
    onReorder(form);
  };

  const move = (id: string, direction: -1 | 1) => {
    const ids = ordered.map((image) => image.id);
    const from = ids.indexOf(id);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= ids.length) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]!);
    commitOrder(ids);
  };

  return (
    <div>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          if (event.dataTransfer.files?.length) void upload(event.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragOver ? "border-gold bg-gold/5" : "border-line bg-white",
        )}
      >
        {progress === null ? (
          <>
            <UploadCloud className="h-7 w-7 text-muted" strokeWidth={1.3} />
            <p className="mt-4 text-sm text-ink">
              Drag photographs here, or{" "}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="underline underline-offset-4 transition-colors hover:text-gold-deep"
              >
                choose files
              </button>
            </p>
            <p className="mt-2 text-xs text-muted">
              JPEG, PNG or WebP · up to 15MB each · resized and converted
              automatically
            </p>
          </>
        ) : (
          <div className="w-full max-w-xs">
            <div className="flex items-center justify-center gap-2 text-sm text-ink">
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.8} />
              Uploading… {progress}%
            </div>
            <div className="mt-3 h-1 w-full bg-cream-dim">
              <div
                className="h-full bg-gold transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(event) => {
            if (event.target.files) void upload(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {ordered.length === 0 ? (
        <p className="mt-4 flex items-center gap-2 text-xs text-muted">
          <ImagePlus className="h-3.5 w-3.5" strokeWidth={1.5} />
          No images yet. The first one you add becomes the main photograph.
        </p>
      ) : (
        <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {ordered.map((image, index) => (
            <li
              key={image.id}
              draggable
              onDragStart={() => setDragId(image.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                if (!dragId || dragId === image.id) return;
                const ids = ordered.map((item) => item.id);
                const from = ids.indexOf(dragId);
                const to = ids.indexOf(image.id);
                ids.splice(to, 0, ids.splice(from, 1)[0]!);
                setDragId(null);
                commitOrder(ids);
              }}
              className={cn(
                "group relative border bg-white",
                image.isPrimary ? "border-gold" : "border-line",
                dragId === image.id && "opacity-50",
              )}
            >
              <div className="relative aspect-square">
                <Image
                  src={image.thumbUrl}
                  alt={image.alt}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
                {image.isPrimary ? (
                  <span className="absolute left-2 top-2 bg-gold px-2 py-0.5 text-[0.58rem] uppercase tracking-[0.14em] text-ink">
                    Main
                  </span>
                ) : null}
                <GripVertical
                  className="absolute right-2 top-2 h-4 w-4 cursor-grab text-white opacity-0 drop-shadow transition-opacity group-hover:opacity-80"
                  strokeWidth={1.8}
                />
              </div>

              <div className="flex items-center justify-between gap-1 border-t border-line px-2 py-1.5">
                <div className="flex gap-0.5">
                  <button
                    type="button"
                    onClick={() => move(image.id, -1)}
                    disabled={index === 0}
                    aria-label="Move earlier"
                    className="px-1.5 py-1 text-xs text-muted transition-colors hover:text-ink disabled:opacity-30"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => move(image.id, 1)}
                    disabled={index === ordered.length - 1}
                    aria-label="Move later"
                    className="px-1.5 py-1 text-xs text-muted transition-colors hover:text-ink disabled:opacity-30"
                  >
                    →
                  </button>
                </div>

                <div className="flex gap-0.5">
                  {!image.isPrimary ? (
                    <button
                      type="button"
                      aria-label="Set as main image"
                      onClick={() => {
                        const form = new FormData();
                        form.append(CSRF_FIELD, csrf);
                        form.append("imageId", image.id);
                        onSetPrimary(form);
                        toast("Main image updated.");
                      }}
                      className="p-1 text-muted transition-colors hover:text-gold-deep"
                    >
                      <Star className="h-3.5 w-3.5" strokeWidth={1.6} />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    aria-label="Delete image"
                    onClick={() => {
                      const form = new FormData();
                      form.append(CSRF_FIELD, csrf);
                      form.append("imageId", image.id);
                      onDelete(form);
                      setOrder(null);
                      toast("Image deleted.");
                    }}
                    className="p-1 text-muted transition-colors hover:text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.6} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
