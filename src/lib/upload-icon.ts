import { supabase } from "@/integrations/supabase/client";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

/** Uploads an image to the icons bucket and returns a long-lived URL. */
export async function uploadIconFile(file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage.from("icons").upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type || "image/png",
  });
  if (error) throw new Error(error.message);

  const { data, error: signErr } = await supabase.storage
    .from("icons")
    .createSignedUrl(path, TEN_YEARS);
  if (signErr || !data?.signedUrl) throw new Error(signErr?.message || "Could not create icon URL");

  return data.signedUrl;
}

export const isImageIcon = (value?: string | null) =>
  !!value && (value.startsWith("http") || value.startsWith("/"));
