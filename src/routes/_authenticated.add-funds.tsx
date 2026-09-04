import { createFileRoute, Link } from "@tanstack/react-router";
import { getCurrencySettings } from "@/lib/settings.functions";
import { 
  Wallet, 
  ArrowLeft, 
  Plus, 
  Info, 
  ChevronRight,
  ShieldCheck,
  Zap
} from "lucide-react";
import React from "react";
import { getSession } from "@/lib/auth/session.functions";
import { useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { listActiveGateways, createQrDeposit, submitManualPaymentProof } from "@/lib/payments/payments.functions";
import { BharatPayQr } from "@/components/payments/BharatPayQr";
import { ManualPaymentDetails } from "@/components/payments/ManualPaymentDetails";

export const Route = createFileRoute("/_authenticated/add-funds")({
  component: AddFundsPage,
});

function AddFundsPage() {
  const { data: session } = useSuspenseQuery({
    queryKey: ['session'],
    queryFn: () => getSession()
  });

  const { data: currencySettings } = useSuspenseQuery({
    queryKey: ['currencySettings'],
    queryFn: async () => {
      const res = await getCurrencySettings();
      return typeof res === 'string' ? JSON.parse(res) : res;
    }
  });

  const currentSymbol = currencySettings?.currency_symbol || (currencySettings?.customer_currency === 'PKR' ? 'Rs.' : 'Rs.');

  const [amount, setAmount] = React.useState<string>("");
  const walletBalance = session?.user?.wallet_balance ?? 0;

  const presets = ["100", "500", "1000", "2000"];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex items-center gap-4">
        <Link 
          to="/dashboard"
          className="w-10 h-10 glass-white rounded-full flex items-center justify-center text-primary shadow-sm border border-white/50 transition-all active:scale-90"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex flex-col">
          <h1 className="text-xl font-black text-gradient uppercase tracking-tight">Add Funds</h1>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Recharge Wallet</p>
        </div>
      </div>

      {/* Current Balance Card */}
      <div className="glass-white p-6 rounded-[2.5rem] card-shadow border border-white/50 flex items-center justify-between bg-gradient-to-br from-white to-secondary/30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center text-white shadow-lg">
            <Wallet size={24} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Available Balance</span>
            <span className="text-2xl font-black text-foreground tracking-tighter">{currentSymbol}{walletBalance.toFixed(2)}</span>
          </div>
        </div>
        <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
          <ShieldCheck size={20} />
        </div>
      </div>

      {/* Add Funds Form */}
      <div className="glass-white p-8 rounded-[2.5rem] card-shadow border border-white/50 space-y-8">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Enter Amount ({currentSymbol})</label>
          <div className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground/50 font-black">
              {currentSymbol}
            </div>
            <input 
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-secondary/50 border-none rounded-[1.5rem] p-5 pl-12 text-xl font-black focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/20"
            />
          </div>
        </div>

        {/* Presets */}
        <div className="grid grid-cols-4 gap-3">
          {presets.map((val) => (
            <button
              key={val}
              onClick={() => setAmount(val)}
              className={`py-3 rounded-[1rem] text-xs font-black uppercase transition-all ${
                amount === val 
                  ? "gradient-primary text-white shadow-lg shadow-primary/20 scale-105" 
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary active:scale-95"
              }`}
            >
              {currentSymbol}{val}
            </button>
          ))}
        </div>

        <PaymentFlow amount={amount} currentSymbol={currentSymbol} />
      </div>
    </div>
  );
}


function PaymentFlow({ amount, currentSymbol }: { amount: string; currentSymbol: string }) {
  const [gateways, setGateways] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedId, setSelectedId] = React.useState<string>("");
  const [qrSession, setQrSession] = React.useState<any>(null);
  const [creating, setCreating] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const res = JSON.parse(await listActiveGateways());
        const list = res?.success ? res.data : [];
        setGateways(list);
        if (list.length) setSelectedId(list[0].id);
      } catch {
        setGateways([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const gateway = gateways.find((g) => g.id === selectedId);
  const numericAmount = Number(amount);

  const validateAmount = () => {
    if (!gateway) { toast.error("No payment method available"); return false; }
    if (!numericAmount || numericAmount < Number(gateway.min_amount)) {
      toast.error(`Minimum amount is ${currentSymbol}${gateway.min_amount}`);
      return false;
    }
    if (numericAmount > Number(gateway.max_amount)) {
      toast.error(`Maximum amount is ${currentSymbol}${gateway.max_amount}`);
      return false;
    }
    return true;
  };

  const proceed = async () => {
    if (!validateAmount()) return;
    if (!gateway?.qr_enabled) {
      toast.error("This payment method isn't configured yet. Please contact support.");
      return;
    }
    setCreating(true);
    try {
      const res = JSON.parse(await createQrDeposit({ data: { gatewayId: selectedId, amount: numericAmount } }));
      if (!res.success) { toast.error(res.message); return; }
      setQrSession(res.data);
    } catch (e: any) {
      toast.error(e.message || "Could not start payment");
    } finally {
      setCreating(false);
    }
  };

  if (qrSession) {
    if (qrSession.type === 'manual') {
      return (
        <ManualPaymentDetails
          gateway={gateway}
          amount={qrSession.amount}
          symbol={currentSymbol}
          referenceId={qrSession.referenceId}
          onClose={() => setQrSession(null)}
          onSubmitUtr={async (utr) => {
            const result = JSON.parse(
              await submitManualPaymentProof({ data: { depositId: qrSession.depositId, utr } }),
            );
            if (!result.success) throw new Error(result.message || "Submission failed");
            setQrSession(null);
            setTimeout(() => window.location.reload(), 1200);
          }}
        />
      );
    }
    return (
      <BharatPayQr
        depositId={qrSession.depositId}
        referenceId={qrSession.referenceId}
        amount={Number(qrSession.amount)}
        qr={qrSession.qr}
        expiresAt={qrSession.expiresAt}
        instructions={qrSession.instructions}
        symbol={currentSymbol}
        onDone={() => setTimeout(() => window.location.reload(), 1200)}
        onClose={() => setQrSession(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="pt-4 flex justify-center">
        <Loader2 className="animate-spin text-primary" size={22} />
      </div>
    );
  }

  if (!gateways.length) {
    return (
      <div className="pt-4">
        <div className="p-4 bg-amber-500/5 rounded-[1.5rem] border border-amber-500/10 text-[10px] font-bold uppercase tracking-tighter text-amber-700/70">
          No payment method is available right now. Please contact support.
        </div>
      </div>
    );
  }

  return (
    <div className="pt-4 space-y-4">
      {gateways.length > 1 && (
        <div className="grid grid-cols-2 gap-3">
          {gateways.map((g) => (
            <button
              key={g.id}
              onClick={() => setSelectedId(g.id)}
              className={`py-3 px-4 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                selectedId === g.id ? "gradient-primary text-white shadow-lg shadow-primary/20" : "bg-secondary/50 text-muted-foreground"
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

      {gateway && !gateway.qr_enabled ? (
        <div className="p-4 bg-amber-500/5 rounded-[1.5rem] border border-amber-500/10 text-[10px] font-bold uppercase tracking-tighter text-amber-700/70">
          This payment method isn't configured yet. Please contact support or choose another method.
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 p-4 bg-amber-500/5 rounded-[1.5rem] border border-amber-500/10">
            <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500 shrink-0">
              <Zap size={18} />
            </div>
            <p className="text-[10px] text-amber-700/70 font-bold uppercase tracking-tighter leading-relaxed">
              Funds are added instantly after successful payment verification.
            </p>
          </div>
          <button onClick={proceed} disabled={creating} className="w-full disabled:opacity-60 gradient-primary text-white py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/30 transition-all active:scale-95 flex items-center justify-center gap-2">
            {creating ? <Loader2 size={18} className="animate-spin" /> : null}
            {creating ? "Generating QR..." : "Continue to Payment"}
            {!creating && <ChevronRight size={18} />}
          </button>
        </>
      )}
    </div>
  );
}
