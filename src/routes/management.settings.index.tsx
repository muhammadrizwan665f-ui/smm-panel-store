import { createFileRoute } from "@tanstack/react-router";
import { useAdminData, AdminState } from "@/components/admin/AdminData";
import { adminListSiteSettings } from "@/lib/admin/admin.functions";

export const Route = createFileRoute("/management/settings/")({
  component: GeneralSettingsPage,
});

function GeneralSettingsPage() {
  const { data, loading, error, reload } = useAdminData<any[]>(() => adminListSiteSettings());
  const rows = data ?? [];

  return (
    <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
      <AdminState loading={loading} error={error} empty={rows.length === 0} emptyLabel="No settings found." errorLabel="Failed to load settings" onRetry={reload}>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Key</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Value</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((s: any) => (
              <tr key={s.key}>
                <td className="px-6 py-4 text-sm font-black font-mono">{s.key}</td>
                <td className="px-6 py-4 text-sm">{s.value}</td>
                <td className="px-6 py-4 text-xs text-gray-500">{s.description ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminState>
    </div>
  );
}
