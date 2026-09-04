import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { 
  ArrowLeft, 
  Save, 
  RefreshCw, 
  Database, 
  Tag, 
  Settings,
  Shield,
  ArrowRight,
  ChevronRight,
  Calculator,
  AlertCircle
} from "lucide-react";
import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/management/services/$id")({
  component: ServiceDetail,
});

function ServiceDetail() {
  const { id } = useParams({ from: "/management/services/$id" });
  const [service, setService] = React.useState<any>(null);
  const [categories, setCategories] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [formData, setFormData] = React.useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    const [serviceRes, categoriesRes] = await Promise.all([
      supabase.from('services').select(`
        *,
        category:service_categories(*),
        provider:providers(*)
      `).eq('id', id).single(),
      supabase.from('service_categories').select('*').order('name')
    ]);

    if (serviceRes.error) toast.error("Failed to load service");
    else {
      setService(serviceRes.data);
      const data = serviceRes.data as any;
      setFormData({
        name: data.name,
        description: data.description,
        price_per_1000: data.price_per_1000,
        min_quantity: data.min_quantity,
        max_quantity: data.max_quantity,
        category_id: data.category_id,
        status: data.status,
        markup_type: data.markup_type || 'percentage',
        markup_amount: data.markup_amount || 0,
        provider_cost: data.provider_cost || 0
      });
    }

    if (categoriesRes.error) toast.error("Failed to load categories");
    else setCategories(categoriesRes.data || []);

    setLoading(false);
  };

  React.useEffect(() => {
    fetchData();
  }, [id]);

  const calculatePrice = (baseInr: number, mType: string, mAmount: number) => {
    if (mType === 'percentage') {
      return baseInr * (1 + mAmount / 100);
    }
    return baseInr + mAmount;
  };

  const handleMarkupChange = (type: string, amount: number) => {
    const newPrice = calculatePrice(Number(formData.provider_cost), type, amount);
    setFormData({ ...formData, markup_type: type, markup_amount: amount, price_per_1000: newPrice });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from('services')
      .update({
        name: formData.name,
        description: formData.description,
        price_per_1000: formData.price_per_1000,
        min_quantity: formData.min_quantity,
        max_quantity: formData.max_quantity,
        category_id: formData.category_id,
        status: formData.status,
        markup_type: formData.markup_type,
        markup_amount: formData.markup_amount
      } as any)
      .eq('id', id);

    if (error) toast.error("Failed to update service");
    else toast.success("Service updated successfully");
  };

  if (loading || !formData) return <div className="p-20 text-center"><RefreshCw className="animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-8">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
        <Link to="/management/services" className="hover:text-blue-600 transition-colors">Catalog</Link>
        <ChevronRight size={10} />
        <span className="text-gray-900">{service.name}</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-purple-600 text-white rounded-[24px] flex items-center justify-center shadow-xl shadow-purple-100">
            <Tag size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-gray-900 uppercase">{service.name}</h1>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Service ID: {service.id.slice(0, 8)}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-white space-y-6">
            <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
              <Settings className="text-purple-600" size={20} /> Customer Settings
            </h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Public Service Name</label>
                <input 
                  type="text" 
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-[24px] text-sm font-bold focus:border-purple-100 focus:bg-white focus:outline-none transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                <select 
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-[24px] text-sm font-black uppercase tracking-widest focus:border-purple-100 focus:bg-white focus:outline-none transition-all"
                  value={formData.category_id}
                  onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                >
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Customer Description</label>
                <textarea 
                  rows={4}
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-[24px] text-sm font-bold focus:border-purple-100 focus:bg-white focus:outline-none transition-all"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-white space-y-6">
            <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
              <Calculator className="text-green-600" size={20} /> Pricing & Markup
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-[24px] border border-gray-100 space-y-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Base Cost (PKR)</span>
                  <div className="text-2xl font-black text-gray-900">Rs.{Number(formData.provider_cost || 0).toFixed(2)}</div>
                  <div className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">
                    Provider Rate: Rs.{Number(service.provider_rate || 0).toFixed(2)} (PKR)
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Markup Type</label>
                  <div className="flex gap-2">
                    {['percentage', 'fixed'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleMarkupChange(type, formData.markup_amount)}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                          formData.markup_type === type ? 'bg-green-600 border-green-600 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-400'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Markup Amount ({formData.markup_type === 'percentage' ? '%' : 'Rs.'})</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-[24px] text-lg font-black focus:border-green-100 focus:bg-white focus:outline-none transition-all"
                    value={formData.markup_amount}
                    onChange={(e) => handleMarkupChange(formData.markup_type, parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="bg-green-600 p-6 rounded-[24px] text-white space-y-1 shadow-xl shadow-green-100">
                  <span className="text-[10px] font-black opacity-60 uppercase tracking-widest">Final Customer Price</span>
                  <div className="text-3xl font-black">Rs.{Number(formData.price_per_1000).toFixed(2)}</div>
                  <div className="text-[9px] font-bold opacity-60 uppercase tracking-widest">Per 1000 items</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-white space-y-6">
            <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
              <Shield className="text-blue-600" size={20} /> Service Mapping
            </h2>
            
            <div className="space-y-4">
              <div className="p-5 bg-blue-50/50 rounded-[24px] border border-blue-100 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                    <Database size={20} />
                  </div>
                  <div>
                    <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Connected Provider</div>
                    <div className="text-xs font-black text-blue-900 uppercase">{service.provider?.name || 'Manual'}</div>
                  </div>
                </div>
                <div className="space-y-1 px-1">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-gray-400 uppercase">Provider ID:</span>
                    <span className="text-gray-900 font-black">{service.provider_service_id || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-2xl flex gap-3 border border-orange-100">
                <AlertCircle className="text-orange-500 shrink-0" size={18} />
                <p className="text-[10px] font-bold text-orange-900 leading-relaxed uppercase tracking-tight">
                  Changing the mapping ID manually may break orders. Sync from provider services instead.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-white space-y-6">
            <h2 className="text-lg font-black uppercase tracking-tight">Quantity Limits</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Min</label>
                <input 
                  type="number" 
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-xs font-black focus:ring-2 focus:ring-purple-100"
                  value={formData.min_quantity}
                  onChange={(e) => setFormData({...formData, min_quantity: parseInt(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Max</label>
                <input 
                  type="number" 
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-xs font-black focus:ring-2 focus:ring-purple-100"
                  value={formData.max_quantity}
                  onChange={(e) => setFormData({...formData, max_quantity: parseInt(e.target.value)})}
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-white space-y-6">
            <h2 className="text-lg font-black uppercase tracking-tight">Visibility</h2>
            <div className="flex gap-2">
              {['active', 'inactive'].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFormData({...formData, status})}
                  className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                    formData.status === status 
                      ? status === 'active' ? 'bg-green-600 border-green-600 text-white shadow-lg' : 'bg-red-600 border-red-600 text-white shadow-lg'
                      : 'bg-white border-gray-100 text-gray-400'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <button 
            type="submit"
            className="w-full gradient-primary text-white py-6 rounded-[32px] font-black text-sm uppercase tracking-widest shadow-2xl shadow-blue-100 hover:shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
          >
            <Save size={20} /> Update Service
          </button>
        </div>
      </form>
    </div>
  );
}
