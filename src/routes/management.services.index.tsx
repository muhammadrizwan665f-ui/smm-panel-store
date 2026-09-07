import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  Plus, 
  Search, 
  Filter, 
  RefreshCw, 
  ArrowUpDown,
  Edit,
  Trash2,
  ExternalLink,
  Layers,
  CheckCircle2,
  XCircle,
  Tag,
  ChevronRight,
  Database,
  ArrowRight,
  Zap,
  Globe,
  Upload,
  Loader2
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getInternalServices, updateServiceStatus, deleteService } from "@/lib/providers/management.functions";
import { adminSaveService, adminBulkUpdateServiceIconsByKeyword } from "@/lib/admin/admin.functions";
import { getCurrencySettings } from "@/lib/settings.functions";
import { recalculateServicePrices } from "@/lib/providers/provider.functions";
import { uploadIconFile, isImageIcon } from "@/lib/upload-icon";

const IconRenderer = ({ name, className }: { name?: string | null, className?: string }) => {
  if (!name) return <Zap className={className} />;
  if (isImageIcon(name)) return <img src={name} alt="" className={className} />;
  const IconComponent = (LucideIcons as any)[name];
  if (IconComponent) return <IconComponent className={className} />;
  return <Zap className={className} />;
};

export const Route = createFileRoute("/management/services/")({
  component: ServicesPage,
});

function ServicesPage() {
  const [services, setServices] = React.useState<any[]>([]);
  const [categories, setCategories] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [currencySettings, setCurrencySettings] = React.useState<any>(null);

  const [isRecalculating, setIsRecalculating] = React.useState(false);
  const [bulkIcon, setBulkIcon] = React.useState("");
  const [bulkCategory, setBulkCategory] = React.useState("all");
  const [keywordIcon, setKeywordIcon] = React.useState("");
  const [keywordText, setKeywordText] = React.useState("");
  const [keywordUploading, setKeywordUploading] = React.useState(false);

  const [editingService, setEditingService] = React.useState<any>(null);
  const [rowUploadingId, setRowUploadingId] = React.useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [servicesJson, categoriesRes, settingsJson] = await Promise.all([
        getInternalServices(),
        supabase.from('service_categories').select('*').order('name'),
        getCurrencySettings()
      ]);

      setServices(JSON.parse(servicesJson));
      if (categoriesRes.error) throw categoriesRes.error;
      setCategories(categoriesRes.data || []);
      
      const parsedSettings = JSON.parse(settingsJson);
      setCurrencySettings(parsedSettings);
    } catch (error: any) {
      toast.error("Failed to load catalog: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await updateServiceStatus({ data: { id, status: newStatus } });
      setServices(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
      toast.success(`Service ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
    } catch (error: any) {
      toast.error("Status update failed");
    }
  };

  const handleSaveIcon = async (id: string, icon: string) => {
    try {
      await adminSaveService({ data: { id, icon } });
      setServices(prev => prev.map(s => s.id === id ? { ...s, icon } : s));
      toast.success("Service icon updated");
    } catch (error: any) {
      toast.error("Update failed");
    }
  };

  const handleUploadIcon = async (serviceId: string, file: File) => {
    setRowUploadingId(serviceId);
    try {
      const url = await uploadIconFile(file);
      await handleSaveIcon(serviceId, url);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setRowUploadingId(null);
    }
  };

  const handleBulkIcon = async () => {
    if (!bulkIcon.trim() || bulkCategory === "all") {
      toast.error("Please select a category and enter an icon name");
      return;
    }
    
    setLoading(true);
    try {
      const { data: catServices } = await supabase
        .from('services')
        .select('id')
        .eq('category_id', bulkCategory);
      
      if (!catServices || catServices.length === 0) {
        toast.info("No services in this category");
        return;
      }

      const promises = catServices.map(s => adminSaveService({ data: { id: s.id, icon: bulkIcon.trim() } }));
      await Promise.all(promises);
      
      toast.success(`Updated ${catServices.length} services with icon: ${bulkIcon}`);
      fetchData();
    } catch (error: any) {
      toast.error("Bulk update failed");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkIconByKeyword = async () => {
    if (!keywordText.trim() || !keywordIcon.trim()) {
      toast.error("Enter a keyword (e.g. Like, View, Share) and an icon");
      return;
    }
    setLoading(true);
    try {
      const res = JSON.parse(await adminBulkUpdateServiceIconsByKeyword({ data: { keyword: keywordText.trim(), icon: keywordIcon.trim() } }));
      if (!res.success) { toast.error(res.message); return; }
      toast.success(`Updated ${res.data.updated} services matching "${keywordText}" — across every platform`);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Bulk update failed");
    } finally {
      setLoading(false);
    }
  };

  const handleKeywordIconUpload = async (file: File) => {
    setKeywordUploading(true);
    try {
      const url = await uploadIconFile(file);
      setKeywordIcon(url);
      toast.success("Icon uploaded");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setKeywordUploading(false);
    }
  };



  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    try {
      await deleteService({ data: { id } });
      setServices(prev => prev.filter(s => s.id !== id));
      toast.success("Service deleted");
    } catch (error: any) {
      toast.error("Delete failed");
    }
  };

  const handleRecalculate = async () => {
    if (!confirm("Recalculate all service prices based on current USDT rate and markup settings? This cannot be undone.")) return;
    setIsRecalculating(true);
    try {
      const resultJson = await recalculateServicePrices({ data: {} });
      const result = typeof resultJson === 'string' ? JSON.parse(resultJson) : resultJson;
      if (result.success) {
        toast.success(result.message);
        fetchData();
      } else {
        toast.error("Recalculation failed: " + result.message);
      }
    } catch (error: any) {
      toast.error("Recalculation error: " + error.message);
    } finally {
      setIsRecalculating(false);
    }
  };

  const currencySymbols: Record<string, string> = {
    'PKR': 'Rs.',
    'USD': '$',
    'USDT': '₮'
  };
  const currentSymbol = currencySymbols[currencySettings?.customer_currency] || 'Rs.';

  const filteredServices = services.filter(s => 

    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.provider?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-gray-900 uppercase">Service <span className="text-blue-600">Catalog</span></h1>
          <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-1">Manage customer-facing services</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRecalculate}
            disabled={isRecalculating || loading}
            className="bg-amber-50 text-amber-600 border border-amber-100 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm flex items-center gap-2 hover:bg-amber-100 transition-colors disabled:opacity-50"
          >
            {isRecalculating ? <RefreshCw className="animate-spin" size={16} /> : <Zap size={16} />}
            Recalculate Prices
          </button>
          <Link to="/management/providers">
            <button className="bg-white text-gray-900 border border-gray-100 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm flex items-center gap-2 hover:bg-gray-50 transition-colors">
              <Database size={18} />
              Import from Provider
            </button>
          </Link>
        </div>
      </div>

      <div className="bg-white p-4 rounded-3xl shadow-sm border border-white flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search catalog..." 
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold placeholder:text-gray-400 focus:ring-2 focus:ring-blue-100"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 items-center">
          <select 
            className="bg-gray-50 border-none rounded-2xl px-6 py-3 text-xs font-black uppercase tracking-widest text-gray-600 focus:ring-2 focus:ring-blue-100"
            value={bulkCategory}
            onChange={(e) => setBulkCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          
          <div className="flex gap-2 bg-blue-50/50 p-1.5 rounded-2xl border border-blue-100 items-center">
            <input 
              type="text"
              placeholder="Bulk Icon (e.g. Heart)"
              className="px-4 py-2 bg-white border-none rounded-xl text-[10px] font-bold w-32 focus:ring-2 focus:ring-blue-200"
              value={bulkIcon}
              onChange={(e) => setBulkIcon(e.target.value)}
            />
            <button 
              onClick={handleBulkIcon}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors"
            >
              Apply to Category
            </button>
          </div>
        </div>
      </div>

      {/* Bulk-by-keyword: set one icon for every service whose name matches a
          word, e.g. every "Likes" service across ALL platforms at once. */}
      <div className="bg-amber-50/50 p-4 rounded-3xl border border-amber-100 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="flex items-center gap-2 shrink-0">
          <Search size={14} className="text-amber-600" />
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">Bulk icon by keyword (any platform)</span>
        </div>
        <input
          type="text"
          placeholder="Keyword in service name (e.g. Like, View, Share, Follower)"
          className="flex-1 px-4 py-2.5 bg-white border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-200"
          value={keywordText}
          onChange={(e) => setKeywordText(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Icon name or upload →"
            className="px-4 py-2.5 bg-white border-none rounded-xl text-xs font-bold w-40 focus:ring-2 focus:ring-amber-200"
            value={keywordIcon}
            onChange={(e) => setKeywordIcon(e.target.value)}
          />
          <label className="cursor-pointer p-2.5 rounded-xl bg-white text-gray-500 hover:text-amber-600 transition-colors" title="Upload custom icon">
            {keywordUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) handleKeywordIconUpload(file);
              }}
            />
          </label>
          {keywordIcon && isImageIcon(keywordIcon) && (
            <div className="w-9 h-9 rounded-xl border bg-white flex items-center justify-center overflow-hidden shrink-0">
              <img src={keywordIcon} alt="" className="w-6 h-6 object-contain" />
            </div>
          )}
          <button
            onClick={handleBulkIconByKeyword}
            className="bg-amber-600 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 transition-colors whitespace-nowrap"
          >
            Apply to All Matches
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Icon</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Service</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Provider</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Internal Cost ({currencySettings?.customer_currency})</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Markup</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-blue-600">User Price ({currencySettings?.customer_currency})</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Visibility</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <RefreshCw className="animate-spin text-blue-600 mx-auto" size={24} />
                  </td>
                </tr>
              ) : filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Your catalog is empty</p>
                  </td>
                </tr>
              ) : (
                filteredServices.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100 shrink-0">
                          <IconRenderer name={service.icon} className="w-4 h-4" />
                        </div>
                        <div className="relative group/icon">
                          <input 
                            type="text" 
                            defaultValue={service.icon || ""}
                            placeholder="Set Icon"
                            onBlur={(e) => handleSaveIcon(service.id, e.target.value)}
                            className="w-20 px-2 py-1 bg-gray-50 border border-transparent hover:border-blue-100 focus:border-blue-500 rounded-lg text-[10px] font-bold text-center transition-all"
                          />
                        </div>
                        <label className="cursor-pointer p-2 rounded-lg bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors shrink-0" title="Upload custom icon">
                          {rowUploadingId === service.id ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleUploadIcon(service.id, f);
                            }}
                          />
                        </label>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-black text-gray-900 truncate uppercase tracking-tight">{service.name}</div>
                          {service.icon && <span className="text-[10px] text-blue-500 font-black">★</span>}
                        </div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase">{service.category?.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                        {service.provider?.name || 'Manual'}
                        <div className="text-[8px] font-bold text-gray-300">ID: {service.provider_service_id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-black text-gray-600">{currentSymbol}{Number(service.provider_cost || 0).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="text-[10px] font-black text-green-600 uppercase">
                          {service.markup_type === 'percentage' ? `${service.markup_amount}%` : `+${currentSymbol}${service.markup_amount}`}
                        </div>
                        <div className="relative">
                          <span className="text-[8px] font-black text-amber-600 uppercase">Discount:</span>
                          <input 
                            type="number"
                            defaultValue={service.discount_percent || 0}
                            className="w-12 ml-1 px-1 py-0.5 bg-amber-50 border border-transparent hover:border-amber-200 rounded text-[9px] font-black text-amber-700 outline-none"
                            onBlur={(e) => adminSaveService({ data: { id: service.id, discount_percent: parseFloat(e.target.value) || 0 } }).then(() => toast.success("Discount updated"))}
                          />
                          <span className="text-[8px] font-black text-amber-600">%</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-blue-600 font-mono">{currentSymbol}{Number(service.price_per_1000).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleToggleStatus(service.id, service.status)}
                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                          service.status === 'active' 
                            ? 'bg-green-50 text-green-600' 
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {service.status === 'active' ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleDelete(service.id)}
                          className="p-2 hover:bg-white rounded-lg text-gray-300 hover:text-red-600 shadow-sm transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}