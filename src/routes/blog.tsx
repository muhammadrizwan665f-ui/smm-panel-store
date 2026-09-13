import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { listPublishedBlogPosts } from "@/lib/blog.functions";
import { BookOpen, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/blog")({
  loader: async () => {
    const json = await listPublishedBlogPosts();
    const parsed = JSON.parse(json);
    return { posts: parsed.data ?? [] };
  },
  component: BlogListPage,
});

function BlogListPage() {
  const { posts } = Route.useLoaderData() as {
    posts: {
      id: string;
      title: string;
      slug: string;
      excerpt: string | null;
      cover_image_url: string | null;
      author_name: string | null;
      published_at: string | null;
    }[];
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-16">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground mb-6">
          <ArrowLeft size={14} /> Back
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <BookOpen className="text-primary" size={24} />
          <h1 className="text-2xl font-black uppercase tracking-widest">Blog</h1>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground font-black uppercase tracking-widest text-xs">
            No posts yet — check back soon.
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Link
                key={post.id}
                to="/blog/$slug"
                params={{ slug: post.slug }}
                className="block bg-white rounded-2xl shadow-sm border border-white p-5 transition-all active:scale-[0.99] hover:shadow-md"
              >
                {post.cover_image_url && (
                  <img
                    src={post.cover_image_url}
                    alt={post.title}
                    className="w-full h-40 object-cover rounded-xl mb-4"
                  />
                )}
                <h2 className="text-lg font-black mb-1">{post.title}</h2>
                {post.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{post.excerpt}</p>
                )}
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                  {post.author_name && <span>{post.author_name}</span>}
                  {post.published_at && (
                    <span>
                      {post.author_name && "· "}
                      {new Date(post.published_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
