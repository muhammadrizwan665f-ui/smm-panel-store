import { createServerFn } from "@tanstack/react-start";

export const listPublishedBlogPosts = createServerFn({ method: "GET" }).handler(async () => {
  const { supabase } = await import("@/integrations/supabase/client");

  const { data, error } = await (supabase as any)
    .from("blog_posts")
    .select("id, title, slug, excerpt, cover_image_url, author_name, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) {
    console.error("[blog] public list read failed:", error.message);
    return JSON.stringify({ success: false, data: [] });
  }
  return JSON.stringify({ success: true, data: data ?? [] });
});

export const getBlogPostBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: any) => d as { slug: string })
  .handler(async ({ data }) => {
    const { supabase } = await import("@/integrations/supabase/client");

    const { data: post, error } = await (supabase as any)
      .from("blog_posts")
      .select("*")
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();

    if (error) {
      console.error("[blog] public post read failed:", error.message);
      return JSON.stringify({ success: false, data: null });
    }
    return JSON.stringify({ success: true, data: post ?? null });
  });
