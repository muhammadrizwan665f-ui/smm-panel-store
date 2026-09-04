import { createFileRoute, useParams } from "@tanstack/react-router";
import { 
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Search,
  Filter
} from "lucide-react";
import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/management/providers/$id/logs")({
  component: ProviderLogs,
});

function ProviderLogs() {
  const { id } = useParams({ from: "/management/providers/$id/logs" });
  const [logs, setLogs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('provider_api_logs')
      .select('*' as any)
      .eq('provider_id', id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) toast.error("Failed to load logs");
    else setLogs(data || []);
    setLoading(false);
  };

  React.useEffect(() => {
    fetchLogs();
  }, [id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black uppercase tracking-tight">API Activity Logs</h2>
        <button 
          onClick={fetchLogs}
          className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 transition-colors"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-50">
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Time</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Operation</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={4} className="p-20 text-center"><RefreshCw className="animate-spin mx-auto" /></td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={4} className="p-20 text-center text-gray-400 font-bold uppercase text-[10px] tracking-widest">No activity logged yet</td></tr>
            ) : logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-[10px] font-bold text-gray-500">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4 font-black text-gray-900 text-xs uppercase tracking-tight">
                  {log.operation}
                </td>
                <td className="px-6 py-4">
                  <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${
                    log.is_success ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                  }`}>
                    {log.is_success ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                    {log.status_code || (log.is_success ? 'Success' : 'Failed')}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <button className="text-[9px] font-black uppercase text-blue-600 hover:text-blue-800">View JSON</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
