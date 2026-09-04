import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminListReferrals, adminPayCommission } from "@/lib/referrals.functions";
import { Loader2, Gift } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/management/referrals")({
  component: ReferralsAdminPage,
});

function parse<T>(res: unknown, fallback: T): T {
  try {
    return typeof res === "string" ? (JSON.parse(res) as T) : ((res as T) ?? fallback);
  } catch {
    return fallback;
  }
}

function ReferralsAdminPage() {
  const qc = useQueryClient();
  const [amounts, setAmounts] = React.useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["adminReferrals"],
    queryFn: async () =>
      parse<{ success: boolean; data: { rows: any[]; commissions: any[] } }>(await adminListReferrals(), {
        success: false,
        data: { rows: [], commissions: [] },
      }),
  });

  const pay = useMutation({
    mutationFn: async (v: { referrerId: string; referredId: string; amount: number }) =>
      parse<{ success: boolean; message?: string }>(await adminPayCommission({ data: v }), { success: false }),
    onSuccess: (res, v) => {
      if (!res.success) {
        toast.error(res.message || "Failed");
        return;
      }
      toast.success("Commission paid and wallet credited");
      setAmounts((a) => ({ ...a, [v.referredId]: "" }));
      qc.invalidateQueries({ queryKey: ["adminReferrals"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed"),
  });

  const rows = data?.data?.rows ?? [];
  const commissions = data?.data?.commissions ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Gift className="text-primary" />
        <h1 className="text-xl font-black uppercase tracking-tight">Referrals</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12 text-muted-foreground">
          <Loader2 className="animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <p className="py-10 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
          No referrals yet
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((r: any) => (
            <div
              key={r.referred_id}
              className="rounded-2xl border border-border bg-card p-4 flex flex-col md:flex-row md:items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black">
                  {r.referred_mobile} <span className="text-muted-foreground font-medium">joined via</span>{" "}
                  {r.referrer_mobile}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {new Date(r.joined_at).toLocaleDateString()} · Paid so far: {Number(r.paid).toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Amount"
                  value={amounts[r.referred_id] ?? ""}
                  onChange={(e) => setAmounts((a) => ({ ...a, [r.referred_id]: e.target.value }))}
                  className="w-32 rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold"
                />
                <button
                  disabled={pay.isPending}
                  onClick={() => {
                    const amount = Number(amounts[r.referred_id]);
                    if (!amount || amount <= 0) {
                      toast.error("Enter a valid amount");
                      return;
                    }
                    pay.mutate({ referrerId: r.referrer_id, referredId: r.referred_id, amount });
                  }}
                  className="rounded-xl bg-green-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white active:scale-95 disabled:opacity-50"
                >
                  Pay Commission
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {commissions.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Commission History</h2>
          {commissions.map((c: any) => (
            <div key={c.id} className="rounded-xl border border-border bg-card px-4 py-3 flex justify-between text-sm">
              <span className="font-bold">
                {c.referrer_mobile} ← {c.referred_mobile}
              </span>
              <span className="font-black text-green-600">+{Number(c.amount).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
