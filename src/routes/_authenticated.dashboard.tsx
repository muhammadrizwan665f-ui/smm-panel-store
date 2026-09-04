import { createFileRoute, Link } from "@tanstack/react-router";
import { getCurrencySettings } from "@/lib/settings.functions";
import { getSession } from "@/lib/auth/session.functions";
import { useSuspenseQuery } from "@tanstack/react-query";
import { 
  Wallet, 
  Plus, 
  ShoppingBag, 
  Settings, 
  Clock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  TrendingUp,
  CreditCard,
  Target,
  User,
  MessageSquare,
  History,
  Gift
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { data: session } = useSuspenseQuery({
    queryKey: ['session'],
    queryFn: () => getSession()
  });

  const { data: currencySettings } = useSuspenseQuery({
    queryKey: ['currencySettings'],
    queryFn: async () => {
      try {
        const res = await getCurrencySettings();
        return typeof res === 'string' ? JSON.parse(res) : res;
      } catch (e) {
        return { customer_currency: 'PKR' };
      }
    }
  });

  const currentSymbol = currencySettings?.currency_symbol || (currencySettings?.customer_currency === 'PKR' ? 'Rs.' : 'Rs.');

  const userMobile = session?.user?.mobile_number || "User";
  const walletBalance = session?.user?.wallet_balance ?? 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      {/* Welcome Section */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-gradient">
          Hello, {userMobile}!
        </h1>
        <p className="text-sm text-muted-foreground font-medium">Welcome to your social growth dashboard.</p>
      </div>

      {/* Wallet Balance Card */}
      <div className="gradient-primary rounded-[2.5rem] p-8 text-white shadow-2xl shadow-primary/30 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl transition-transform duration-700 group-hover:scale-110" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-white/80 font-bold mb-2 uppercase text-[10px] tracking-widest">
            <Wallet size={14} />
            <span>Available Balance</span>
          </div>
          <div className="text-4xl md:text-5xl font-black mb-8 tracking-tighter">
            {currentSymbol}{walletBalance.toFixed(2)}
          </div>
          <Link 
            to="/add-funds"
            className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-secondary transition-all active:scale-[0.98] shadow-lg"
          >
            <Plus size={18} />
            Add Funds
          </Link>
        </div>
      </div>

      {/* Main Actions Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          to="/create-order"
          className="glass-white p-6 rounded-[2rem] card-shadow flex flex-col items-center justify-center gap-4 text-center transition-all hover:-translate-y-1 active:scale-95 group border border-white/50"
        >
          <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center text-white shadow-xl group-hover:rotate-6 transition-transform">
            <Plus size={32} />
          </div>
          <div className="space-y-1">
            <span className="font-black text-sm uppercase tracking-wider block text-foreground">Create Order</span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Start Growing</span>
          </div>
        </Link>

        <Link
          to="/orders"
          className="glass-white p-6 rounded-[2rem] card-shadow flex flex-col items-center justify-center gap-4 text-center transition-all hover:-translate-y-1 active:scale-95 group border border-white/50"
        >
          <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-xl group-hover:rotate-6 transition-transform">
            <ShoppingBag size={32} />
          </div>
          <div className="space-y-1">
            <span className="font-black text-sm uppercase tracking-wider block text-foreground">My Orders</span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Track Status</span>
          </div>
        </Link>
      </div>

      {/* Statistics Section */}
      <div className="glass-white rounded-[2.5rem] p-6 card-shadow border border-white/50">
        <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-6 text-center">Your Statistics</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500">
              <CheckCircle2 size={24} />
            </div>
            <span className="text-2xl font-black">0</span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Completed</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
              <Clock size={24} />
            </div>
            <span className="text-2xl font-black">0</span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active</span>
          </div>
        </div>
      </div>

      {/* Quick Links Menu Style */}
      <div className="space-y-3">
        {[
          { label: "Profile Settings", to: "/profile", icon: User, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Refer & Earn", to: "/refer", icon: Gift, color: "text-emerald-600", bg: "bg-emerald-500/10" },
          { label: "Balance History", to: "/balance-history", icon: History, color: "text-purple-500", bg: "bg-purple-500/10" },
          { label: "WhatsApp Support", to: "/support", icon: MessageSquare, color: "text-green-500", bg: "bg-green-500/10" },
        ].map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className="flex items-center justify-between p-4 glass-white rounded-[1.5rem] card-shadow border border-white/50 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 ${item.bg} ${item.color} rounded-xl flex items-center justify-center`}>
                <item.icon size={20} />
              </div>
              <span className="font-bold text-sm text-foreground">{item.label}</span>
            </div>
            <ArrowRight size={18} className="text-muted-foreground/50" />
          </Link>
        ))}
      </div>
    </div>
  );
}
