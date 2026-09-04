import { createFileRoute } from "@tanstack/react-router";
import { useAdminData, AdminState } from "@/components/admin/AdminData";
import { adminListUsers, adminAdjustWallet, adminImpersonateUser } from "@/lib/admin/admin.functions";
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Minus, Wallet, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/management/users")({
  component: UsersPage,
});

function UsersPage() {
  const { data, loading, error, reload } = useAdminData<any[]>(() => adminListUsers());
  const [adjustingId, setAdjustingId] = React.useState<string | null>(null);
  const [amount, setAmount] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState(false);

  const handleAdjust = async (userId: string, type: 'add' | 'cut') => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setSubmitting(true);
    try {
      const resJson = await adminAdjustWallet({ 
        data: { 
          userId, 
          amount: numAmount, 
          type,
          description: `Admin manual ${type}` 
        } 
      });
      const res = JSON.parse(resJson as string);
      if (res.success) {
        toast.success(`Successfully ${type === 'add' ? 'added' : 'cut'} Rs.${numAmount}`);
        setAdjustingId(null);
        setAmount("");
        reload();
      } else {
        toast.error(res.message || "Failed to adjust balance");
      }
    } catch (err: any) {
      toast.error(err.message || "System error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleImpersonate = async (userId: string) => {
    const confirm = window.confirm("Are you sure you want to login as this user? This will switch your current session.");
    if (!confirm) return;

    setSubmitting(true);
    try {
      const resJson = await adminImpersonateUser({ data: { userId } });
      const res = JSON.parse(resJson as string);
      
      if (res.success && res.data.access_token) {
        toast.success("Generating impersonation session...");
        
        // Use establishClientSession from our auth utilities
        const { establishClientSession } = await import("@/lib/auth/client-session");
        const success = await establishClientSession({
          access_token: res.data.access_token,
          refresh_token: res.data.refresh_token
        });

        if (success) {
          // Store that we are impersonating to show the return banner
          localStorage.setItem('is_impersonating', 'true');
          window.location.href = "/dashboard";
        } else {
          toast.error("Failed to establish user session");
        }
      } else {
        toast.error(res.message || "Impersonation failed");
      }
    } catch (err: any) {
      toast.error(err.message || "System error during impersonation");
    } finally {
      setSubmitting(false);
    }
  };

  const users = data ?? [];


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tighter uppercase">Users</h1>
        <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-1">Registered customers</p>
      </div>
      <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
        <AdminState loading={loading} error={error} empty={users.length === 0} emptyLabel="No users found." errorLabel="Failed to load users" onRetry={reload}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">User Identifier</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Wallet</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Joined</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>

              </thead>
              <tbody className="divide-y">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-6 py-4 text-sm font-black">
                      <div className="flex flex-col">
                        <span>{u.mobile_number || "N/A"}</span>
                        {u.email && <span className="text-[10px] text-gray-400 lowercase font-medium">{u.email}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono font-black text-blue-600">Rs.{Number(u.wallet_balance || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-xs font-bold uppercase text-gray-500">{u.status}</td>
                    <td className="px-6 py-4 text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {adjustingId === u.id ? (
                          <div className="flex items-center gap-2 animate-in slide-in-from-right-2 duration-200">
                            <Input 
                              className="w-24 h-8 text-xs font-black" 
                              type="number" 
                              placeholder="Amount" 
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              autoFocus
                            />
                            <Button 
                              size="icon" 
                              variant="default" 
                              className="h-8 w-8 bg-green-600 hover:bg-green-700 text-white border-none shadow-none" 
                              onClick={() => handleAdjust(u.id, 'add')}
                              disabled={submitting}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="destructive" 
                              className="h-8 w-8 border-none shadow-none" 
                              onClick={() => handleAdjust(u.id, 'cut')}
                              disabled={submitting}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8" 
                              onClick={() => {setAdjustingId(null); setAmount("");}}
                              disabled={submitting}
                            >
                              <span className="text-xs">✕</span>
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 text-[10px] font-black uppercase tracking-widest rounded-xl border-2 hover:bg-gray-50"
                              onClick={() => setAdjustingId(u.id)}
                            >
                              <Wallet className="h-3 w-3 mr-1" /> Adjust
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-50 text-blue-600"
                              onClick={() => handleImpersonate(u.id)}
                            >
                              <LogIn className="h-3 w-3 mr-1" /> Login
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>

                ))}
              </tbody>
            </table>
          </div>
        </AdminState>
      </div>
    </div>
  );
}
