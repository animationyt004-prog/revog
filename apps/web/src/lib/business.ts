/**
 * Single source of truth for public business details shown across the site
 * (contact page, policies, footer). Update the values marked TODO with the
 * real ones. Payment gateways (Razorpay) and Google Ads both require genuine,
 * reachable contact information and a real business address.
 */
export const BUSINESS = {
  name: "HyraLuxe",
  /**
   * Legal/registered name, if different from the brand.
   *
   * This is a legal fact, not a design choice: it goes into the Organization
   * JSON-LD Google reads and onto the policy pages. Renaming the storefront
   * does not rename the registered entity, so this must be whatever the GST /
   * incorporation paperwork actually says. It stays unset until the registered
   * entity is confirmed, so the storefront does not publish a guessed legal name.
   */
  legalName: process.env.NEXT_PUBLIC_LEGAL_BUSINESS_NAME?.trim() || null,

  // On the domain we actually own. The old default was support@hyrafashion.in
  // - a different domain (no "s", .in not .com), so anything a customer sent
  // there went nowhere. This address still needs a real mailbox or a
  // forwarding rule behind it before it can be relied on.
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@hyrafashions.com",

  /** Digits only, with country code - used for tel: and wa.me links. */
  phone: process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? "919924575799",

  /** Human-readable support hours. */
  hours: "Monday to Saturday, 10:00 AM - 7:00 PM IST",

  /**
   * Public social profiles. Unset until the real handles are confirmed - the
   * same rule as legalName above. A footer icon pointing at a guessed or dead
   * profile costs more trust than a missing icon, and these URLs also go into
   * the Organization sameAs graph, where a wrong one misidentifies the brand
   * to Google. WhatsApp is not listed here: it is built from the support
   * phone, which is already real.
   */
  social: {
    instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM?.trim() || null,
    facebook: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK?.trim() || null,
    youtube: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE?.trim() || null,
  },

  // Set these to the real registered business address before requesting
  // Merchant Center review. Google checks that public website contact details
  // match the verified business information in Merchant Center.
  address: {
    line1: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS_LINE1 ?? "Rajhans Fabrizo",
    city: process.env.NEXT_PUBLIC_BUSINESS_CITY ?? "Surat",
    state: process.env.NEXT_PUBLIC_BUSINESS_STATE ?? "Gujarat",
    pincode: process.env.NEXT_PUBLIC_BUSINESS_PINCODE ?? "395010",
    country: "India",
  },

  /** Order/refund service levels quoted in the policies. */
  policy: {
    returnWindowDays: 7,
    dispatchDays: "1-2 business days",
    deliveryDays: "3-7 business days",
    freeShippingOver: 999, // rupees
    refundDays: "5-7 business days",
  },
} as const;

/** Phone and address arrive at different times, so they gate separately. A
 *  real number should be reachable even while the address is still pending. */
export const HAS_PHONE = BUSINESS.phone !== "919999999999";
export const HAS_LEGAL_NAME = Boolean(BUSINESS.legalName);
export const HAS_ADDRESS = Boolean(
  BUSINESS.address.line1 &&
  BUSINESS.address.city &&
  BUSINESS.address.state &&
  BUSINESS.address.pincode,
);

/** Numbers that look configured but reach nobody. A wa.me link built on one
 *  of these opens an empty chat, so every WhatsApp entry point gates on this. */
const PLACEHOLDER_PHONES = new Set([
  "919999999999",
  "9999999999",
  "911234567890",
  "1234567890",
]);

export const HAS_WHATSAPP =
  HAS_PHONE && !PLACEHOLDER_PHONES.has(BUSINESS.phone);

export const whatsappLink = (message = "Hi HyraLuxe! I have a question.") =>
  `https://wa.me/${BUSINESS.phone}?text=${encodeURIComponent(message)}`;

/** Configured social profiles only, in display order. Empty until the handles
 *  are set, which is why every caller must handle a zero-length list. */
export const socialProfiles = () =>
  (
    [
      { key: "instagram", label: "Instagram", href: BUSINESS.social.instagram },
      { key: "facebook", label: "Facebook", href: BUSINESS.social.facebook },
      { key: "youtube", label: "YouTube", href: BUSINESS.social.youtube },
    ] as const
  ).filter((s): s is typeof s & { href: string } => Boolean(s.href));

export const formattedPhone = () => {
  const p = BUSINESS.phone;
  return p.startsWith("91") ? `+91 ${p.slice(2)}` : `+${p}`;
};

export const formattedAddress = () =>
  [
    BUSINESS.address.line1,
    BUSINESS.address.city,
    BUSINESS.address.state,
    BUSINESS.address.pincode,
    BUSINESS.address.country,
  ]
    .filter(Boolean)
    .join(", ");

export const merchantReturnPolicyLd = {
  "@type": "MerchantReturnPolicy",
  applicableCountry: "IN",
  returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
  merchantReturnDays: BUSINESS.policy.returnWindowDays,
  returnMethod: "https://schema.org/ReturnByMail",
  returnFees: "https://schema.org/ReturnShippingFees",
  customerRemorseReturnFees: "https://schema.org/ReturnShippingFees",
  itemDefectReturnFees: "https://schema.org/FreeReturn",
} as const;

export const organizationLd = () => {
  const sameAs = socialProfiles().map((s) => s.href);

  return {
    "@type": "Organization",
    name: BUSINESS.name,
    ...(BUSINESS.legalName ? { legalName: BUSINESS.legalName } : {}),
    // sameAs is how Google ties the storefront to the brand's social profiles;
    // omitted entirely rather than sent empty when no handles are configured.
    ...(sameAs.length ? { sameAs } : {}),
    email: BUSINESS.email,
    ...(HAS_PHONE ? { telephone: formattedPhone() } : {}),
    ...(HAS_ADDRESS
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: BUSINESS.address.line1,
            addressLocality: BUSINESS.address.city,
            addressRegion: BUSINESS.address.state,
            postalCode: BUSINESS.address.pincode,
            addressCountry: "IN",
          },
        }
      : {}),
  };
};
