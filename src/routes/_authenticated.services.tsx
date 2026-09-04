import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Search, RefreshCw, Zap, Globe, Send } from "lucide-react";
import * as LucideIcons from "lucide-react";
import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrencySettings } from "@/lib/settings.functions";
import { listPublicServices } from "@/lib/services.functions";

function InstagramIcon({ className }: { className?: string | undefined }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2Zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 8.25a3.25 3.25 0 1 1 0-6.5 3.25 3.25 0 0 1 0 6.5ZM17.25 5.25a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Z" />
    </svg>
  );
}
function FacebookIcon({ className }: { className?: string | undefined }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
    </svg>
  );
}
function YoutubeIcon({ className }: { className?: string | undefined }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.51 3.5 12 3.5 12 3.5s-7.51 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.87.55 9.38.55 9.38.55s7.51 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.81ZM9.6 15.6V8.4l6.27 3.6-6.27 3.6Z" />
    </svg>
  );
}

const IconRenderer = ({ iconName, fallbackIcon: FallbackIcon, className }: { iconName?: string | null, fallbackIcon: any, className?: string }) => {
  if (!iconName) return <FallbackIcon className={className} />;
  if (iconName.startsWith('http') || iconName.startsWith('/')) return <img src={iconName} className={className} alt="" />;
  const IconComponent = (LucideIcons as any)[iconName];
  if (IconComponent) return <IconComponent className={className} />;

  const lowerName = iconName.toLowerCase();
  if (lowerName.includes('instagram')) return <InstagramIcon className={className} />;
  if (lowerName.includes('facebook')) return <FacebookIcon className={className} />;
  if (lowerName.includes('youtube')) return <YoutubeIcon className={className} />;
  if (lowerName.includes('telegram')) return <Send className={className} />;
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
