"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

/** Measurements in inches, garment-flat. Rows: size, chest, length, shoulder. */
const CHART: Record<string, [string, number, number, number][]> = {
  top: [
    ["S", 40, 27, 19],
    ["M", 42, 28, 20],
    ["L", 44, 29, 21],
    ["XL", 46, 30, 22],
    ["XXL", 48, 31, 23],
  ],
  bottom: [
    ["S", 30, 39, 11],
    ["M", 32, 40, 11.5],
    ["L", 34, 41, 12],
    ["XL", 36, 42, 12.5],
    ["XXL", 38, 43, 13],
  ],
};

export function SizeGuideModal({
  open,
  onClose,
  kind = "top",
}: {
  open: boolean;
  onClose: () => void;
  kind?: "top" | "bottom";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const rows = CHART[kind];
  const headers =
    kind === "top"
      ? ["Size", "Chest", "Length", "Shoulder"]
      : ["Size", "Waist", "Length", "Rise"];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] grid place-items-center bg-paper/40 p-4 backdrop-blur-sm"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Size guide"
        >
          <motion.div
            initial={{ scale: 0.95, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 16 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md border border-paper/15 bg-ink p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="display text-2xl">
                Size <span className="text-volt">Guide</span>
              </h2>
              <button onClick={onClose} aria-label="Close size guide" className="p-1 hover:text-blood">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-paper/20 text-left">
                    {headers.map((h) => (
                      <th key={h} className="display py-2 pr-4 text-base font-normal">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(([size, a, b, c]) => (
                    <tr key={size} className="border-b border-paper/10">
                      <td className="display py-2.5 pr-4 text-base">{size}</td>
                      <td className="py-2.5 pr-4 text-paper-dim">{a}&quot;</td>
                      <td className="py-2.5 pr-4 text-paper-dim">{b}&quot;</td>
                      <td className="py-2.5 pr-4 text-paper-dim">{c}&quot;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-paper-dim">
              Measurements are garment-flat in inches; expect ±0.5&quot;.
              Between sizes? Size up for the intended oversized drape.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
