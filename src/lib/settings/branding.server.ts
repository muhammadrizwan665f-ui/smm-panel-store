
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const BRANDING_KEYS = [
  "brand_name",
  "logo_url",
  "favicon_url",
  "whatsapp_number",
  "whatsapp_group_url",
  "support_email",
  "auto_refund_enabled",
  "theme",
] as const;

export type BrandingSettings = {
  brand_name: string;
  logo_url: string;
  favicon_url: string;
  whatsapp_number: string;
  whatsapp_group_url: string;
  support_email: string;
  auto_refund_enabled: boolean;
  theme: string;
};

export const BRANDING_DEFAULTS: BrandingSettings = {
  brand_name: "SMM Panel",
  logo_url: "",
  favicon_url: "",
  whatsapp_number: "",
  whatsapp_group_url: "",
  support_email: "",
  auto_refund_enabled: true,
  theme: "aurora",
};

export async function readBranding(): Promise<BrandingSettings> {
  const { data, error } = await supabaseAdmin
    .from("site_settings")
    .select("key, value")
    .in("key", [...BRANDING_KEYS]);

  if (error) {
    console.error("[Branding] Read failed:", error.message);
    throw new Error(`Could not load branding settings: ${error.message}`);
  }

  const map: Record<string, string> = {};

  (data ?? []).forEach((row: any) => {
    map[row.key] = row.value ?? "";
  });

  return {
    brand_name: map.brand_name || BRANDING_DEFAULTS.brand_name,
    logo_url: map.logo_url ?? "",
    favicon_url: map.favicon_url ?? "",
    whatsapp_number: map.whatsapp_number ?? "",
    whatsapp_group_url: map.whatsapp_group_url ?? "",
    support_email: map.support_email ?? "",
    auto_refund_enabled:
      map.auto_refund_enabled === undefined
        ? BRANDING_DEFAULTS.auto_refund_enabled
        : map.auto_refund_enabled === "true",
    theme: map.theme || BRANDING_DEFAULTS.theme,
  };
}

export async function isAdminUser(
  userId: string | null,
  supabaseClient?: any
): Promise<boolean> {
  if (!userId) return false;

  if (supabaseClient) {
    const { data, error } = await supabaseClient.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });

    if (error) {
      console.error("[Branding] Admin verification failed:", error.message);
      return false;
    }

    return !!data;
  }

  return false;
}
