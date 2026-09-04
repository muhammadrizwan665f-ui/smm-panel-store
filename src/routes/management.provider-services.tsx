import { createFileRoute, Link } from "@tanstack/react-router";
import React from "react";
import { getCurrencySettings } from "@/lib/settings.functions";

import { Search } from "lucide-react";
import { useAdminData, AdminState } from "@/components/admin/AdminData";
import { adminListProviderServices } from "@/lib/admin/admin.functions";

export const Route = createFileRoute("/management/provider-services")({
  component: ProviderServicesPage,
});

function ProviderServicesPage() {
  const { data: currencySettings } = useAdminData(() => getCurrencySettings());
  const currentSymbol = currencySettings?.currency_symbol || (currencySettings?.customer_currency === 'PKR' ? 'Rs.' : 'Rs.');

  const { data, loading, error, reload } = useAdminData<any[]>(() => adminListProviderServices({ data: {} }));
  const [search, setSearch] = React.useState("");
  const rows = (data ?? []).filter((s: any) =>
    (s.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    String(s.provider_service_id ?? "").includes(search),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">Provider Services</h1>
          <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-1">Synced services from all providers</p>
        </div>
        <Link to="/management/providers" className="px-6 py-3 rounded-2xl bg-white border text-xs font-black uppercase tracking-widest">
          Go to Providers
        </Link>
      </div>

      <div className="bg-white p-4 rounded-3xl shadow-sm border relative">
        <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search provider services..."
          className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl text-sm font-bold"
        />
      </div>

      <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
        <AdminState
          loading={loading}
          error={error}
          empty={rows.length === 0}
          emptyLabel="No provider services found."
          errorLabel="Failed to load provider services"
          onRetry={reload}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Service</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Provider</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cost</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Min / Max</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((s: any) => (
                  <tr key={s.id}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-black">{s.name}</div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase">
                        {s.category ?? "Uncategorized"} · #{s.provider_service_id}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold uppercase text-gray-500">{s.provider?.name ?? "—"}</td>
                    <td className="px-6 py-4 text-xs font-mono font-black">
                      {currentSymbol}{((Number(s.provider_cost || 0)) * (s.provider?.currency === 'PKR' || s.provider?.currency === 'PKR' ? 1 : (Number(currencySettings?.usdt_to_inr || currencySettings?.usdt_rate || 280)))).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {s.provider_min} / {s.provider_max}
                    </td>
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
