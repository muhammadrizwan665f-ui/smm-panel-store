import { createFileRoute } from "@tanstack/react-router";
import React from "react";
import { toast } from "sonner";
import { Plus, Trash2, Edit, Upload, Loader2, Zap, Package } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { uploadIconFile, isImageIcon } from "@/lib/upload-icon";
import {
  adminListManualCatalog,
  adminSaveManualCategory,
  adminDeleteManualCategory,
  adminSaveManualService,
  adminDeleteManualService,
} from "@/lib/manual/manual.functions";

export const Route = createFileRoute("/management/manual-services")({
  component: ManualServicesPage,
});

const IconRenderer = ({ name, className }: { name?: string | null; className?: string }) => {
  if (!name) return <Zap className={className} />;
  if (isImageIcon(name)) return <img src={name} alt="" className={className} />;
  const C = (LucideIcons as any)[name];
  return C ? <C className={className} /> : <Zap className={className} />;
};

function ManualServicesPage() {
  const [categories, setCategories] = React.useState<any[]>([]);
  const [services, setServices] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [uploadingKey, setUploadingKey] = React.useState<string | null>(null);

  const [catName, setCatName] = React.useState("");
  const [catIcon, setCatIcon] = React.useState("");
  const [catId, setCatId] = React.useState<string | null>(null);

  const emptyService = {
    id: null as string | null,
    category_id: "",
    name: "",
    description: "",
    icon: "",
    fixed_price: "",
    allow_quantity: false,
    status: "active",
  };
  const [form, setForm] = React.useState<typeof emptyService>(emptyService);

  const load = async () => {
    setLoading(true);
    try {
      const res = JSON.parse(await adminListManualCatalog());
      if (!res.success) throw new Error(res.message);
      setCategories(res.data.categories);
      setServices(res.data.services);
    } catch (e: any) {
      toast.error(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    load();
  }, []);

  const upload = async (file: File, key: string, apply: (url: string) => void) => {
    setUploadingKey(key);
    try {
      apply(await uploadIconFile(file));
      toast.success("Icon uploaded");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploadingKey(null);
    }
  };

  const saveCategory = async () => {
    if (!catName.trim()) { toast.error("Enter a category name"); return; }
    const res = JSON.parse(
      await adminSaveManualCategory({
        data: { id: catId || undefined, name: catName.trim(), icon: catIcon || null },
      }),
    );
    if (!res.success) { toast.error(res.message); return; }
    toast.success("Category saved");
    setCatName("");
    setCatIcon("");
    setCatId(null);
    load();
  };

  const saveService = async () => {
    if (!form.name.trim() || !form.category_id) { toast.error("Name and category are required"); return; }
    const price = Number(form.fixed_price);
    if (!price || price <= 0) { toast.error("Enter a valid price"); return; }
    const res = JSON.parse(
      await adminSaveManualService({
        data: {
          id: form.id || undefined,
          category_id: form.category_id,
          name: form.name.trim(),
          description: form.description || null,
          icon: form.icon || null,
          fixed_price: price,
          allow_quantity: form.allow_quantity,
          status: form.status,
        },
      }),
    );
    if (!res.success) { toast.error(res.message); return; }
    toast.success("Product saved");
    setForm(emptyService);
    load();
  };

  const inputCls =
    "w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-100";

  return (
    <div className="space-y-8 pb-16">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">Manual Products</h1>
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
          Subscriptions, VPN, AI tools — delivered by you on WhatsApp
        </p>
      </div>

      {/* Categories */}
      <div className="bg-white rounded-3xl border p-5 space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-gray-500">Manual Categories</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            className={inputCls}
            placeholder="Category name (e.g. Streaming Subscriptions)"
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
          />
          <input
            className={inputCls}
            placeholder="Icon name or uploaded URL"
            value={catIcon}
            onChange={(e) => setCatIcon(e.target.value)}
          />
          <label className="shrink-0 cursor-pointer flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-100 text-gray-600 text-xs font-black uppercase">
            {uploadingKey === "cat" ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            Upload
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload(f, "cat", setCatIcon);
              }}
            />
          </label>
          <button
            onClick={saveCategory}
            className="shrink-0 px-5 py-3 rounded-xl bg-gray-900 text-white text-xs font-black uppercase tracking-widest flex items-center gap-2"
          >
            <Plus size={14} /> {catId ? "Update" : "Add"}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center gap-2 bg-gray-50 border rounded-2xl px-3 py-2">
              <IconRenderer name={c.icon} className="w-5 h-5 object-contain text-blue-600" />
              <span className="text-xs font-black text-gray-800">{c.name}</span>
              <button
                onClick={() => {
                  setCatId(c.id);
                  setCatName(c.name);
                  setCatIcon(c.icon || "");
                }}
                className="p-1 text-gray-400 hover:text-blue-600"
              >
                <Edit size={13} />
              </button>
              <button
                onClick={async () => {
                  if (!confirm(`Delete category "${c.name}"?`)) return;
                  const res = JSON.parse(await adminDeleteManualCategory({ data: { id: c.id } }));
                  if (!res.success) { toast.error(res.message); return; }
                  toast.success("Deleted");
                  load();
                }}
                className="p-1 text-gray-400 hover:text-red-600"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          {categories.length === 0 && !loading && (
            <p className="text-[11px] font-bold uppercase text-gray-400">No manual categories yet</p>
          )}
        </div>
      </div>

      {/* Service editor */}
      <div className="bg-white rounded-3xl border p-5 space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-gray-500">
          {form.id ? "Edit Product" : "Add Product"}
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <select
            className={inputCls}
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            className={inputCls}
            placeholder="Product name (e.g. Netflix 1 Month)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className={inputCls}
            type="number"
            placeholder="Price (Rs.)"
            value={form.fixed_price}
            onChange={(e) => setForm({ ...form, fixed_price: e.target.value })}
          />
          <select
            className={inputCls}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <textarea
            className={`${inputCls} sm:col-span-2 min-h-[100px]`}
            placeholder="Full details / description (validity, features, how it is delivered...)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="flex gap-3 sm:col-span-2">
            <input
              className={inputCls}
              placeholder="Icon name or uploaded URL"
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
            />
            <label className="shrink-0 cursor-pointer flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-100 text-gray-600 text-xs font-black uppercase">
              {uploadingKey === "svc" ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              Upload
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) upload(f, "svc", (url) => setForm((p) => ({ ...p, icon: url })));
                }}
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-xs font-black uppercase text-gray-600">
            <input
              type="checkbox"
              checked={form.allow_quantity}
              onChange={(e) => setForm({ ...form, allow_quantity: e.target.checked })}
            />
            Allow customer to choose quantity
          </label>
        </div>
        <div className="flex gap-3">
          <button
            onClick={saveService}
            className="px-5 py-3 rounded-xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest"
          >
            {form.id ? "Update Product" : "Add Product"}
          </button>
          {form.id && (
            <button
              onClick={() => setForm(emptyService)}
              className="px-5 py-3 rounded-xl bg-gray-100 text-gray-600 text-xs font-black uppercase tracking-widest"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Product list */}
      <div className="bg-white rounded-3xl border divide-y">
        {loading ? (
          <div className="p-10 flex justify-center">
            <Loader2 className="animate-spin text-blue-600" />
          </div>
        ) : services.length === 0 ? (
          <div className="p-10 text-center text-[11px] font-black uppercase tracking-widest text-gray-400">
            <Package className="mx-auto mb-3 text-gray-300" /> No manual products yet
          </div>
        ) : (
          services.map((s) => (
            <div key={s.id} className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <IconRenderer name={s.icon} className="w-9 h-9 object-contain text-blue-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-black text-gray-900 truncate">{s.name}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 truncate">
                    {categories.find((c) => c.id === s.category_id)?.name || "Uncategorized"} ·{" "}
                    {s.status}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-black text-blue-600">Rs.{Number(s.fixed_price || 0).toFixed(0)}</span>
                <label className="cursor-pointer p-2 rounded-xl bg-gray-50 text-gray-400 hover:text-blue-600">
                  {uploadingKey === s.id ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      await upload(f, s.id, async (url) => {
                        await adminSaveManualService({
                          data: {
                            id: s.id,
                            category_id: s.category_id,
                            name: s.name,
                            description: s.description,
                            icon: url,
                            fixed_price: Number(s.fixed_price || 0),
                            allow_quantity: !!s.allow_quantity,
                            status: s.status,
                          },
                        });
                        load();
                      });
                    }}
                  />
                </label>
                <button
                  onClick={() =>
                    setForm({
                      id: s.id,
                      category_id: s.category_id || "",
                      name: s.name,
                      description: s.description || "",
                      icon: s.icon || "",
                      fixed_price: String(s.fixed_price ?? ""),
                      allow_quantity: !!s.allow_quantity,
                      status: s.status || "active",
                    })
                  }
                  className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:text-blue-600"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={async () => {
                    if (!confirm(`Delete "${s.name}"?`)) return;
                    const res = JSON.parse(await adminDeleteManualService({ data: { id: s.id } }));
                    if (!res.success) { toast.error(res.message); return; }
                    toast.success("Deleted");
                    load();
                  }}
                  className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
