import { createFileRoute } from "@tanstack/react-router";
import { useAdminData, AdminState } from "@/components/admin/AdminData";
import { adminGetMapping } from "@/lib/admin/admin.functions";

export const Route = createFileRoute("/management/mapping")({
  component: MappingPage,
});

function MappingPage() {
  const { data, loading, error, reload } = useAdminData<any[]>(() => adminGetMapping());
  const rows = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tighter uppercase">Service Mapping</h1>
        <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-1">Catalog service ↔ provider service links</p>
      </div>
      <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
        <AdminState loading={loading} error={error} empty={rows.length === 0} emptyLabel="No mapped services found." errorLabel="Failed to load mapping" onRetry={reload}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Service</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Provider</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Provider Service ID</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((s) => (
                  <tr key={s.id}>
                    <td className="px-6 py-4 text-sm font-black">{s.name}</td>
                    <td className="px-6 py-4 text-xs font-bold uppercase text-gray-500">{s.category?.name ?? "—"}</td>
                    <td className="px-6 py-4 text-xs font-bold uppercase text-gray-500">{s.provider?.name ?? "Manual"}</td>
                    <td className="px-6 py-4 text-xs font-mono text-gray-400">{s.provider_service_id ?? "—"}</td>
                    <td className="px-6 py-4 text-xs font-black uppercase text-gray-500">{s.status}</td>
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
