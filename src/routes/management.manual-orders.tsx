import { createFileRoute } from "@tanstack/react-router";
import React from "react";
import { toast } from "sonner";
import { Loader2, MessageCircle, CheckCircle2, RotateCcw, Inbox } from "lucide-react";
import { adminListManualOrders, adminUpdateManualOrder } from "@/lib/manual/manual.functions";

export const Route = createFileRoute("/management/manual-orders")({
  component: ManualOrdersPage,
});

const waLink = (num?: string | null) => {
  const digits = (num || "").replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : null;
};

function ManualOrdersPage() {
  const [orders, setOrders] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<"all" | "processing" | "completed" | "cancelled">("processing");

  const load = async () => {
    setLoading(true);
    try {
      const res = JSON.parse(await adminListManualOrders());
      if (!res.success) throw new Error(res.message);
      setOrders(res.data);
    } catch (e: any) {
      toast.error(e.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    load();
  }, []);

  const act = async (id: string, action: "deliver" | "refund") => {
    setBusy(id);
    try {
      const res = JSON.parse(await adminUpdateManualOrder({ data: { id, action } }));
      if (!res.success) throw new Error(res.message);
      toast.success(action === "deliver" ? "Marked as delivered" : "Order cancelled and refunded");
      load();
    } catch (e: any) {
      toast.error(e.message || "Action failed");
    } finally {
      setBusy(null);
    }
  };

  const visible = orders.filter((o) => filter === "all" || o.status === filter);

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">Manual Orders</h1>
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
          Subscription / manual deliveries via WhatsApp
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {(["processing", "completed", "cancelled", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${
              filter === f ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"
            }`}
          >
            {f === "processing" ? "Pending Delivery" : f}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border divide-y">
        {loading ? (
          <div className="p-10 flex justify-center">
            <Loader2 className="animate-spin text-blue-600" />
          </div>
        ) : visible.length === 0 ? (
          <div className="p-12 text-center text-[11px] font-black uppercase tracking-widest text-gray-400">
            <Inbox className="mx-auto mb-3 text-gray-300" /> No orders here
          </div>
        ) : (
          visible.map((o) => (
            <div key={o.id} className="p-4 flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-black text-gray-900">{o.service_name}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {o.user?.mobile_number || "User"} · Qty {o.quantity} · Rs.
                  {Number(o.price || 0).toFixed(0)} · {new Date(o.created_at).toLocaleString()}
                </p>
                <p className="text-xs font-bold text-gray-700 mt-1">
                  WhatsApp: {o.contact_whatsapp || o.link}
                </p>
                {o.note && <p className="text-[11px] text-gray-500 mt-1">Note: {o.note}</p>}
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <span
                  className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                    o.status === "completed"
                      ? "bg-green-50 text-green-700"
                      : o.status === "cancelled"
                        ? "bg-red-50 text-red-600"
                        : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {o.status}
                </span>
                {waLink(o.contact_whatsapp || o.link) && (
                  <a
                    href={waLink(o.contact_whatsapp || o.link)!}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-600 text-white text-[10px] font-black uppercase tracking-widest"
                  >
                    <MessageCircle size={13} /> Chat
                  </a>
                )}
                {o.status === "processing" && (
                  <>
                    <button
                      disabled={busy === o.id}
                      onClick={() => act(o.id, "deliver")}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                    >
                      <CheckCircle2 size={13} /> Delivered
                    </button>
                    <button
                      disabled={busy === o.id}
                      onClick={() => {
                        if (confirm("Cancel this order and refund the user?")) act(o.id, "refund");
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                    >
                      <RotateCcw size={13} /> Refund
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
