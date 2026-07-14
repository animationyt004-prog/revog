"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { authedFetch } from "@/lib/auth-store";
import { cn, formatPrice } from "@/lib/format";

interface Customer {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  createdAt: string;
  orderCount: number;
  lifetimeValue: number;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[] | null>(null);

  useEffect(() => {
    authedFetch("/admin/customers")
      .then((r) => (r.ok ? r.json() : []))
      .then(setCustomers)
      .catch(() => setCustomers([]));
  }, []);

  if (customers === null) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 size={26} className="animate-spin text-volt" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="display text-3xl sm:text-4xl">
        Customers<span className="text-volt">.</span>{" "}
        <span className="text-base text-paper-dim">({customers.length})</span>
      </h1>

      <div className="mt-6 overflow-x-auto border border-paper/10">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="display border-b border-paper/15 bg-ink-2 text-left text-xs tracking-widest text-paper-dim">
              <th className="px-4 py-3 font-normal">EMAIL</th>
              <th className="px-4 py-3 font-normal">JOINED</th>
              <th className="px-4 py-3 font-normal">ROLE</th>
              <th className="px-4 py-3 text-right font-normal">ORDERS</th>
              <th className="px-4 py-3 text-right font-normal">LIFETIME VALUE</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-paper/5 last:border-0 hover:bg-ink-2">
                <td className="px-4 py-3">
                  <p className="font-medium">{c.email}</p>
                  {c.name && <p className="text-xs text-paper-dim">{c.name}</p>}
                </td>
                <td className="px-4 py-3 text-xs text-paper-dim">
                  {new Date(c.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "display border px-1.5 py-0.5 text-[10px]",
                      c.role === "ADMIN"
                        ? "border-volt/40 bg-volt/10 text-volt"
                        : "border-paper/20 text-paper-dim",
                    )}
                  >
                    {c.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">{c.orderCount}</td>
                <td className="px-4 py-3 text-right font-semibold">
                  {formatPrice(c.lifetimeValue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
