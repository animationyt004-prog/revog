"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/format";
import type { ProductImageData } from "@/lib/types";

/**
 * Full-screen image viewer. A saree is bought on its border, zari and weave,
 * and none of that reads at grid size — so tapping the photo opens it here at
 * full width with a zoom step.
 *
 * Zoom is a scroll container plus a width toggle rather than native pinch:
 * pinch inside a page is unreliable across the Android WebViews our buyers
 * arrive in, while scrolling an oversized image works everywhere.
 */
export function ProductLightbox({
  images,
  index,
  onIndex,
  onClose,
  alt,
}: {
  images: ProductImageData[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
  alt: string;
}) {
  const [zoomed, setZoomed] = useState(false);
  const image = images[index];

  // Escape to close, arrows to move between shots.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && index < images.length - 1) onIndex(index + 1);
      if (e.key === "ArrowLeft" && index > 0) onIndex(index - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, images.length, onClose, onIndex]);

  // Hold the page still behind the overlay.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // A new shot always opens un-zoomed.
  useEffect(() => setZoomed(false), [index]);

  if (!image) return null;

  // z-80 sits above the size guide (60) and cart drawer (70); only the welcome
  // popup (100) outranks it.
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Product photos"
      className="fixed inset-0 z-[80] flex flex-col bg-ink"
    >
      <div className="flex items-center justify-between border-b border-paper/10 px-4 py-3">
        <span className="text-xs text-paper-dim">
          {index + 1} / {images.length}
        </span>
        <button
          onClick={onClose}
          aria-label="Close photos"
          className="grid h-11 w-11 place-items-center text-paper transition-colors hover:text-volt"
        >
          <X size={22} />
        </button>
      </div>

      <div className={cn("flex-1", zoomed ? "overflow-auto" : "grid place-items-center overflow-hidden")}>
        <button
          type="button"
          onClick={() => setZoomed((z) => !z)}
          aria-label={zoomed ? "Zoom out" : "Zoom in"}
          className={cn("block", zoomed ? "w-[250%] max-w-none" : "w-full")}
        >
          <Image
            src={image.url}
            alt={alt}
            width={1200}
            height={1600}
            sizes="100vw"
            className="h-auto w-full object-contain"
          />
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-paper/10 px-4 py-3">
        <button
          onClick={() => onIndex(Math.max(0, index - 1))}
          disabled={index === 0}
          aria-label="Previous photo"
          className="grid h-11 w-11 shrink-0 place-items-center border border-paper/20 text-paper disabled:opacity-30"
        >
          <ChevronLeft size={20} />
        </button>
        <p className="text-xs text-paper-dim">
          {zoomed ? "Tap the photo to fit · drag to pan" : "Tap the photo to zoom"}
        </p>
        <button
          onClick={() => onIndex(Math.min(images.length - 1, index + 1))}
          disabled={index === images.length - 1}
          aria-label="Next photo"
          className="grid h-11 w-11 shrink-0 place-items-center border border-paper/20 text-paper disabled:opacity-30"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
