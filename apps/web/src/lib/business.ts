/**
 * Single source of truth for public business details shown across the site
 * (contact page, policies, footer). Update the values marked TODO with the
 * real ones — payment gateways (Razorpay) and Google Ads both require genuine,
 * reachable contact information and a real business address.
 */
export const BUSINESS = {
  name: "REVOG",
  /** Legal/registered name, if different from the brand. */
  legalName: "REVOG",

  // TODO: replace with the real support inbox you actually monitor.
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@revog.in",

  /** Digits only, with country code — used for tel: and wa.me links. */
  // TODO: replace with the real WhatsApp/support number.
  phone: process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? "919999999999",

  /** Human-readable support hours. */
  hours: "Monday to Saturday, 10:00 AM – 7:00 PM IST",

  // TODO: replace with the real registered business address.
  address: {
    line1: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS ?? "Address to be updated",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  },

  /** Order/refund service levels quoted in the policies. */
  policy: {
    returnWindowDays: 7,
    dispatchDays: "1–2 business days",
    deliveryDays: "3–7 business days",
    freeShippingOver: 999, // rupees
    refundDays: "5–7 business days",
  },
} as const;

/** True when the contact details are still placeholders. */
export const CONTACT_INCOMPLETE =
  BUSINESS.phone === "919999999999" || BUSINESS.address.line1 === "Address to be updated";

export const whatsappLink = (message = "Hi REVOG! I have a question.") =>
  `https://wa.me/${BUSINESS.phone}?text=${encodeURIComponent(message)}`;

export const formattedPhone = () => {
  const p = BUSINESS.phone;
  return p.startsWith("91") ? `+91 ${p.slice(2)}` : `+${p}`;
};

export const formattedAddress = () =>
  [BUSINESS.address.line1, BUSINESS.address.city, BUSINESS.address.state, BUSINESS.address.pincode, BUSINESS.address.country]
    .filter(Boolean)
    .join(", ");
