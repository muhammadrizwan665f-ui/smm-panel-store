import { createFileRoute } from "@tanstack/react-router";
import React from "react";
import { toast } from "sonner";
import { Plus, Trash2, Edit, FileText } from "lucide-react";
import { useAdminData } from "@/components/admin/AdminData";
import { adminListBlogPosts, adminSaveBlogPost, adminDeleteBlogPost } from "@/lib/admin/admin.functions";

export const Route = createFileRoute("/management/blog")({
  component: BlogAdminPage,
});

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  status: "draft" | "published";
  author_name: string | null;
  created_at: string;
  published_at: string | null;
}

function BlogAdminPage() {
  const { data, loading, error, reload } = useAdminData<BlogPost[]>(() => adminListBlogPosts());
  const posts = data ?? [];

  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [excerpt, setExcerpt] = React.useState("");
  const [content, setContent] = React.useState("");
  const [coverImageUrl, setCoverImageUrl] = React.useState("");
  const [authorName, setAuthorName] = React.useState("");
  const [status, setStatus] = React.useState<"draft" | "published">("draft");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setExcerpt("");
    setContent("");
    setCoverImageUrl("");
    setAuthorName("");
    setStatus("draft");
    setEditingId(null);
  };

  const startEdit = (post: BlogPost) => {
    setEditingId(post.id);
    setTitle(post.title);
    setSlug(post.slug);
    setExcerpt(post.excerpt ?? "");
    setContent(post.content);
    setCoverImageUrl(post.cover_image_url ?? "");
    setAuthorName(post.author_name ?? "");
    setStatus(post.status);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async (publishNow?: boolean) => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    setSaving(true);
    try {
      const res = JSON.parse(
        await adminSaveBlogPost({
          data: {
            id: editingId || undefined,
            title: title.trim(),
            slug: slug.trim() || undefined,
            excerpt: excerpt.trim() || undefined,
            content,
            cover_image_url: coverImageUrl.trim() || null,
            author_name: authorName.trim() || undefined,
            status: publishNow ? "published" : status,
          },
        })
      );
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success(editingId ? "Post updated" : "Post saved");
      resetForm();
      reload();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this post permanently?")) return;
    const res = JSON.parse(await adminDeleteBlogPost({ data: { id } }));
    if (!res.success) {
      toast.error(res.message);
      return;
    }
    toast.success("Post deleted");
    reload();
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="text-primary" size={22} />
        <h1 className="text-lg font-black uppercase tracking-widest">Blog Posts</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-white p-5 space-y-3">
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
          {editingId ? "Edit Post" : "New Post"}
        </p>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold"
        />
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="URL slug (auto-generated from title if left blank)"
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold"
        />
        <input
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Short excerpt (shown in blog list)"
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold"
        />
        <input
          value={coverImageUrl}
          onChange={(e) => setCoverImageUrl(e.target.value)}
          placeholder="Cover image URL (optional)"
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold"
        />
        <input
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="Author name (optional)"
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Post content"
          rows={8}
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold"
        />
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "draft" | "published")}
            className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-black uppercase tracking-widest"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <button
            onClick={() => save(false)}
            disabled={saving}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50"
          >
            <Plus size={14} /> {editingId ? "Update" : "Save Draft"}
          </button>
          <button
            onClick={() => save(true)}
            disabled={saving}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50"
          >
            Publish Now
          </button>
          {editingId && (
            <button
              onClick={resetForm}
              className="text-xs font-black uppercase tracking-widest text-muted-foreground"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      {loading && <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Loading…</p>}
      {error && <p className="text-xs font-black uppercase tracking-widest text-red-500">{error}</p>}

      <div className="space-y-2">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-white rounded-2xl shadow-sm border border-white p-4 flex items-center gap-3"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black truncate">{post.title}</p>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">
                <span
                  className={`px-2 py-0.5 rounded-full ${
                    post.status === "published"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {post.status}
                </span>
                <span>/{post.slug}</span>
              </div>
            </div>
            <button
              onClick={() => startEdit(post)}
              className="p-2 bg-gray-100 rounded-xl text-gray-700"
              title="Edit"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => remove(post.id)}
              className="p-2 bg-red-50 rounded-xl text-red-600"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {!loading && posts.length === 0 && (
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">No posts yet.</p>
        )}
      </div>
    </div>
  );
}
