"use client";

/** Minimal typed wrapper around Razorpay's checkout.js modal. */

export interface RazorpaySession {
  keyId: string;
  razorpayOrderId: string;
  amount: number; // paise
  currency: string;
}

export interface RazorpaySuccess {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  prefill?: { email?: string; contact?: string; name?: string };
  theme?: { color?: string };
  handler: (response: RazorpaySuccess) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: "payment.failed", cb: (resp: { error: { description?: string } }) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  scriptPromise ??= new Promise((resolve, reject) => {
    const el = document.createElement("script");
    el.src = "https://checkout.razorpay.com/v1/checkout.js";
    el.onload = () => resolve();
    el.onerror = () => {
      scriptPromise = null;
      reject(new Error("Could not load the payment window. Check your connection."));
    };
    document.body.appendChild(el);
  });
  return scriptPromise;
}

export type PaymentOutcome =
  | { kind: "success"; payload: RazorpaySuccess }
  | { kind: "dismissed" }
  | { kind: "failed"; reason: string };

/** Opens the modal and resolves with whatever the customer did. */
export async function openRazorpay(
  session: RazorpaySession,
  prefill: { email?: string; contact?: string; name?: string },
): Promise<PaymentOutcome> {
  await loadScript();
  if (!window.Razorpay) throw new Error("Payment window unavailable.");

  return new Promise((resolve) => {
    let settled = false;
    const settle = (outcome: PaymentOutcome) => {
      if (!settled) {
        settled = true;
        resolve(outcome);
      }
    };

    const rzp = new window.Razorpay!({
      key: session.keyId,
      order_id: session.razorpayOrderId,
      amount: session.amount,
      currency: session.currency,
      name: "REVOG",
      description: "REVOG order",
      prefill,
      theme: { color: "#4d7c0f" },
      handler: (response) => settle({ kind: "success", payload: response }),
      modal: { ondismiss: () => settle({ kind: "dismissed" }) },
    });
    rzp.on("payment.failed", (resp) =>
      settle({ kind: "failed", reason: resp.error?.description ?? "Payment failed" }),
    );
    rzp.open();
  });
}
