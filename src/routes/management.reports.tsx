import { createFileRoute } from "@tanstack/react-router";
import { useAdminData, AdminState } from "@/components/admin/AdminData";
import { adminGetReports } from "@/lib/admin/admin.functions";

export const Route = createFileRoute("/management/reports")({
  component: ReportsPage,
});

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border">
      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</div>
      <div className="text-2xl font-black mt-2">{value}</div>
    </div>
  );
}

function ReportsPage() {
  const { data, loading, error, reload } = useAdminData<any>(() => adminGetReports());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tighter uppercase">Reports</h1>
        <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-1">Platform overview</p>
      </div>
      <AdminState loading={loading} error={error} empty={!data} emptyLabel="No report data." errorLabel="Failed to load reports" onRetry={reload}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Users" value={data?.users ?? 0} />
          <Stat label="Providers" value={data?.providers ?? 0} />
          <Stat label="Provider Services" value={data?.providerServices ?? 0} />
          <Stat label="Catalog Services" value={data?.services ?? 0} />
          <Stat label="Categories" value={data?.categories ?? 0} />
          <Stat label="Orders" value={data?.orders ?? 0} />
          <Stat label="Revenue" value={`Rs.${Number(data?.revenue ?? 0).toFixed(2)}`} />
          <Stat label="Net Profit" value={`Rs.${Number(data?.profit ?? 0).toFixed(2)}`} />
        </div>
      </AdminState>
    </div>
  );
}
