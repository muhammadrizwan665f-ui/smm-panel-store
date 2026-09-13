import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getBlogPostBySlug } from "@/lib/blog.functions";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const json = await getBlogPostBySlug({ data: { slug: params.slug } });
    const parsed = JSON.parse(json);
    if (!parsed.success || !parsed.data) {
      throw notFound();
    }
    return { post: parsed.data };
  },
  component: BlogPostPage,
  notFoundComponent: () => (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
      <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Post not found</p>
      <Link to="/blog" className="text-xs font-black uppercase tracking-widest text-primary">
        ← Back to Blog
      </Link>
    </div>
  ),
});

function BlogPostPage() {
  const { post } = Route.useLoaderData() as {
    post: {
      id: string;
      title: string;
      content: string;
      cover_image_url: string | null;
      author_name: string | null;
      published_at: string | null;
    };
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-16">
      <div className="max-w-2xl mx-auto">
        <Link to="/blog" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground mb-6">
          <ArrowLeft size={14} /> Back to Blog
        </Link>

        {post.cover_image_url && (
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="w-full h-56 object-cover rounded-2xl mb-6"
          />
        )}

        <h1 className="text-2xl font-black mb-2">{post.title}</h1>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 mb-6">
          {post.author_name && <span>{post.author_name}</span>}
          {post.published_at && (
            <span>
              {post.author_name && "· "}
              {new Date(post.published_at).toLocaleDateString()}
            </span>
          )}
        </div>

        <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed">
          {post.content}
        </div>
      </div>
    </div>
  );
}
