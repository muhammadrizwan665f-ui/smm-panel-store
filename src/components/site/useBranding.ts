import { useLoaderData } from "@tanstack/react-router";
import { BUSINESS } from "@/lib/business";

type RootBranding = {
  brand_name?: string;
  logo_url?: string;
  whatsapp_number?: string;
  whatsapp_group_url?: string;
  support_email?: string;
};

/**
 * Public-page branding. Brand name / logo / support email come from the admin
 * "Branding" settings (root loader); if the admin never changed the default
 * "SMM Panel" name we show the registered business name instead.
 */
export function useBranding() {
  const data = useLoaderData({ from: "__root__" }) as RootBranding | undefined;

  const rawName = (data?.brand_name ?? "").trim();
  const name = rawName && rawName !== "SMM Panel" ? rawName : BUSINESS.name;

  const waDigits = (data?.whatsapp_number ?? "").replace(/[^0-9]/g, "") || BUSINESS.whatsappDigits;

  return {
    name,
    logoUrl: (data?.logo_url ?? "").trim(),
    email: (data?.support_email ?? "").trim(),
    whatsappUrl: `https://wa.me/${waDigits}`,
    groupUrl: (data?.whatsapp_group_url ?? "").trim(),
  };
}
