import { createFileRoute } from "@tanstack/react-router";
import React from "react";
import { toast } from "sonner";
import { Plus, Trash2, Edit, Globe, Zap, Upload, Loader2 } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useAdminData, AdminState } from "@/components/admin/AdminData";
import { adminListCategories, adminSaveCategory, adminDeleteCategory, adminBulkUpdateCategoryIcons } from "@/lib/admin/admin.functions";
import { uploadIconFile, isImageIcon } from "@/lib/upload-icon";

const IconRenderer = ({ name, className }: { name?: string | null, className?: string }) => {
  if (!name) return <Globe className={className} />;
  if (isImageIcon(name)) return <img src={name} alt="" className={`${className ?? ""} object-contain`} />;
  const IconComponent = (LucideIcons as any)[name];
  if (IconComponent) return <IconComponent className={className} />;
  return <Globe className={className} />;
};


export const Route = createFileRoute("/management/categories")({
  component: CategoriesPage,
});

function CategoriesPage() {
  const { data, loading, error, reload } = useAdminData<any[]>(() => adminListCategories());
  const [name, setName] = React.useState("");
  const [icon, setIcon] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [bulkIcon, setBulkIcon] = React.useState("");
  const [formUploading, setFormUploading] = React.useState(false);
  const [rowUploadingId, setRowUploadingId] = React.useState<string | null>(null);
  const categories = data ?? [];

  const uploadForRow = async (category: any, file: File) => {
    setRowUploadingId(category.id);
    try {
      const url = await uploadIconFile(file);
      const res = JSON.parse(await adminSaveCategory({ data: { id: category.id, name: category.name, icon: url, status: category.status ?? "active" } }));
      if (!res.success) { toast.error(res.message); return; }
      toast.success("Icon updated");
      reload();
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setRowUploadingId(null);
    }
  };


  const add = async () => {
    if (!name.trim()) return;
    const res = JSON.parse(await adminSaveCategory({ data: { id: editingId || undefined, name: name.trim(), icon: icon.trim() } }));
    if (!res.success) { toast.error(res.message); return; }
    setName("");
    setIcon("");
    setEditingId(null);
    toast.success(editingId ? "Category updated" : "Category saved");
    reload();
  };

  const startEdit = (c: any) => {
    setEditingId(c.id);
    setName(c.name);
    setIcon(c.icon || "");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    const res = JSON.parse(await adminDeleteCategory({ data: { id } }));
    if (!res.success) { toast.error(res.message); return; }
    toast.success("Category deleted");
    reload();
  };

  const applyBulkIcon = async () => {
    if (!bulkIcon.trim()) {
      toast.error("Please enter an icon name");
      return;
    }
    
    if (!confirm(`Apply icon '${bulkIcon}' to all active categories?`)) return;
    
    try {
      const resJson = await adminBulkUpdateCategoryIcons({ data: { icon: bulkIcon.trim() } });
      const res = typeof resJson === 'string' ? JSON.parse(resJson) : resJson;
      if (!res.success) {
        toast.error(res.message || "Failed to update icons");
        return;
      }
      toast.success("All categories updated!");
      setBulkIcon("");
      reload();
    } catch (error: any) {
      toast.error(error.message || "Bulk update failed");
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-gray-900">Categories</h1>
          <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-1">Service categories</p>
        </div>
        
        <div className="flex gap-2 bg-blue-50/50 p-1.5 rounded-2xl border border-blue-100 items-center">
          <input 
            type="text"
            placeholder="Bulk Icon (e.g. Heart)"
            className="px-4 py-2 bg-white border-none rounded-xl text-[10px] font-bold w-32 focus:ring-2 focus:ring-blue-200"
            value={bulkIcon}
            onChange={(e) => setBulkIcon(e.target.value)}
          />
          <button 
            onClick={applyBulkIcon}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Zap size={10} /> Apply to All
          </button>
        </div>
      </div>


      <div className="bg-white p-6 rounded-3xl shadow-sm border space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">
          {editingId ? "Edit Category" : "Add New Category"}
        </h2>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category Name (e.g. Instagram Followers)"
            className="flex-1 px-4 py-3 bg-gray-50 rounded-2xl text-sm font-bold border-none focus:ring-2 focus:ring-blue-100"
          />
          <input
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="Lucide Icon Name or uploaded image URL"
            className="flex-1 px-4 py-3 bg-gray-50 rounded-2xl text-sm font-bold border-none focus:ring-2 focus:ring-blue-100"
          />
          <label className="px-6 py-3 rounded-2xl bg-gray-100 text-gray-600 text-xs font-black uppercase tracking-widest cursor-pointer flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">
            {formUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            Upload
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                setFormUploading(true);
                try {
                  const url = await uploadIconFile(file);
                  setIcon(url);
                  toast.success("Icon uploaded");
                } catch (err: any) {
                  toast.error(err.message || "Upload failed");
                } finally {
                  setFormUploading(false);
                }
              }}
            />
          </label>
          {icon && isImageIcon(icon) && (
            <div className="w-12 h-12 rounded-2xl border bg-white flex items-center justify-center overflow-hidden shrink-0">
              <img src={icon} alt="" className="w-8 h-8 object-contain" />
            </div>
          )}

          <button onClick={add} className="px-8 py-3 rounded-2xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-100 transition-all active:scale-95 flex items-center justify-center gap-2">
            {editingId ? <Edit size={16} /> : <Plus size={16} />} 
            {editingId ? "Update" : "Add"}
          </button>
          {editingId && (
            <button onClick={() => { setEditingId(null); setName(""); setIcon(""); }} className="px-8 py-3 rounded-2xl bg-gray-100 text-gray-500 text-xs font-black uppercase tracking-widest transition-all active:scale-95">
              Cancel
            </button>
          )}
        </div>
        <p className="text-[10px] text-gray-400 font-bold uppercase italic">Tip: Use Lucide icon names like 'Instagram', 'Youtube', 'Zap', 'Heart', 'Users'.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
        <AdminState loading={loading} error={error} empty={categories.length === 0} emptyLabel="No categories found." errorLabel="Failed to load categories" onRetry={reload}>
          {/* Desktop table */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-left min-w-[640px]">
              <thead>
                <tr className="border-b">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Icon</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Name</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {categories.map((c) => (
                  <tr key={c.id} className="group hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100 overflow-hidden">
                          <IconRenderer name={c.icon} className="w-5 h-5" />
                        </div>
                        <label className="cursor-pointer p-2 rounded-xl bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Upload custom icon">
                          {rowUploadingId === c.id ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              e.target.value = "";
                              if (file) uploadForRow(c, file);
                            }}
                          />
                        </label>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-900">{c.name}</span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Icon: {c.icon || "None"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold uppercase text-gray-500">
                      <span className={`px-2 py-0.5 rounded-full ${c.status === 'inactive' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                        {c.status ?? "active"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => startEdit(c)} className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" title="Edit">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => remove(c.id)} className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y">
            {categories.map((c) => (
              <div key={c.id} className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100 overflow-hidden shrink-0">
                    <IconRenderer name={c.icon} className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-gray-900 truncate">{c.name}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter truncate">{c.icon || "No icon"}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${c.status === 'inactive' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                      {c.status ?? "active"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <label className="cursor-pointer p-2.5 rounded-xl bg-gray-100 text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Upload icon">
                    {rowUploadingId === c.id ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (file) uploadForRow(c, file);
                      }}
                    />
                  </label>
                  <button onClick={() => startEdit(c)} className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" title="Edit">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => remove(c.id)} className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors" title="Delete">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </AdminState>
      </div>
    </div>
  );
}
