import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  ShoppingBag, 
  ArrowLeft, 
  Plus, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronRight,
  ExternalLink,
  Target
} from "lucide-react";
import React from "react";
import { getSession } from "@/lib/auth/session.functions";
import { useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { syncMyOrders } from "@/lib/providers/sync.functions";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/orders")({
  component: OrdersPage,
});

function OrdersPage() {
  const [statusFilter, setStatusFilter] = React.useState("ACTIVE");

  const queryClient = useQueryClient();

  // Auto status update: sync pending provider orders now and every 10 minutes.
  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        await syncMyOrders();
        if (!cancelled) await queryClient.invalidateQueries({ queryKey: ["user-orders"] });
      } catch { /* silent background sync */ }
    };
    run();
    const timer = setInterval(run, 10 * 60 * 1000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [queryClient]);

  const { data: orders = [] } = useSuspenseQuery({
    queryKey: ['user-orders'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const filteredOrders = orders.filter(order => {
    if (statusFilter === "ACTIVE") return ["pending", "processing"].includes(order.status.toLowerCase());
    if (statusFilter === "COMPLETED") return ["completed"].includes(order.status.toLowerCase());
    if (statusFilter === "INCOMPLETE") return ["partial", "cancelled", "failed"].includes(order.status.toLowerCase());
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-gradient uppercase tracking-tight">My Orders</h1>
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Track your social growth</p>
      </div>

      {/* Status Tabs */}
      <div className="flex p-1.5 glass-white rounded-[2rem] card-shadow border border-white/50">
        {["ACTIVE", "COMPLETED", "INCOMPLETE"].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-[1.5rem] transition-all ${
              statusFilter === tab 
                ? "gradient-primary text-white shadow-lg" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="glass-white rounded-[2.5rem] p-12 text-center border border-white/50 card-shadow space-y-6">
          <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mx-auto text-muted-foreground/30">
            <ShoppingBag size={40} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-foreground uppercase tracking-wider">No orders found</h3>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-tighter">
              Start growing your social presence today.
            </p>
          </div>
          <Link 
            to="/create-order"
            className="inline-flex items-center gap-2 gradient-primary text-white px-8 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/30 transition-all active:scale-95"
          >
            <Plus size={16} />
            Create Order
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div 
              key={order.id} 
              className="glass-white p-5 rounded-[2rem] card-shadow border border-white/50 space-y-4 animate-in zoom-in-95 duration-300"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-lg tracking-wider">#{order.id.slice(0, 8)}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{new Date(order.created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-black text-sm text-foreground uppercase tracking-tight leading-tight">{order.service_name}</h3>
                  {order.order_type === 'manual' && (
                    <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-widest text-green-600 bg-green-500/10 px-2 py-0.5 rounded-lg">
                      Manual delivery via WhatsApp
                    </span>
                  )}
                </div>
                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                  order.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                  order.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                  'bg-destructive/10 text-destructive'
                }`}>
                  {order.status}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-3 border-y border-border/30">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Quantity</span>
                  <div className="text-sm font-black text-foreground">{order.quantity.toLocaleString()}</div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Price</span>
                  <div className="text-sm font-black text-primary">Rs.{order.price.toFixed(2)}</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Target size={14} className="text-muted-foreground" />
                  <span className="text-[10px] font-bold text-muted-foreground truncate max-w-[150px]">{order.link}</span>
                </div>
                {order.order_type !== 'manual' && (
                  <a 
                    href={order.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-8 h-8 bg-secondary rounded-xl flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
