import { createFileRoute } from "@tanstack/react-router";
import React from "react";
import { toast } from "sonner";
import { Loader2, Upload, Save } from "lucide-react";
import { getBranding, adminUpdateBranding } from "@/lib/settings/branding.functions";
import { uploadIconFile } from "@/lib/upload-icon";

const THEMES = [
  { id: "aurora", name: "Aurora", desc: "Soft violet SaaS", colors: ["#eae6fb", "#7b7ef0", "#ffffff"] },
  { id: "ocean", name: "Ocean", desc: "Corporate blue", colors: ["#e3eefc", "#2f6fdc", "#ffffff"] },
  { id: "emerald", name: "Emerald", desc: "Fresh premium green", colors: ["#e2f4ec", "#17a373", "#ffffff"] },
  { id: "sunset", name: "Sunset", desc: "Warm luxury amber", colors: ["#fbeade", "#e0703c", "#ffffff"] },
];

export const Route = createFileRoute("/management/settings/branding")({
  component: BrandingPage,
});

function BrandingPage() {
  const [form, setForm] = React.useState({
    brand_name: "",
    logo_url: "",
    favicon_url: "",
    whatsapp_number: "",
    whatsapp_group_url: "",
    support_email: "",
    auto_refund_enabled: true,
    theme: "aurora",
  });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = JSON.parse(await getBranding());
      setForm(res);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load branding");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const upload = async (field: "logo_url" | "favicon_url", file: File) => {
    setUploading(field);
    try {
      const url = await uploadIconFile(file);
      setForm((f) => ({ ...f, [field]: url }));
      toast.success("Image uploaded");
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = JSON.parse(await adminUpdateBranding({ data: form }));
      if (!res.success) throw new Error(res.message);
      toast.success("Branding saved");
      if (res.data) setForm(res.data);
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading branding...
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white rounded-3xl border shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-500">Website Branding</h2>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Brand Name</label>
          <input
            className="mt-1 w-full rounded-xl border px-4 py-3 text-sm"
            value={form.brand_name}
            onChange={(e) => setForm({ ...form, brand_name: e.target.value })}
            placeholder="My SMM Panel"
          />
        </div>

        {(["logo_url", "favicon_url"] as const).map((field) => (
          <div key={field}>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
              {field === "logo_url" ? "Logo" : "Favicon"}
            </label>
            <div className="mt-1 flex items-center gap-3">
              {form[field] ? (
                <img src={form[field]} alt={field} className="h-12 w-12 rounded-lg object-contain border bg-white" />
              ) : (
                <div className="h-12 w-12 rounded-lg border bg-gray-50" />
              )}
              <input
                className="flex-1 rounded-xl border px-4 py-3 text-sm"
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                placeholder="https://... or upload"
              />
              <label className="cursor-pointer rounded-xl border px-4 py-3 text-xs font-bold uppercase tracking-wider hover:bg-gray-50 flex items-center gap-2">
                {uploading === field ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) upload(field, f);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </div>
        ))}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">WhatsApp Number</label>
            <input
              className="mt-1 w-full rounded-xl border px-4 py-3 text-sm"
              value={form.whatsapp_number}
              onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
              placeholder="+92300xxxxxxx"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">WhatsApp Group Link</label>
            <input
              className="mt-1 w-full rounded-xl border px-4 py-3 text-sm"
              value={form.whatsapp_group_url}
              onChange={(e) => setForm({ ...form, whatsapp_group_url: e.target.value })}
              placeholder="https://chat.whatsapp.com/xxxxxxxx"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Support Email</label>
            <input
              className="mt-1 w-full rounded-xl border px-4 py-3 text-sm"
              value={form.support_email}
              onChange={(e) => setForm({ ...form, support_email: e.target.value })}
              placeholder="support@example.com"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Panel Theme</label>
          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3">
            {THEMES.map((t) => {
              const active = form.theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setForm({ ...form, theme: t.id })}
                  className={`rounded-2xl border p-3 text-left transition ${
                    active ? "border-gray-900 ring-2 ring-gray-900/20" : "hover:border-gray-400"
                  }`}
                >
                  <div className="flex gap-1">
                    {t.colors.map((c) => (
                      <span key={c} className="h-6 flex-1 rounded-md" style={{ background: c }} />
                    ))}
                  </div>
                  <div className="mt-2 text-xs font-black uppercase tracking-wider">{t.name}</div>
                  <div className="text-[10px] text-gray-500">{t.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        <label className="flex items-center gap-3 rounded-xl border p-4">
          <input
            type="checkbox"
            checked={form.auto_refund_enabled}
            onChange={(e) => setForm({ ...form, auto_refund_enabled: e.target.checked })}
          />
          <span className="text-sm font-bold">
            Auto refund cancelled / failed orders back to the user's wallet
          </span>
        </label>

        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-6 py-3 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Branding
        </button>
      </div>
    </div>
  );
}
