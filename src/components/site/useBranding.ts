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
 * Public-page branding.
 *
 * The business name shown on every public page (home, policies, contact,
 * login, register) is always BUSINESS.name, so it matches the business name
 * and address in the policies — payment-gateway reviewers check that these
 * agree. The admin "Branding" brand name / logo are intentionally NOT used here
 * (they are still used inside the dashboard and admin panel). Support email and
 * WhatsApp number do come from the admin settings.
 */
export function useBranding() {
  const data = useLoaderData({ from: "__root__" }) as RootBranding | undefined;

  const waDigits = (data?.whatsapp_number ?? "").replace(/[^0-9]/g, "") || BUSINESS.whatsappDigits;

  return {
    name: BUSINESS.name,
    logoUrl: "",
    email: (data?.support_email ?? "").trim(),
    whatsappUrl: `https://wa.me/${waDigits}`,
    groupUrl: (data?.whatsapp_group_url ?? "").trim(),
  };
}
