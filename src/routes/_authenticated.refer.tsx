import React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getMyReferral } from "@/lib/referrals.functions";
import { getCurrencySettings } from "@/lib/settings.functions";
import {
  ArrowLeft,
  Copy,
  Check,
  Link2,
  Users,
  Wallet,
  Lightbulb,
  Flame,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/refer")({
  component: ReferPage,
  head: () => ({
    meta: [
      { title: "Refer & Earn — Invite Friends, Earn Commission" },
      { name: "description", content: "Share your referral link, invite friends to the panel and earn commission on their deposits." },
      { property: "og:title", content: "Refer & Earn — Invite Friends, Earn Commission" },
      { property: "og:description", content: "Share your referral link and earn commission on every friend who joins." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function parse<T>(res: unknown, fallback: T): T {
  try {
    return typeof res === "string" ? (JSON.parse(res) as T) : ((res as T) ?? fallback);
  } catch {
    return fallback;
  }
}

function ReferPage() {
  const [copied, setCopied] = React.useState(false);
  const [origin, setOrigin] = React.useState("");

  React.useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["myReferral"],
    queryFn: async () =>
      parse<{
        code: string;
        referrals: any[];
        commissions: any[];
        totalReferrals: number;
        totalEarnings: number;
      }>(await getMyReferral(), { code: "", referrals: [], commissions: [], totalReferrals: 0, totalEarnings: 0 }),
  });

  const { data: currency } = useQuery({
    queryKey: ["currencySettings"],
    queryFn: async () => parse<any>(await getCurrencySettings(), { customer_currency: "PKR" }),
  });

  const symbol = currency?.currency_symbol || "Rs.";
  const code = data?.code || "";
  const link = code && origin ? `${origin}/register?ref=${code}` : "";

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const whatsappShare = `https://wa.me/?text=${encodeURIComponent(
    `Join and grow your social media with this panel! Sign up with my link: ${link}`,
  )}`;

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
      <div className="flex items-center gap-4">
        <Link
          to="/dashboard"
          className="w-10 h-10 glass-white rounded-full flex items-center justify-center text-primary shadow-sm border border-white/50 transition-all active:scale-90"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex flex-col">
          <h1 className="text-xl font-black text-gradient uppercase tracking-tight">Refer & Earn</h1>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Invite friends</p>
        </div>
      </div>

      {/* Hero */}
      <div className="rounded-[2rem] p-8 text-center text-white shadow-2xl bg-gradient-to-br from-emerald-900 to-emerald-700">
        <div className="inline-flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
          <Flame size={12} /> Lifetime Earnings
        </div>
        <h2 className="text-3xl font-black tracking-tight">Refer &amp; Earn Money</h2>
        <p className="mt-1 text-sm font-bold text-white/85">
          Earn <span className="bg-white/20 px-2 py-0.5 rounded-md">3%</span> Commission
        </p>
      </div>

      {/* Referral link */}
      <div className="glass-white rounded-[2rem] p-5 card-shadow border border-emerald-700/30 space-y-3">
        <div className="flex items-center gap-2 text-emerald-800">
          <Link2 size={16} />
          <span className="text-[11px] font-black uppercase tracking-widest">Your Referral Link</span>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 min-w-0 rounded-xl border border-emerald-700/30 bg-emerald-50/60 px-4 py-3 text-sm font-bold text-emerald-900 truncate">
            {isLoading ? "Loading…" : link || "—"}
          </div>
          <button
            onClick={copy}
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-4 py-3 text-sm font-black text-white active:scale-95 transition"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <a
          href={whatsappShare}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full rounded-2xl bg-gradient-to-r from-emerald-700 to-emerald-600 px-6 py-4 text-base font-black text-white shadow-lg active:scale-[0.98] transition"
        >
          Share on WhatsApp
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-white rounded-[1.75rem] p-6 card-shadow border border-white/50 flex flex-col items-center gap-2">
          <div className="w-11 h-11 rounded-xl bg-emerald-800 text-white flex items-center justify-center">
            <Users size={20} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Total Referrals</span>
          <span className="text-2xl font-black">{data?.totalReferrals ?? 0}</span>
        </div>
        <div className="glass-white rounded-[1.75rem] p-6 card-shadow border border-emerald-700/30 flex flex-col items-center gap-2">
          <div className="w-11 h-11 rounded-xl bg-emerald-800 text-white flex items-center justify-center">
            <Wallet size={20} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Total Earnings</span>
          <span className="text-2xl font-black text-emerald-800">
            {symbol}
            {(data?.totalEarnings ?? 0).toFixed(2)}
          </span>
        </div>
      </div>

      {/* How it works */}
      <div className="glass-white rounded-[2rem] p-6 card-shadow border border-white/50 space-y-5">
        <div className="flex items-center gap-2">
          <Lightbulb size={18} className="text-amber-500" />
          <h3 className="font-black text-base">How It Works</h3>
        </div>
        {[
          { t: "Share Your Link", d: "Send your unique referral link to friends via WhatsApp or any platform." },
          { t: "Friends Sign Up", d: "When they register using your link, they become your referral." },
          { t: "Earn 3% Forever", d: "Every time they add funds, you earn 3% commission. Lifetime!" },
        ].map((s, i) => (
          <div key={s.t} className="flex items-start gap-4">
            <div className="w-8 h-8 shrink-0 rounded-full bg-emerald-800 text-white flex items-center justify-center text-sm font-black">
              {i + 1}
            </div>
            <div className="flex-1 text-center">
              <p className="font-black text-sm">{s.t}</p>
              <p className="text-xs text-muted-foreground font-medium">{s.d}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Referrals list */}
      <div className="glass-white rounded-[2rem] p-6 card-shadow border border-white/50 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-emerald-800" />
            <h3 className="font-black text-base">Your Referrals</h3>
          </div>
          <span className="rounded-full bg-emerald-800 px-3 py-1 text-[10px] font-black text-white">
            {data?.totalReferrals ?? 0} users
          </span>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8 text-muted-foreground">
            <Loader2 className="animate-spin" />
          </div>
        ) : (data?.referrals?.length ?? 0) === 0 ? (
          <p className="py-6 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
            No referrals yet — share your link!
          </p>
        ) : (
          <div className="space-y-2">
            {data!.referrals.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
                <span className="text-sm font-bold">{r.mobile_number}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Commission history */}
      {(data?.commissions?.length ?? 0) > 0 && (
        <div className="glass-white rounded-[2rem] p-6 card-shadow border border-white/50 space-y-3">
          <h3 className="font-black text-base">Commission History</h3>
          {data!.commissions.map((c: any) => (
            <div key={c.id} className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{c.note || "Referral commission"}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {new Date(c.created_at).toLocaleDateString()}
                </p>
              </div>
              <span className="font-black text-emerald-700">
                +{symbol}
                {Number(c.amount).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
