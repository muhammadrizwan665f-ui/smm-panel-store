import { createFileRoute } from "@tanstack/react-router";
import { getCurrencySettings } from "@/lib/settings.functions";
import { listPublicServices } from "@/lib/services.functions";
import { listManualCatalog, createManualOrder } from "@/lib/manual/manual.functions";

import * as LucideIcons from "lucide-react";
import {
  Music2,
  MessageSquare,
  Ghost,
  Globe,
  ArrowLeft,
  ChevronRight,
  Monitor,
  Heart,
  Eye,
  Users,
  RefreshCw,
} from "lucide-react";
import React from "react";
import { supabase } from "@/integrations/supabase/client";
import instagramAsset from "@/assets/instagram.png.asset.json";
import facebookAsset from "@/assets/facebook.png.asset.json";
import youtubeAsset from "@/assets/youtube.png.asset.json";
import telegramAsset from "@/assets/telegram.png.asset.json";
import { toast } from "sonner";
import { isImageIcon } from "@/lib/upload-icon";


export const Route = createFileRoute("/_authenticated/create-order")({
  component: NewOrderPage,
});

const QUANTITY_STEPS = [
  200, 300, 500, 1000, 2000, 4000, 5000, 10000, 15000, 20000, 25000, 30000,
  40000, 50000, 100000, 200000, 500000, 1000000, 2000000,
];

const formatQty = (q: number) => {
  if (q >= 1000000) return `${q / 1000000} Million`;
  if (q >= 1000) return `${q / 1000}k`;
  return `${q}`;
};

const IconRenderer = ({ iconName, fallbackIcon: FallbackIcon, className }: { iconName?: string | null, fallbackIcon: any, className?: string }) => {
  if (!iconName) return <FallbackIcon className={className} />;

  // Uploaded image icons (URL or path)
  if (isImageIcon(iconName)) return <img src={iconName} className={`${className ?? ""} object-contain`} alt="" />;

  // Check if it's a valid Lucide icon name
  const IconComponent = (LucideIcons as any)[iconName];
  if (IconComponent) return <IconComponent className={className} />;

  
  // Check for common platform names and use assets
  const lowerName = iconName.toLowerCase();
  if (lowerName.includes('instagram')) return <img src={instagramAsset.url} className={className} alt="" />;
  if (lowerName.includes('facebook')) return <img src={facebookAsset.url} className={className} alt="" />;
  if (lowerName.includes('youtube')) return <img src={youtubeAsset.url} className={className} alt="" />;
  if (lowerName.includes('telegram')) return <img src={telegramAsset.url} className={className} alt="" />;
  
  return <FallbackIcon className={className} />;
};

function NewOrderPage() {
  const [categories, setCategories] = React.useState<any[]>([]);
  const [dbServices, setDbServices] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedCategory, setSelectedCategory] = React.useState<any | null>(null);
  const [selectedService, setSelectedService] = React.useState<any | null>(null);
  const [quantity, setQuantity] = React.useState<number | null>(null);
  const [link, setLink] = React.useState("");
  const [currencySettings, setCurrencySettings] = React.useState<any>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [mode, setMode] = React.useState<"api" | "manual">("api");
  const [manualCategories, setManualCategories] = React.useState<any[]>([]);
  const [manualServices, setManualServices] = React.useState<any[]>([]);
  const [whatsapp, setWhatsapp] = React.useState("");
  const [note, setNote] = React.useState("");
  const [manualQty, setManualQty] = React.useState(1);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [catsRes, servicesJson, settingsJson, manualJson] = await Promise.all([
          supabase.from('service_categories').select('*').eq('status', 'active').eq('service_type', 'api').order('display_order'),
          listPublicServices(),
          getCurrencySettings(),
          listManualCatalog()
        ]);

        try {
          const manual = JSON.parse(manualJson);
          if (manual?.success) {
            setManualCategories(manual.data.categories ?? []);
            setManualServices(manual.data.services ?? []);
          }
        } catch { /* ignore manual catalog errors */ }

        if (catsRes.error) throw catsRes.error;

        const cats = catsRes.data ?? [];
        const catMap: Record<string, any> = {};
        cats.forEach((c: any) => { catMap[c.id] = c; });

        setCategories(cats);
        const parsed = JSON.parse(servicesJson);
        setDbServices((parsed.data ?? []).map((s: any) => ({ ...s, category: catMap[s.category_id] ?? null })));

        if (settingsJson) {
          setCurrencySettings(JSON.parse(settingsJson));
        }
      } catch (err: any) {
        console.error("Order page fetch error:", err);
        toast.error("Failed to load services. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const currentSymbol = currencySettings?.currency_symbol || (currencySettings?.customer_currency === 'PKR' ? 'Rs.' : 'Rs.');

  const getServicesForCategory = (catId: string) => {
    return mode === "manual"
      ? manualServices.filter(s => s.category_id === catId)
      : dbServices.filter(s => s.category_id === catId);
  };

  const activeCategories = mode === "manual" ? manualCategories : categories;

  const manualTotal = selectedService
    ? Number(selectedService.fixed_price || 0) * (selectedService.allow_quantity ? manualQty : 1)
    : 0;

  const handleManualSubmit = async () => {
    if (!selectedService || !whatsapp.trim()) return;
    setSubmitting(true);
    try {
      const res = JSON.parse(await createManualOrder({
        data: {
          serviceId: selectedService.id,
          whatsapp: whatsapp.trim(),
          quantity: selectedService.allow_quantity ? manualQty : 1,
          note: note.trim() || undefined,
        },
      }));
      if (!res.success) throw new Error(res.message);
      toast.success("Order placed! We will contact you on WhatsApp shortly.");
      setSelectedCategory(null);
      setSelectedService(null);
      setWhatsapp("");
      setNote("");
      setManualQty(1);
    } catch (error: any) {
      toast.error("Order failed: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOrderSubmit = async () => {
    if (!selectedService || !quantity || !link.trim()) return;
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in again");

      // Check balance first
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('id', user.id)
        .single();
      
      if (profileError) throw profileError;

      const price = (Number(selectedService.price_per_1000) * quantity) / 1000;
      if (Number(profile.wallet_balance || 0) < price) {
        throw new Error(`Insufficient balance. You need ${currentSymbol}${price.toFixed(2)} but have ${currentSymbol}${Number(profile.wallet_balance || 0).toFixed(2)}`);
      }

      // Create order with provider_id from service
      console.log("[handleOrderSubmit] Inserting internal order for user", user.id);
      const { data: order, error: orderError } = await supabase.from('orders').insert({
        user_id: user.id,
        service_id: selectedService.id,
        provider_id: selectedService.provider_id,
        service_name: selectedService.name,
        link: link.trim(),
        quantity: quantity,
        price: price,
        status: 'pending'
      }).select('*').single();

      if (orderError) {
        console.error("[handleOrderSubmit] Order insertion failed:", orderError);
        throw orderError;
      }

      if (!order || !order.id) {
        console.error("[handleOrderSubmit] Order inserted but no ID returned");
        throw new Error("Order creation failed - No ID returned from database");
      }

      console.log("[handleOrderSubmit] Internal order created successfully, ID:", order.id);

      // Call the server function to place the order with the provider
      const { placeProviderOrder } = await import("@/lib/providers/order.functions");
      try {
        console.log("[handleOrderSubmit] Calling placeProviderOrder for ID:", order.id);
        const responseJson = await placeProviderOrder({ data: { orderId: order.id } });
        const response = JSON.parse(responseJson);
        
        if (response.order) {
          toast.success(`Order placed successfully! Provider ID: ${response.order}`);
        } else {
          toast.success("Order submitted and is being processed.");
        }
      } catch (submitError: any) {
        console.error("[handleOrderSubmit] Provider submission error:", submitError);
        toast.error("Order placed but provider submission failed: " + submitError.message + ". Support will review it.");
      }

      // Reset state
      setSelectedCategory(null);
      setSelectedService(null);
      setQuantity(null);
      setLink("");
    } catch (error: any) {
      toast.error("Order failed: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    if (selectedService) {
      setSelectedService(null);
      setQuantity(null);
      setLink("");
      setWhatsapp("");
      setNote("");
      setManualQty(1);
    } else setSelectedCategory(null);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <RefreshCw className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  /* STEP 1 — Categories */
  if (!selectedCategory) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col items-center gap-1 text-center mb-4">
          <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Select Category</h2>
        </div>

        <div className="max-w-md mx-auto grid grid-cols-2 gap-2 mb-4">
          {([["api", "SMM Services"], ["manual", "Subscriptions"]] as const).map(([m, label]) => (
            <button
              key={m}
              onClick={() => { setMode(m); setSelectedCategory(null); setSelectedService(null); }}
              className={`py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                mode === m ? "bg-primary text-white shadow-lg shadow-primary/20" : "glass-white text-muted-foreground border border-white/50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="max-w-md mx-auto space-y-3">
          {activeCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat)}
              className="w-full glass-white p-4 px-6 rounded-2xl card-shadow border border-white/50 flex items-center justify-between transition-all hover:bg-white active:scale-95 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 flex items-center justify-center transition-transform group-hover:scale-110">
                  <IconRenderer 
                    iconName={cat.icon} 
                    fallbackIcon={Globe} 
                    className="w-full h-full object-contain text-primary" 
                  />
                </div>
                <span className="font-black text-lg text-foreground tracking-tight">{cat.name}</span>
              </div>
              <ChevronRight className="text-primary w-5 h-5" />
            </button>
          ))}
          {activeCategories.length === 0 && (
            <div className="text-center py-10 text-muted-foreground font-bold uppercase tracking-widest text-xs">
              No categories available yet
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
      <div className="relative flex items-center">
        <button
          onClick={goBack}
          className="absolute left-0 w-10 h-10 flex items-center justify-center text-foreground transition-all active:scale-90"
        >
          <ArrowLeft size={24} strokeWidth={3} />
        </button>
        <h1 className="w-full text-center text-xl font-black text-foreground tracking-tight px-12">
          {selectedService
            ? selectedService.name
            : `${selectedCategory.name} Services`}
        </h1>
      </div>

      {/* STEP 2 — Services in selected category */}
      {!selectedService && (
        <div className="max-w-md mx-auto space-y-3">
          {getServicesForCategory(selectedCategory.id).map((service) => (
            <button
              key={service.id}
              onClick={() => setSelectedService(service)}
              className="w-full glass-white p-4 px-6 rounded-2xl card-shadow border border-white/50 flex items-center justify-between transition-all hover:bg-white active:scale-95 group"
            >
              <div className="flex items-center gap-4 min-w-0 pr-4">
                <div className="w-10 h-10 flex items-center justify-center transition-transform group-hover:scale-110 shrink-0">
                  <IconRenderer 
                    iconName={service.icon || selectedCategory.icon} 
                    fallbackIcon={Zap} 
                    className="w-full h-full object-contain text-blue-500" 
                  />
                </div>
                <div className="text-left min-w-0">
                  <span className="font-black text-sm text-foreground tracking-tight leading-tight block truncate">
                    {service.name}
                  </span>
                  <span className="text-[10px] font-bold text-primary">
                    {mode === "manual"
                      ? `${currentSymbol}${Number(service.fixed_price || 0).toFixed(0)}`
                      : `${currentSymbol}${Number(service.price_per_1000).toFixed(2)} / 1k`}
                  </span>
                </div>
              </div>
              <ChevronRight className="text-primary w-5 h-5 shrink-0" />
            </button>
          ))}
          {getServicesForCategory(selectedCategory.id).length === 0 && (
            <div className="text-center py-10 text-gray-400 font-bold uppercase tracking-widest text-xs">
              No services found in this category
            </div>
          )}
        </div>
      )}

      {/* STEP 3 — Manual product order */}
      {selectedService && mode === "manual" && (
        <div className="max-w-sm mx-auto space-y-5">
          <div className="glass-white p-4 rounded-2xl border border-white/60">
            <h3 className="text-xs font-black uppercase text-muted-foreground mb-2">Details</h3>
            <p className="text-sm font-bold text-foreground whitespace-pre-line">
              {selectedService.description || "Premium subscription delivered manually on WhatsApp."}
            </p>
          </div>

          {selectedService.allow_quantity && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-foreground/70 ml-1">Quantity</label>
              <input
                type="number"
                min={1}
                value={manualQty}
                onChange={(e) => setManualQty(Math.max(1, Number(e.target.value) || 1))}
                className="w-full bg-white border border-primary/30 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-foreground/70 ml-1">Your WhatsApp Number</label>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="e.g. 03001234567"
              className="w-full bg-white border border-primary/30 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-foreground/70 ml-1">Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any detail we should know (email, plan, etc.)"
              className="w-full bg-white border border-primary/30 rounded-xl px-4 py-3 text-xs font-bold min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50"
            />
          </div>

          <div className="bg-green-50 border border-green-300 rounded-2xl p-4 flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black text-green-800 uppercase tracking-widest">Total Price</p>
              <p className="text-lg font-black text-green-900">{currentSymbol}{manualTotal.toFixed(0)}</p>
            </div>
            <p className="text-[10px] font-black text-green-800 uppercase tracking-widest text-right max-w-[45%]">
              Delivered on WhatsApp
            </p>
          </div>

          <button
            onClick={handleManualSubmit}
            disabled={!whatsapp.trim() || submitting}
            className="w-full bg-gradient-to-b from-green-700 to-green-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-green-100 transition-all active:scale-95 disabled:opacity-50"
          >
            {submitting ? "Processing..." : "Buy Now"}
          </button>
        </div>
      )}

      {/* STEP 3 — Quantity and Order Details */}
      {selectedService && mode === "api" && (
        <div className="max-w-sm mx-auto space-y-5">
          <div className="glass-white p-4 rounded-2xl border border-white/60 mb-4">
            <h3 className="text-xs font-black uppercase text-gray-400 mb-2">Service Info</h3>
            <p className="text-sm font-bold text-foreground">{selectedService.description || "Premium quality service with fast delivery."}</p>
            <div className="flex gap-4 mt-3">
              <div className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">Min: {selectedService.min_quantity}</div>
              <div className="text-[10px] font-black uppercase text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">Max: {selectedService.max_quantity}</div>
            </div>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            <label className="text-[11px] font-black text-foreground/70 ml-1">Quick Select Quantity</label>
            {QUANTITY_STEPS.filter(q => q >= selectedService.min_quantity && q <= selectedService.max_quantity).map((q) => {
              const active = quantity === q;
              return (
                <button
                  key={q}
                  onClick={() => setQuantity(q)}
                  className={`w-full flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 border transition-all active:scale-[0.98] ${
                    active
                      ? "bg-white border-green-500 border-2 shadow-md"
                      : "glass-white border-white/60 card-shadow hover:bg-white"
                  }`}
                >
                  <span className="text-[11px] font-bold text-foreground truncate text-left">
                    {formatQty(q)} {selectedService.name}
                  </span>
                  <span className="text-[11px] font-black text-foreground shrink-0">
                    {currentSymbol}{((Number(selectedService.price_per_1000) * q) / 1000).toFixed(2)}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-foreground/70 ml-1">Custom Quantity</label>
              <input
                type="number"
                value={quantity || ""}
                onChange={(e) => setQuantity(Number(e.target.value))}
                placeholder={`Enter amount (${selectedService.min_quantity} - ${selectedService.max_quantity})`}
                className="w-full bg-white border border-primary/30 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-foreground/70 ml-1">Order Link</label>
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="Paste your link here"
                className="w-full bg-white border border-primary/30 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50"
              />
            </div>

            <button
              onClick={handleOrderSubmit}
              disabled={!link.trim() || !quantity || submitting || quantity < selectedService.min_quantity || quantity > selectedService.max_quantity}
              className="w-full bg-gradient-to-b from-green-700 to-green-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-green-100 transition-all active:scale-95 disabled:opacity-50"
            >
              {submitting ? "Processing..." : "Submit Order"}
            </button>

            {quantity && (
              <div className="bg-green-50 border border-green-300 rounded-2xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black text-green-800 uppercase tracking-widest">Total Price</p>
                  <p className="text-lg font-black text-green-900">{currentSymbol}{((Number(selectedService.price_per_1000) * quantity) / 1000).toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-green-800 uppercase tracking-widest">Quantity</p>
                  <p className="text-sm font-black text-green-900">{quantity.toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const Zap = LucideIcons.Zap;
