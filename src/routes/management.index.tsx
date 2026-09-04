import { createFileRoute } from "@tanstack/react-router";
import { 
  Users, 
  ShoppingCart, 
  Wallet, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  Bell,
  Package,
  Layers,
  Database,
  ShieldCheck,
  PlayCircle
} from "lucide-react";
import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/management/")({
  ssr: false,
  component: ManagementDashboard,
});

export default function ManagementDashboard() {
  console.log("[ManagementDashboard] Component rendering...");

  const [dbStats, setDbStats] = React.useState<any>(null);
  const [currencySettings, setCurrencySettings] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchStats = async () => {
      const { getCurrencySettings } = await import("@/lib/settings.functions");
      const settingsJson = await getCurrencySettings();
      setCurrencySettings(JSON.parse(settingsJson));
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
      const { count: serviceCount } = await supabase.from('services').select('*', { count: 'exact', head: true });
      const { data: orders } = await supabase.from('orders').select('price, provider_cost, status');
      
      const revenue = orders?.reduce((sum, o) => sum + (Number(o.price) || 0), 0) || 0;
      const cost = orders?.reduce((sum, o) => sum + (Number(o.provider_cost) || 0), 0) || 0;
      const profit = revenue - cost;
      
      const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;
      const processingOrders = orders?.filter(o => o.status === 'processing').length || 0;
      const completedOrders = orders?.filter(o => o.status === 'completed').length || 0;
      const failedOrders = orders?.filter(o => o.status === 'failed').length || 0;

      setDbStats({
        users: userCount || 0,
        orders: orderCount || 0,
        services: serviceCount || 0,
        revenue,
        cost,
        profit,
        pending: pendingOrders,
        processing: processingOrders,
        completed: completedOrders,
        failed: failedOrders
      });
    };
    fetchStats();
  }, []);

  const currentSymbol = currencySettings?.currency_symbol || (currencySettings?.customer_currency === 'PKR' ? 'Rs.' : 'Rs.');

  const stats = [
    { label: "Total Customers", value: dbStats?.users?.toString() || "...", icon: Users, color: "blue" },
    { label: "Total Services", value: dbStats?.services?.toString() || "...", icon: Package, color: "purple" },
    { label: "Total Orders", value: dbStats?.orders?.toString() || "...", icon: ShoppingCart, color: "orange" },
    { label: "Estimated Profit", value: `${currentSymbol}${dbStats?.profit?.toFixed(2) || "..."}`, icon: TrendingUp, color: "green" },
  ];

  const orderStatuses = [
    { label: "Pending", value: dbStats?.pending || 0, color: "text-orange-500", bg: "bg-orange-50" },
    { label: "Processing", value: dbStats?.processing || 0, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Completed", value: dbStats?.completed || 0, color: "text-green-500", bg: "bg-green-50" },
    { label: "Failed", value: dbStats?.failed || 0, color: "text-red-500", bg: "bg-red-50" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-gray-900 uppercase">
            WELCOME
          </h1>
          <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-1">SMM Panel Control Center</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-white shadow-sm">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">System Live</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-3xl shadow-sm border border-white hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 flex items-center justify-center mb-4`}>
              <stat.icon size={24} />
            </div>
            <div>
              <div className="text-3xl font-black tracking-tight">{stat.value}</div>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Order Status Quick View */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {orderStatuses.map((status) => (
          <div key={status.label} className={`${status.bg} p-4 rounded-2xl border border-white flex items-center justify-between`}>
            <span className={`text-[10px] font-black uppercase tracking-widest ${status.color}`}>{status.label}</span>
            <span className={`text-xl font-black ${status.color}`}>{status.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Financial Summary */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-white space-y-6">
          <h2 className="text-lg font-black uppercase tracking-tight">Financial Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Today's Revenue</span>
              <div className="text-2xl font-black text-blue-600">{currentSymbol}{dbStats?.revenue?.toFixed(2) || "0.00"}</div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Provider Cost</span>
              <div className="text-2xl font-black text-red-500">{currentSymbol}{dbStats?.cost?.toFixed(2) || "0.00"}</div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Net Profit</span>
              <div className="text-2xl font-black text-green-500">{currentSymbol}{dbStats?.profit?.toFixed(2) || "0.00"}</div>
            </div>
          </div>
          
          <div className="pt-6 border-t border-gray-50 flex items-center gap-4">
            <div className="flex-1 h-3 bg-gray-50 rounded-full overflow-hidden flex">
              <div className="h-full bg-blue-500" style={{ width: '70%' }} />
              <div className="h-full bg-purple-500" style={{ width: '20%' }} />
              <div className="h-full bg-orange-500" style={{ width: '10%' }} />
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Efficiency: 92%</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-white space-y-6">
          <h2 className="text-lg font-black uppercase tracking-tight">System Controls</h2>
          <div className="grid grid-cols-1 gap-3">
            <Link to="/management/providers" className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 hover:bg-blue-50 transition-colors group">
              <Database className="text-gray-400 group-hover:text-blue-600" size={20} />
              <span className="text-[10px] font-black uppercase tracking-tight text-gray-500 group-hover:text-blue-600">Manage Providers</span>
            </Link>
            <Link to="/management/services" className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 hover:bg-purple-50 transition-colors group">
              <Package className="text-gray-400 group-hover:text-purple-600" size={20} />
              <span className="text-[10px] font-black uppercase tracking-tight text-gray-500 group-hover:text-purple-600">Service Catalog</span>
            </Link>
            <Link to="/management/api-logs" className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 hover:bg-green-50 transition-colors group">
              <ShieldCheck className="text-gray-400 group-hover:text-green-600" size={20} />
              <span className="text-[10px] font-black uppercase tracking-tight text-gray-500 group-hover:text-green-600">API Logs</span>
            </Link>
            <Link to="/management/tests/consistency" className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 hover:bg-orange-50 transition-colors group">
              <PlayCircle className="text-gray-400 group-hover:text-orange-600" size={20} />
              <span className="text-[10px] font-black uppercase tracking-tight text-gray-500 group-hover:text-orange-600">Consistency Test</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
