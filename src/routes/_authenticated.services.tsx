import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Search, RefreshCw, Zap, Globe } from "lucide-react";
import * as LucideIcons from "lucide-react";
import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrencySettings } from "@/lib/settings.functions";
import { listPublicServices } from "@/lib/services.functions";

import instagramAsset from "@/assets/instagram.png.asset.json";
import facebookAsset from "@/assets/facebook.png.asset.json";
import youtubeAsset from "@/assets/youtube.png.asset.json";
import telegramAsset from "@/assets/telegram.png.asset.json";

const IconRenderer = ({ iconName, fallbackIcon: FallbackIcon, className }: { iconName?: string | null, fallbackIcon: any, className?: string }) => {
  if (!iconName) return <FallbackIcon className={className} />;
  if (iconName.startsWith('http') || iconName.startsWith('/')) return <img src={iconName} className={className} alt="" />;
  const IconComponent = (LucideIcons as any)[iconName];
  if (IconComponent) return <IconComponent className={className} />;

  const lowerName = iconName.toLowerCase();
  if (lowerName.includes('instagram')) return <img src={instagramAsset.url} className={className} alt="" />;
  if (lowerName.includes('facebook')) return <img src={facebookAsset.url} className={className} alt="" />;
  if (lowerName.includes('youtube')) return <img src={youtubeAsset.url} className={className} alt="" />;
  if (lowerName.includes('telegram')) return <img src={telegramAsset.url} className={className} alt="" />;
  return <FallbackIcon className={className} />;
};

function ServicesPage() {
  const [services, setServices] = React.useState<any[]>([]);
  const [categories, setCategories] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string>("all");
  const [currencySettings, setCurrencySettings] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [servicesJson, catsRes, settingsJson] = await Promise.all([
        listPublicServices(),
        supabase.from('service_categories').select('*').eq('status', 'active').eq('service_type', 'api').order('display_order'),
        getCurrencySettings()
      ]);

      const parsed = JSON.parse(servicesJson);
      const cats = catsRes.data ?? [];
      const catMap: Record<string, any> = {};
      cats.forEach((c: any) => { catMap[c.id] = c; });

      setServices((parsed.data ?? []).map((s: any) => ({ ...s, category: catMap[s.category_id] ?? null })));
      setCategories(cats);
      setCurrencySettings(JSON.parse(settingsJson));
      setLoading(false);
    };
    fetchData();
  }, []);


  const currencySymbols: Record<string, string> = {
    'PKR': 'Rs.',
    'USD': '$',
    'USDT': '₮'
  };
  const currentSymbol = currencySymbols[currencySettings?.customer_currency] || 'Rs.';

  const filteredServices = services.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (s.category?.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategoryId === "all" || s.category_id === selectedCategoryId;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/dashboard" className="w-10 h-10 flex items-center justify-center glass-white rounded-full transition-all active:scale-90">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">Service List</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Browse all available services</p>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 glass-white border border-white/50 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          <button 
            onClick={() => setSelectedCategoryId("all")}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              selectedCategoryId === "all" ? "bg-primary text-white shadow-lg shadow-primary/20" : "glass-white text-muted-foreground"
            }`}
          >
            All Services
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                selectedCategoryId === cat.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "glass-white text-muted-foreground"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="py-20 flex justify-center">
            <RefreshCw className="animate-spin text-primary" size={32} />
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="py-20 text-center glass-white rounded-[2rem] border border-dashed border-white/50">
            <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">No services found</p>
          </div>
        ) : (
          filteredServices.map(service => (
            <div key={service.id} className="glass-white p-4 rounded-2xl border border-white/50 card-shadow flex items-center justify-between group hover:bg-white transition-all">
              <div className="flex items-center gap-4 min-w-0 pr-4">
                <div className="w-10 h-10 flex items-center justify-center shrink-0">
                  <IconRenderer 
                    iconName={service.icon || service.category?.icon} 
                    fallbackIcon={Zap} 
                    className="w-full h-full object-contain text-blue-500" 
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-sm text-foreground tracking-tight leading-tight truncate">{service.name}</h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{service.category?.name || "Uncategorized"}</p>
                </div>
              </div>
              
              <div className="text-right shrink-0">
                <p className="text-sm font-black text-primary font-mono">{currentSymbol}{Number(service.price_per_1000).toFixed(2)}</p>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">Per 1,000</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/services")({ component: ServicesPage });
