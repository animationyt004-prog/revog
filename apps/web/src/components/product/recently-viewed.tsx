"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/format";

const KEY = "revog:recently-viewed";
const MAX = 8;

interface ViewedItem {
  slug: string;
  name: string;
  image: string | null;
  price: number;
  mrp: number;
}

function readList(): ViewedItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as ViewedItem[];
  } catch {
    return [];
  }
}

/** Records the current product and shows the previous ones (not itself). */
export function RecentlyViewed({ current }: { current: ViewedItem }) {
  const [items, setItems] = useState<ViewedItem[]>([]);

  useEffect(() => {
    const previous = readList().filter((i) => i.slug !== current.slug);
    setItems(previous.slice(0, 6));
    localStorage.setItem(
      KEY,
      JSON.stringify([current, ...previous].slice(0, MAX)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- object prop from a
    // server component; keying on slug avoids effect loops if that changes
  }, [current.slug]);

  if (items.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6">
      <h2 className="display mb-5 text-3xl sm:text-4xl">
        Recently <span className="text-volt">Viewed</span>
      </h2>
      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={`/products/${item.slug}`}
            className="group w-36 shrink-0 sm:w-44"
          >
            <div className="relative aspect-[3/4] overflow-hidden bg-ink-2">
              {item.image && (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="176px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              )}
            </div>
            <p className="mt-1.5 truncate text-xs font-medium">{item.name}</p>
            <p className="text-xs">
              <span className="font-semibold">{formatPrice(item.price)}</span>{" "}
              {item.mrp > item.price && (
                <span className="text-paper-dim line-through">{formatPrice(item.mrp)}</span>
              )}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
