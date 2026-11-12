/**
 * Single source of truth for public business details.
 * Every policy page, the footer and the contact page read from here, so a
 * change (new address, new number) only has to be made in one place.
 */
export const BUSINESS = {
  name: "Noorix Digital Lab",
  domain: "noorixdigitallab.online",
  url: "https://noorixdigitallab.online",
  phoneDisplay: "0315 4429417",
  phoneIntl: "+923154429417",
  whatsappDigits: "923154429417",
  addressLines: ["3rd Floor, H Mall", "Shalimar Linked Road", "Lahore, Pakistan"],
  addressOneLine: "3rd Floor, H Mall, Shalimar Linked Road, Lahore, Pakistan",
  supportHours: "10:00 AM – 10:00 PM (PKT), every day",
  currency: "PKR",
  legalLastUpdated: "12 November 2026",
} as const;

export const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  BUSINESS.addressOneLine,
)}`;

export const POLICY_LINKS = [
  { to: "/privacy-policy", label: "Privacy Policy" },
  { to: "/terms-and-conditions", label: "Terms & Conditions" },
  { to: "/refund-policy", label: "Refund Policy" },
  { to: "/return-policy", label: "Return Policy" },
  { to: "/delivery-policy", label: "Digital Delivery / Service Policy" },
  { to: "/contact", label: "Contact & Business Address" },
] as const;
