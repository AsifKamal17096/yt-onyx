"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/cn";

export type GalleryImage = {
  id: string;
  src: string;
  thumb: string;
  alt: string;
  width: number;
  height: number;
  blurDataUrl: string;
};

/**
 * Product gallery: thumbnails, hover-to-magnify on pointer devices and a
 * full-screen lightbox on click or tap.
 */
export function ProductGallery({
  images,
  productName,
}: {
  images: GalleryImage[];
  productName: string;
}) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const [zooming, setZooming] = useState(false);

  const active = images[index];
  const count = images.length;

  const step = (delta: number) =>
    setIndex((current) => (current + delta + count) % count);

  // Arrow keys and Escape drive the lightbox.
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(false);
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightbox, count]);

  if (!active) {
    return (
      <div className="flex aspect-square items-center justify-center bg-cream-dim text-xs uppercase tracking-[0.2em] text-muted">
        Photography coming soon
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col-reverse gap-4 lg:flex-row">
        {count > 1 ? (
          <ul className="flex gap-3 overflow-x-auto lg:flex-col lg:overflow-visible">
            {images.map((image, position) => (
              <li key={image.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setIndex(position)}
                  aria-label={`Show image ${position + 1} of ${count}`}
                  aria-current={position === index}
                  className={cn(
                    "relative block h-20 w-20 overflow-hidden border transition-colors",
                    position === index
                      ? "border-ink"
                      : "border-line hover:border-line-strong",
                  )}
                >
                  <Image
                    src={image.thumb}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="relative flex-1">
          <div
            className="group relative aspect-square w-full overflow-hidden bg-cream-dim"
            onMouseEnter={() => setZooming(true)}
            onMouseLeave={() => {
              setZooming(false);
              setOrigin("50% 50%");
            }}
            onMouseMove={(event) => {
              const bounds = event.currentTarget.getBoundingClientRect();
              const x = ((event.clientX - bounds.left) / bounds.width) * 100;
              const y = ((event.clientY - bounds.top) / bounds.height) * 100;
              setOrigin(`${x}% ${y}%`);
            }}
          >
            <Image
              key={active.id}
              src={active.src}
              alt={active.alt || productName}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              placeholder={active.blurDataUrl ? "blur" : undefined}
              blurDataURL={active.blurDataUrl || undefined}
              className="object-cover transition-transform duration-500 ease-[var(--ease-brand)] motion-reduce:transform-none"
              style={{
                transformOrigin: origin,
                transform: zooming ? "scale(1.9)" : "scale(1)",
              }}
            />

            <button
              type="button"
              onClick={() => setLightbox(true)}
              aria-label="Open full-screen view"
              className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center bg-cream/90 text-ink opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-visible:opacity-100 max-lg:opacity-100"
            >
              <ZoomIn className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>

          {count > 1 ? (
            <p className="mt-3 text-center text-[0.66rem] uppercase tracking-[0.18em] text-muted lg:hidden">
              {index + 1} / {count}
            </p>
          ) : null}
        </div>
      </div>

      {lightbox ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${productName} — enlarged image`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/95 p-4 animate-fade-in"
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            onClick={() => setLightbox(false)}
            aria-label="Close"
            className="absolute right-5 top-5 p-2 text-cream/70 transition-colors hover:text-cream"
          >
            <X className="h-6 w-6" strokeWidth={1.5} />
          </button>

          {count > 1 ? (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  step(-1);
                }}
                aria-label="Previous image"
                className="absolute left-3 p-3 text-cream/70 transition-colors hover:text-cream sm:left-8"
              >
                <ChevronLeft className="h-7 w-7" strokeWidth={1.2} />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  step(1);
                }}
                aria-label="Next image"
                className="absolute right-3 p-3 text-cream/70 transition-colors hover:text-cream sm:right-8"
              >
                <ChevronRight className="h-7 w-7" strokeWidth={1.2} />
              </button>
            </>
          ) : null}

          <div
            className="relative h-full max-h-[85vh] w-full max-w-4xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={active.src}
              alt={active.alt || productName}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
