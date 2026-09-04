import { createFileRoute, Outlet, Link, useLocation, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { getCurrencySettings } from "@/lib/settings.functions";
import { DEFAULT_CUSTOMER_CURRENCY, getCurrencySymbol } from "@/lib/currency.constants";
import { 
  PlusCircle, 
  ListOrdered, 
  Menu as MenuIcon, 
  User, 
  Wallet, 
  History, 
  LifeBuoy, 
  LogOut, 
  Bell, 
  Home, 
  ArrowRight, 
  Settings, 
  ShoppingBag, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Plus, 
  Construction,
  MessageSquare,
  Smartphone,
  ShieldCheck
} from "lucide-react";
import React from "react";
import { signOut } from "@/lib/auth/auth.functions";
import { clearClientSession } from "@/lib/auth/client-session";
import { supabase } from "@/integrations/supabase/client";
import { getSession } from "@/lib/auth/session.functions";
import { useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    const session = await getSession();
    
    // Skip auth check for management paths as they have their own gate
    if (location.pathname.startsWith('/management')) {
      console.log("[AuthGuard] Management path detected, skipping layout guard");
      return;
    }

    if (!session?.user) {
      console.warn("[AuthGuard] No session found, redirecting to login from:", location.href);
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const router = useRouter();
  const loaderData = router.state.matches.find((m: any) => m.routeId === '__root__')?.loaderData as any;
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();
  const currentPath = location.pathname;

  // CRITICAL: If the current URL path is /management, this layout MUST NOT block anything.
  if (typeof window !== 'undefined' && (window.location.pathname.startsWith('/management') || window.location.pathname.startsWith('/auth/callback'))) {
    return <Outlet />;
  }

  const { data: currencySettings, isLoading: settingsLoading } = useSuspenseQuery({
    queryKey: ['currencySettings'],
    queryFn: async () => {
      try {
        const res = await getCurrencySettings();
        return typeof res === 'string' ? JSON.parse(res) : res;
      } catch (e) {
        console.error("Layout settings error:", e);
        return { customer_currency: DEFAULT_CUSTOMER_CURRENCY };
      }
    }
  });

  const { data: session, isLoading: sessionLoading } = useSuspenseQuery({
    queryKey: ['session'],
    queryFn: () => getSession()
  });


  const currentSymbol = getCurrencySymbol(
    currencySettings?.currency_code || currencySettings?.customer_currency || DEFAULT_CUSTOMER_CURRENCY,
    { [currencySettings?.currency_code]: currencySettings?.currency_symbol }
  );
  const walletBalance = session?.user?.wallet_balance ?? 0;

  const navigate = useNavigate();

  React.useEffect(() => {
    const isManagement = window.location.pathname.startsWith('/management');
    if (isManagement) return;

    // Auth is already enforced authoritatively in beforeLoad (server-side,
    // cookie-backed getSession()) before this component ever mounts.
    // We only need to handle bouncing an already-logged-in user off /login or /register.
    if (!sessionLoading && session?.user && (currentPath.startsWith('/login') || currentPath.startsWith('/register'))) {
      console.log("[AuthenticatedLayout] User logged in on auth page, redirecting to dashboard");
      navigate({ to: "/dashboard" });
    }
  }, [session, sessionLoading, currentPath, navigate]);

  const handleLogout = async () => {
    await signOut();
    await clearClientSession();
    window.location.href = "/login";
  };


  if (sessionLoading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Loading Platform...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {typeof window !== 'undefined' && localStorage.getItem('is_impersonating') === 'true' && (
        <div className="bg-blue-600 text-white px-4 py-2 flex items-center justify-between z-[100] sticky top-0">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
            <ShieldCheck size={14} />
            Viewing account as Admin
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem('is_impersonating');
              window.location.href = "/management/users";
            }}
            className="bg-white text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-colors"
          >
            Return to Management
          </button>
        </div>
      )}
      <header className="flex items-center justify-between px-6 py-4 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          {loaderData?.logo_url ? (
            <img src={loaderData.logo_url} alt={loaderData?.brand_name} className="h-8 w-auto object-contain" />
          ) : (
            <div className="bg-black text-white px-3 py-1 rounded-lg flex items-center gap-1 font-black text-sm uppercase shadow-lg">
              {loaderData?.brand_name || "SMM Panel"} <span className="text-yellow-400">★</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link to="/add-funds" className="bg-yellow-400/90 backdrop-blur-md px-3 py-1 rounded-full text-black font-black text-xs shadow-lg border border-white/20 flex items-center gap-1">
            <Wallet size={12} className="fill-black" />
            {currentSymbol}{walletBalance.toFixed(2)}
          </Link>
        </div>
      </header>

      {/* Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 bottom-[76px] z-30 flex flex-col bg-background animate-in fade-in duration-200">
          <header className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2">
              {loaderData?.logo_url ? (
                <img src={loaderData.logo_url} alt={loaderData?.brand_name} className="h-8 w-auto object-contain" />
              ) : (
                <div className="bg-black text-white px-3 py-1 rounded-lg flex items-center gap-1 font-black text-sm uppercase">
                  {loaderData?.brand_name || "SMM Panel"} <span className="text-yellow-400">★</span>
                </div>
              )}
            </div>
            <div className="bg-yellow-400/90 px-3 py-1 rounded-full text-black font-black text-xs flex items-center gap-1">
              <Wallet size={12} className="fill-black" />
              {currentSymbol}{walletBalance.toFixed(2)}
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-white relative flex flex-col items-center justify-center gap-4 text-center">
              <div className="absolute top-4 left-4">
                <div className="w-12 h-12 rounded-full border-2 border-pink-500 p-0.5 relative">
                  <div className="w-full h-full rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                    <User size={24} className="text-gray-400" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-1">
                <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">Your User ID</span>
                <div className="text-xl font-black tracking-tight">{session?.user?.mobile_number || "Guest"}</div>
              </div>

              <button 
                onClick={() => {
                  if (session?.user?.mobile_number) {
                    navigator.clipboard.writeText(session.user.mobile_number);
                    toast.success("Copied to clipboard");
                  }
                }}
                className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 border border-green-500 rounded-lg text-green-500 text-[10px] font-black uppercase tracking-widest"
              >
                <CheckCircle2 size={12} />
                Copy
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Profile", to: "/profile", icon: User },
                { label: "My Orders", to: "/orders", icon: History },
                { label: "Add Funds", to: "/add-funds", icon: Wallet },
                { label: "Balance History", to: "/balance-history", icon: ShoppingBag },
                { label: "Support", labelDesktop: "WhatsApp Support", to: "/support", icon: MessageSquare },
                { label: "Refer and earn", to: "/refer", icon: ArrowRight, color: "bg-green-100 text-green-800 border-green-200", badge: true },
                { label: "Install App", to: "/install-app", icon: Smartphone },
              ].map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-3 p-4 bg-white rounded-2xl shadow-sm border border-white transition-all active:scale-95 ${item.color || ""}`}
                >
                  <div className={`${item.badge ? "text-green-800" : "text-black"}`}>
                    <item.icon size={18} />
                  </div>
                  <span className="text-sm font-black tracking-tight whitespace-nowrap md:hidden">{item.label}</span>
                  <span className="hidden md:inline text-sm font-black tracking-tight whitespace-nowrap">{item.labelDesktop || item.label}</span>
                </Link>
              ))}
            </div>

            <div className="pt-8 text-center space-y-4">
              <div className="text-[10px] font-black text-blue-900/40 uppercase tracking-widest">This website has</div>
              <div className="flex flex-col gap-2">
                <Link to="/" className="text-xs font-black uppercase tracking-tight">Terms and Conditions</Link>
                <Link to="/" className="text-xs font-black uppercase tracking-tight">Privacy Policy</Link>
              </div>
            </div>

            <div className="pt-4 pb-10">
              <button 
                onClick={handleLogout}
                className="w-full py-4 text-xs font-black uppercase tracking-widest text-destructive"
              >
                Logout Account
              </button>
            </div>
          </main>

          <a 
            href={`https://wa.me/${(currencySettings as any)?.whatsapp_number || "923154429417"}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="fixed bottom-28 right-6 w-14 h-14 bg-green-500 rounded-full shadow-lg flex items-center justify-center text-white z-50 animate-bounce"
          >
            <MessageSquare size={28} className="fill-white" />
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold">1</div>
          </a>
        </div>
      )}

      <main className="p-4 md:p-8 max-w-5xl mx-auto">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-border/40 px-4 py-3 flex justify-between items-center z-40 safe-area-pb">
        <Link 
          to="/orders" 
          onClick={() => setIsMenuOpen(false)}
          activeProps={{ className: "bg-primary/10 text-primary shadow-sm shadow-primary/10" }}
          inactiveProps={{ className: "text-muted-foreground hover:bg-muted/60" }}
          className="group flex flex-col items-center justify-center gap-1.5 min-w-[72px] px-4 py-2.5 rounded-2xl bg-muted/40 transition-all duration-200 active:scale-95"
        >
          <History size={22} strokeWidth={2} className="transition-transform duration-200 group-hover:scale-110" />
          <span className="text-[10px] font-bold uppercase tracking-wide">Orders</span>
        </Link>
        <Link 
          to="/create-order" 
          onClick={() => setIsMenuOpen(false)}
          activeProps={{ className: "scale-105" }}
          className="flex-1 max-w-[200px] mx-4"
        >
          <div className="gradient-primary py-3.5 rounded-full flex items-center justify-center text-white shadow-xl shadow-primary/30 transform transition-transform active:scale-95 gap-2 px-4">
            <Plus size={18} strokeWidth={3} />
            <span className="text-xs font-black uppercase tracking-widest">Create Order</span>
          </div>
        </Link>
        <button 
          onClick={() => setIsMenuOpen((v) => !v)}
          className={`group flex flex-col items-center justify-center gap-1.5 min-w-[72px] px-4 py-2.5 rounded-2xl transition-all duration-200 active:scale-95 ${
            isMenuOpen ? "bg-primary/10 text-primary shadow-sm shadow-primary/10" : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
          }`}
        >
          <MenuIcon size={22} strokeWidth={2} className="transition-transform duration-200 group-hover:scale-110" />
          <span className="text-[10px] font-bold uppercase tracking-wide">Menu</span>
        </button>
      </nav>
    </div>
  );
}
