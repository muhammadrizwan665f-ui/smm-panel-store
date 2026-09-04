import { createFileRoute } from "@tanstack/react-router";
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ExternalLink,
  ShoppingCart,
  ArrowRight
} from "lucide-react";
import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { adminListOrders } from "@/lib/admin/admin.functions";
import { syncAllOrders } from "@/lib/providers/sync.functions";

export const Route = createFileRoute("/management/orders")({
  component: OrdersPage,
});

function OrdersPage() {
  const [orders, setOrders] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("All Statuses");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = JSON.parse(await adminListOrders());
      if (!res.success) throw new Error(res.message);
      setOrders(res.data || []);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchOrders();
  }, []);

  // Auto status update for API orders: run immediately, then every 10 minutes.
  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = JSON.parse(await syncAllOrders());
        if (!cancelled && res?.success && res.data?.synced > 0) await fetchOrders();
      } catch { /* silent background sync */ }
    };
    run();
    const timer = setInterval(run, 10 * 60 * 1000);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 size={14} className="text-green-500" />;
      case 'pending': return <Clock size={14} className="text-orange-500" />;
      case 'processing': return <RefreshCw size={14} className="text-blue-500 animate-spin-slow" />;
      case 'failed': return <XCircle size={14} className="text-red-500" />;
      default: return <AlertCircle size={14} className="text-gray-400" />;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-50 text-green-700 border-green-100';
      case 'pending': return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'processing': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'failed': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  const cancelAndRefund = async (orderId: string) => {
    if (!confirm("Cancel this order and refund the amount to the user's wallet?")) return;
    try {
      const { adminCancelRefundOrder } = await import("@/lib/settings/branding.functions");
      const res = JSON.parse(await adminCancelRefundOrder({ data: { orderId, refund: true } }));
      if (!res.success) throw new Error(res.message);
      toast.success(res.refunded ? `Cancelled and refunded Rs.${Number(res.refunded).toFixed(2)}` : "Order cancelled");
      fetchOrders();
    } catch (e: any) {
      toast.error(e?.message || "Cancel failed");
    }
  };

  const retryOrder = async (orderId: string) => {
    try {
      const { placeProviderOrder } = await import("@/lib/providers/order.functions");
      toast.info("Retrying order submission...");
      const resJson = await placeProviderOrder({ data: { orderId } });
      const res = JSON.parse(resJson);
      if (res.order) {
        toast.success(`Success! Provider ID: ${res.order}`);
      } else {
        toast.success("Order submitted to provider.");
      }
      fetchOrders();
    } catch (error: any) {
      toast.error("Retry failed: " + (error?.message || "Unknown error"));
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.link?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.service_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "All Statuses" || order.status.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-gray-900 uppercase">Order <span className="text-orange-600">Queue</span></h1>
          <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-1">Real-time SMM order monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchOrders}
            className="bg-white text-gray-900 border border-gray-100 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm flex items-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh Queue
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-3xl shadow-sm border border-white flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search orders..." 
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold placeholder:text-gray-400 focus:ring-2 focus:ring-orange-100"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-50 border-none rounded-2xl px-6 py-3 text-xs font-black uppercase tracking-widest text-gray-600 focus:ring-2 focus:ring-orange-100"
          >
            <option>All Statuses</option>
            <option>Pending</option>
            <option>Processing</option>
            <option>Completed</option>
            <option>Failed</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Order/Service</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Link/Quantity</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Price/Profit</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Provider ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-orange-600 uppercase tracking-tighter">#{order.id.slice(0, 8)}</span>
                      <span className="text-sm font-bold text-gray-900 line-clamp-1">{order.service_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <a href={order.link} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                        View Link <ExternalLink size={10} />
                      </a>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{order.quantity.toLocaleString()} units</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-gray-900">Rs.{Number(order.price).toFixed(2)}</span>
                      <span className="text-[10px] font-black text-green-600 uppercase">Profit: Rs.{Number(order.estimated_profit || 0).toFixed(2)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[10px] font-black text-gray-900 uppercase tracking-tight">
                      {order.provider_order_id ? `#${order.provider_order_id}` : '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${getStatusStyle(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {order.status === 'pending' || order.status === 'failed' ? (
                        <button 
                          onClick={() => retryOrder(order.id)}
                          className="p-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors"
                          title="Retry Provider Submission"
                        >
                          <ArrowRight size={14} />
                        </button>
                      ) : null}
                      {order.status !== 'cancelled' && order.status !== 'completed' ? (
                        <button
                          onClick={() => cancelAndRefund(order.id)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          title="Cancel & Refund to user wallet"
                        >
                          <XCircle size={14} />
                        </button>
                      ) : null}
                      <button className="p-2 bg-gray-50 text-gray-400 rounded-lg hover:bg-gray-100 transition-colors">
                        <Eye size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredOrders.length === 0 && (
          <div className="p-12 text-center">
            <ShoppingCart size={48} className="mx-auto text-gray-100 mb-4" />
            <p className="text-gray-400 font-black uppercase tracking-widest text-xs">No orders found</p>
          </div>
        )}
      </div>
    </div>
  );
}
