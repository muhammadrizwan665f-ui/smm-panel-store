import { createFileRoute } from "@tanstack/react-router";
import { useAdminData, AdminState } from "@/components/admin/AdminData";
import { adminListPasswordResetRequests } from "@/lib/admin/admin.functions";
import { MessageCircle } from "lucide-react";

export const Route = createFileRoute("/management/password-resets")({
  component: PasswordResetsPage,
});

function toWhatsappDigits(mobile: string): string {
  const digits = (mobile || "").replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 11) return "92" + digits.slice(1); // Pakistani local -> international
  return digits;
}

function PasswordResetsPage() {
  const { data, loading, error, reload } = useAdminData<any[]>(() => adminListPasswordResetRequests());
  const requests = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tighter uppercase">Password Reset Requests</h1>
        <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-1">
          Mobile-only accounts (no email) — relay this code to the user via WhatsApp
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
        <AdminState
          loading={loading}
          error={error}
          empty={requests.length === 0}
          emptyLabel="No pending reset requests."
          errorLabel="Failed to load requests"
          onRetry={reload}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Mobile</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Code</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Requested</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {requests.map((r) => {
                  const expired = new Date(r.expires_at) < new Date();
                  const status = r.used ? "Used" : expired ? "Expired" : "Pending";
                  const message = encodeURIComponent(
                    `Your password reset code is: ${r.otp}\nThis code expires in 15 minutes. Enter it on the "Forgot Password" page to set a new password.`,
                  );
                  return (
                    <tr key={r.id}>
                      <td className="px-6 py-4 text-sm font-black">{r.mobile_number}</td>
                      <td className="px-6 py-4 text-sm font-mono font-black text-blue-600 tracking-widest">{r.otp}</td>
                      <td className="px-6 py-4 text-xs font-bold uppercase text-gray-500">{status}</td>
                      <td className="px-6 py-4 text-xs text-gray-400">{new Date(r.created_at).toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                        {status === "Pending" && (
                          <a
                            href={`https://wa.me/${toWhatsappDigits(r.mobile_number)}?text=${message}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-green-700"
                          >
                            <MessageCircle className="h-3 w-3" /> Send via WhatsApp
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </AdminState>
      </div>
    </div>
  );
}
