import { createFileRoute } from "@tanstack/react-router";
import { useAdminData, AdminState } from "@/components/admin/AdminData";
import { adminListTransactions } from "@/lib/admin/admin.functions";

export const Route = createFileRoute("/management/transactions")({
  component: TransactionsPage,
});

function TransactionsPage() {
  const { data, loading, error, reload } = useAdminData<any[]>(() => adminListTransactions());
  const rows = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tighter uppercase">Transactions</h1>
        <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-1">Wallet activity</p>
      </div>
      <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
        <AdminState loading={loading} error={error} empty={rows.length === 0} emptyLabel="No transactions found." errorLabel="Failed to load transactions" onRetry={reload}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">User</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((t) => (
                  <tr key={t.id}>
                    <td className="px-6 py-4 text-sm font-black">{t.profile?.mobile_number ?? "—"}</td>
                    <td className="px-6 py-4 text-xs font-bold uppercase text-gray-500">{t.type}</td>
                    <td className="px-6 py-4 text-sm font-mono font-black text-blue-600">Rs.{Number(t.amount || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-xs font-bold uppercase text-gray-500">{t.status}</td>
                    <td className="px-6 py-4 text-xs text-gray-400">{new Date(t.created_at).toLocaleString()}</td>
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
