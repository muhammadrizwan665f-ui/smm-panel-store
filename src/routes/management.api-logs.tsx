import { createFileRoute } from "@tanstack/react-router";
import { useAdminData, AdminState } from "@/components/admin/AdminData";
import { adminListApiLogs } from "@/lib/admin/admin.functions";

export const Route = createFileRoute("/management/api-logs")({
  component: ApiLogsPage,
});

function ApiLogsPage() {
  const { data, loading, error, reload } = useAdminData<any[]>(() => adminListApiLogs());
  const rows = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tighter uppercase">API Logs</h1>
        <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-1">Provider API activity</p>
      </div>
      <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
        <AdminState loading={loading} error={error} empty={rows.length === 0} emptyLabel="No API logs found." errorLabel="Failed to load API logs" onRetry={reload}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Provider</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Operation</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((l) => (
                  <tr key={l.id}>
                    <td className="px-6 py-4 text-sm font-black">{l.provider?.name ?? "—"}</td>
                    <td className="px-6 py-4 text-xs font-bold uppercase text-gray-500">{l.operation}</td>
                    <td className={`px-6 py-4 text-xs font-black uppercase ${l.is_success ? "text-green-600" : "text-red-600"}`}>
                      {l.status_code ?? (l.is_success ? "OK" : "ERROR")}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400">{new Date(l.created_at).toLocaleString()}</td>
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
