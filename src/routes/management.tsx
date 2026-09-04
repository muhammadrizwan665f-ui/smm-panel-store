import { createFileRoute, Outlet, useLocation, useNavigate, redirect, useRouter } from "@tanstack/react-router";
import React from "react";
import { 
  LayoutDashboard, 
  Users, 
  ShoppingCart, 
  Package, 
  Layers, 
  CreditCard, 
  BarChart3, 
  Bell, 
  LifeBuoy, 
  Settings, 
  LogOut,
  Menu,
  X,
  History,
  TrendingUp,
  Wallet,
  Database,
  PlusCircle,
  ShieldCheck
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { AdminErrorBoundary } from "@/components/admin/AdminErrorBoundary";
import { supabase } from "@/integrations/supabase/client";
import { getSession } from "@/lib/auth/session.functions";

export const Route = createFileRoute("/management")({
  ssr: false, 
  beforeLoad: async ({ location }) => {
    // Basic redirect for root paths
    if (location.pathname === '/management/index' || location.pathname === '/management/') {
       throw redirect({ to: '/management' });
    }
  },
  loader: async () => {
    const sessionResult = await getSession();
    return { sessionResult };
  },
  component: ManagementLayout,
});

export default function ManagementLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const router = useRouter();
  const loaderData = router.state.matches.find((m: any) => m.routeId === '__root__')?.loaderData as any;
  const { sessionResult } = Route.useLoaderData();

  const brandName = loaderData?.brand_name || "SMM Panel";
  const logoUrl = loaderData?.logo_url;

  const [authState, setAuthState] = React.useState<"checking" | "allowed" | "denied">("checking");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // If we already have the loader data, use it immediately
    if (sessionResult?.role === 'admin') {
      setAuthState("allowed");
    } else if (sessionResult && (sessionResult.role as string) !== 'admin') {
      setAuthState("denied");
      if (!window.location.pathname.includes('/management/login')) {
        navigate({ to: "/management/login", search: { redirect: window.location.pathname } as any });
      }
    } else {
      // If sessionResult is null/checking, double check with getSession again just in case
      const verify = async () => {
        const res = await getSession();
        if (res?.role === 'admin') {
          setAuthState("allowed");
        } else {
          setAuthState("denied");
          if (!window.location.pathname.includes('/management/login')) {
            navigate({ to: "/management/login", search: { redirect: window.location.pathname } as any });
          }
        }
      };
      verify();
    }
  }, [sessionResult, navigate]);

  if (authState === "checking") {
    if (typeof window !== 'undefined' && window.location.pathname.includes('/management/login')) {
      return <Outlet />;
    }
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Verifying Admin Access...</p>
      </div>
    );
  }

  if (authState === "denied" && error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <div className="bg-white p-8 rounded-3xl border shadow-sm space-y-4 max-w-sm">
          <div className="text-red-500 font-black uppercase tracking-widest text-lg">Access Restricted</div>
          <p className="text-xs text-red-700 font-medium">{error}</p>
          <button onClick={() => window.location.reload()} className="w-full py-3 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-widest">Retry</button>
        </div>
      </div>
    );
  }

  if (authState !== "allowed") {
    console.log("[ManagementLayout] Not allowed, state:", authState, "path:", typeof window !== 'undefined' ? window.location.pathname : 'server');
    if (typeof window !== 'undefined' && window.location.pathname.includes('/management/login')) {
       return <Outlet />;
    }
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
           <div className="bg-white p-8 rounded-3xl border shadow-sm space-y-4 max-w-sm">
             <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Access Restricted</div>
             <p className="text-xs text-gray-500 font-medium">You do not have administrative privileges.</p>
             <button onClick={() => navigate({ to: "/management/login", search: { redirect: undefined } as any })} className="w-full py-3 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-widest">Return to Login</button>
           </div>
        </div>
     );
  }


  const menuItems = [
    { label: "Dashboard", to: "/management", icon: LayoutDashboard },
    { label: "Orders", to: "/management/orders", icon: ShoppingCart },
    { label: "Services", to: "/management/services", icon: Package },
    { label: "Categories", to: "/management/categories", icon: Layers },
    { label: "Manual Products", to: "/management/manual-services", icon: Package },
    { label: "Manual Orders", to: "/management/manual-orders", icon: ShoppingCart },
    { label: "Providers", to: "/management/providers", icon: Database },
    { label: "Provider Services", to: "/management/provider-services", icon: PlusCircle },
    { label: "Service Mapping", to: "/management/mapping", icon: ShieldCheck },
    { label: "Users", to: "/management/users", icon: Users },
    { label: "Transactions", to: "/management/transactions", icon: History },
    { label: "Payments", to: "/management/payments", icon: CreditCard },
    { label: "Referrals", to: "/management/referrals", icon: Users },

    { label: "API Logs", to: "/management/api-logs", icon: ShieldCheck },
    { label: "Reports", to: "/management/reports", icon: BarChart3 },
    { label: "Settings", to: "/management/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row relative">
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b sticky top-0 z-[60]">
        <div className="font-black text-xl tracking-tighter text-blue-600">
          {logoUrl ? <img src={logoUrl} alt={brandName} className="h-8 w-auto inline-block mr-2" /> : brandName} Management
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>{isSidebarOpen ? <X /> : <Menu />}</button>
      </div>

      <aside className={`fixed inset-0 z-[50] bg-white border-r transform transition-transform duration-300 md:relative md:translate-x-0 md:w-64 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 hidden md:block">
          <div className="font-black text-2xl tracking-tighter text-blue-600">
            {logoUrl ? <img src={logoUrl} alt={brandName} className="h-10 w-auto mb-2" /> : brandName}
            <div className="text-[10px] uppercase tracking-widest text-gray-400">Management</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
          {menuItems.map((item) => (
            <Link key={item.to} to={item.to} onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors" activeProps={{ className: "bg-blue-50 text-blue-600" }}>
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <button onClick={async () => { const { signOut } = await import("@/lib/auth/auth.functions"); await signOut(); window.location.href = "/login"; }} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-colors">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 relative z-10">
        <div className="max-w-7xl mx-auto">
          <AdminErrorBoundary key={location.pathname}>
            <Outlet />
          </AdminErrorBoundary>
        </div>
      </main>
    </div>
  );
}
