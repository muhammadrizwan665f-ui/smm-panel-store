import { createFileRoute, Link } from "@tanstack/react-router";
import { getCurrencySettings } from "@/lib/settings.functions";
import { 

  History, 
  ArrowLeft, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Filter,
  Calendar,
  CreditCard,
  Wallet
} from "lucide-react";
import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSuspenseQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/balance-history")({
  component: BalanceHistoryPage,
});

function BalanceHistoryPage() {
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

  const { data: transactions = [] } = useSuspenseQuery({
    queryKey: ['wallet-transactions'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

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
          <h1 className="text-xl font-black text-gradient uppercase tracking-tight">Balance History</h1>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Transaction Logs</p>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="glass-white rounded-[2.5rem] p-12 text-center border border-white/50 card-shadow space-y-4">
          <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mx-auto text-muted-foreground/30">
            <History size={32} />
          </div>
          <div>
            <h3 className="text-lg font-black text-foreground uppercase tracking-wider">No transactions</h3>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Your payment history will appear here</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div 
              key={tx.id} 
              className="glass-white p-4 rounded-[1.8rem] card-shadow border border-white/50 flex items-center justify-between group transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                  tx.type === 'credit' 
                    ? 'bg-green-500/10 text-green-500' 
                    : 'bg-primary/10 text-primary'
                }`}>
                  {tx.type === 'credit' ? <ArrowDownLeft size={22} /> : <ArrowUpRight size={22} />}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-foreground uppercase tracking-tight">{tx.description}</span>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{new Date(tx.created_at).toLocaleString()}</span>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className={`text-sm font-black ${
                  tx.type === 'credit' ? 'text-green-500' : 'text-primary'
                }`}>
                  {tx.type === 'credit' ? '+' : '-'}{currentSymbol}{tx.amount.toFixed(2)}

                </span>
                <span className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest">{tx.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
