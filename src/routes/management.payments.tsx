import { createFileRoute } from "@tanstack/react-router";
import React from "react";
import { toast } from "sonner";
import { Plus, Trash2, Edit, Loader2, CheckCircle2, XCircle, RefreshCw, QrCode } from "lucide-react";
import { useAdminData, AdminState } from "@/components/admin/AdminData";
import {
  adminListGateways,
  adminSaveGateway,
  adminDeleteGateway,
  adminListDeposits,
  adminReviewDeposit,
  adminTestGateway,
} from "@/lib/payments/payments.functions";

export const Route = createFileRoute("/management/payments")({
  component: PaymentsPage,
});

const emptyForm = {
  id: "" as string | undefined,
  name: "BharatPay QR",
  provider: "bharatpay",
  type: "auto" as "auto" | "manual",
  merchant_id: "",
  access_token: "",
  qr_image_url: "",
  account_number: "",
  iban: "",
  mobile_number: "",
  has_access_token: false,
  fee_percent: 0,
  bonus_percent: 0,
  bonus_start_amount: 0,
  expiry_minutes: 30,
  instructions: "Open any UPI app, scan the QR and pay the exact amount. Your wallet is credited automatically.",
  min_amount: 100,
  max_amount: 100000,
  auto_verify: true,
  status: "active" as "active" | "inactive",
};


function PaymentsPage() {
  const gateways = useAdminData<any[]>(() => adminListGateways());
  const [depositFilter, setDepositFilter] = React.useState<string>("pending");
  const deposits = useAdminData<any[]>(() => adminListDeposits({ data: { status: depositFilter } }), [depositFilter]);

  const [form, setForm] = React.useState({ ...emptyForm });
  const [saving, setSaving] = React.useState(false);
  const [testingId, setTestingId] = React.useState<string | null>(null);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const res = JSON.parse(
        await adminSaveGateway({
          data: {
            id: form.id || undefined,
            name: form.name.trim(),
            provider: form.provider.trim() || "bharatpay",
            type: form.type,
            merchant_id: form.merchant_id || null,
            access_token: form.access_token || null,
            qr_image_url: form.qr_image_url || null,
            account_number: form.account_number || null,
            iban: form.iban || null,
            mobile_number: form.mobile_number || null,
            fee_percent: Number(form.fee_percent) || 0,
            bonus_percent: Number(form.bonus_percent) || 0,
            bonus_start_amount: Number(form.bonus_start_amount) || 0,
            expiry_minutes: Number(form.expiry_minutes) || 30,
            instructions: form.instructions || null,
            min_amount: Number(form.min_amount) || 0,
            max_amount: Number(form.max_amount) || 100000,
            auto_verify: form.auto_verify,
            status: form.status,
          },
        }),
      );
      if (!res.success) { toast.error(res.message); return; }
      toast.success(form.id ? "Payment method updated" : "Payment method added");
      setForm({ ...emptyForm });
      gateways.reload();
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async (id: string) => {
    setTestingId(id);
    try {
      const res = JSON.parse(await adminTestGateway({ data: { id } }));
      if (res.success) toast.success(res.data.message);
      else toast.error(res.message);
    } catch (e: any) {
      toast.error(e.message || "Test failed");
    } finally {
      setTestingId(null);
    }
  };

  const edit = (g: any) => {
    setForm({
      id: g.id,
      name: g.name ?? "",
      provider: g.provider ?? "bharatpay",
      type: (g.type ?? "auto") as "auto" | "manual",
      merchant_id: g.merchant_id ?? "",
      access_token: "",
      qr_image_url: g.qr_image_url ?? "",
      account_number: g.account_number ?? "",
      iban: g.iban ?? "",
      mobile_number: g.mobile_number ?? "",
      has_access_token: !!g.has_access_token,
      fee_percent: Number(g.fee_percent ?? 0),
      bonus_percent: Number(g.bonus_percent ?? 0),
      bonus_start_amount: Number(g.bonus_start_amount ?? 0),
      expiry_minutes: Number(g.expiry_minutes ?? 30),
      instructions: g.instructions ?? "",
      min_amount: Number(g.min_amount ?? 100),
      max_amount: Number(g.max_amount ?? 100000),
      auto_verify: !!g.auto_verify,
      status: (g.status ?? "active") as "active" | "inactive",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this payment method?")) return;
    const res = JSON.parse(await adminDeleteGateway({ data: { id } }));
    if (!res.success) { toast.error(res.message); return; }
    toast.success("Deleted");
    gateways.reload();
  };

  const review = async (id: string, action: "approve" | "reject") => {
    const res = JSON.parse(await adminReviewDeposit({ data: { id, action } }));
    if (!res.success) { toast.error(res.message); return; }
    toast.success(action === "approve" ? "Deposit approved & wallet credited" : "Deposit rejected");
    deposits.reload();
  };

  const gatewayList = gateways.data ?? [];
  const depositList = deposits.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tighter uppercase text-gray-900">Payment Management</h1>
        <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-1">
          QR gateways, access tokens & automatic deposit verification
        </p>
      </div>

      {/* Gateway form */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">
          {form.id ? "Edit Payment Method" : "Add Payment Method"}
        </h2>

        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Display Name">
            <input value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} placeholder="BharatPay QR" />
          </Field>
          <Field label="Gateway Type">
            <select value={form.type} onChange={(e) => set("type", e.target.value)} className={inputCls}>
              <option value="auto">Auto (API Verification)</option>
              <option value="manual">Manual (Bank/Wallet Transfer)</option>
            </select>
          </Field>
          <Field label="Provider Key (Internal)">
            <input value={form.provider} onChange={(e) => set("provider", e.target.value)} className={inputCls} placeholder="bharatpay" />
          </Field>
          
          {form.type === 'auto' ? (
            <>
              <Field label="Merchant ID">
                <input value={form.merchant_id} onChange={(e) => set("merchant_id", e.target.value)} className={inputCls} placeholder="Merchant ID" />
              </Field>
              <Field label={`Access Token${form.has_access_token ? " (stored — leave blank to keep)" : ""}`}>
                <input type="password" autoComplete="new-password" value={form.access_token} onChange={(e) => set("access_token", e.target.value)} className={inputCls} placeholder={form.has_access_token ? "•••••••••• stored" : "Access token"} />
              </Field>
            </>
          ) : (
            <>
              <Field label="Account Number">
                <input value={form.account_number} onChange={(e) => set("account_number", e.target.value)} className={inputCls} placeholder="Bank account or wallet number" />
              </Field>
              <Field label="IBAN / Swift (Optional)">
                <input value={form.iban} onChange={(e) => set("iban", e.target.value)} className={inputCls} placeholder="IBAN number" />
              </Field>
              <Field label="Mobile Number (Optional)">
                <input value={form.mobile_number} onChange={(e) => set("mobile_number", e.target.value)} className={inputCls} placeholder="Mobile wallet number" />
              </Field>
              <Field label="QR Image URL">
                <div className="flex gap-2">
                  <input value={form.qr_image_url} onChange={(e) => set("qr_image_url", e.target.value)} className={inputCls} placeholder="URL to QR image" />
                  <button 
                    onClick={async () => {
                      const fileInput = document.createElement('input');
                      fileInput.type = 'file';
                      fileInput.accept = 'image/*';
                      fileInput.onchange = async (e: any) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        toast.info("Uploading QR...");
                        try {
                          const { uploadIconFile } = await import("@/lib/upload-icon");
                          const url = await uploadIconFile(file);
                          set("qr_image_url", url);
                          toast.success("QR uploaded");
                        } catch (err: any) {
                          toast.error(err.message || "Upload failed");
                        }
                      };
                      fileInput.click();
                    }}
                    className="px-4 py-3 bg-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest"
                  >
                    Upload
                  </button>
                </div>
              </Field>
            </>
          )}
          <Field label="Status">
            <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputCls}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
          <Field label="Min Amount">
            <input type="number" value={form.min_amount} onChange={(e) => set("min_amount", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Max Amount">
            <input type="number" value={form.max_amount} onChange={(e) => set("max_amount", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Fee %">
            <input type="number" value={form.fee_percent} onChange={(e) => set("fee_percent", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Bonus %">
            <input type="number" value={form.bonus_percent} onChange={(e) => set("bonus_percent", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Bonus Start Amount">
            <input type="number" value={form.bonus_start_amount} onChange={(e) => set("bonus_start_amount", e.target.value)} className={inputCls} />
          </Field>
          <Field label="QR Expiry (minutes)">
            <input type="number" value={form.expiry_minutes} onChange={(e) => set("expiry_minutes", e.target.value)} className={inputCls} />
          </Field>
        </div>
        <Field label="Instructions Shown To User">
          <textarea value={form.instructions} onChange={(e) => set("instructions", e.target.value)} rows={2} className={inputCls} />
        </Field>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-600">
            <input type="checkbox" checked={form.auto_verify} onChange={(e) => set("auto_verify", e.target.checked)} />
            Auto Verify With Token
          </label>

          <div className="flex gap-2 ml-auto">
            {form.id && (
              <button onClick={() => setForm({ ...emptyForm })} className="px-6 py-3 rounded-2xl bg-gray-100 text-gray-500 text-xs font-black uppercase tracking-widest">
                Cancel
              </button>
            )}
            <button onClick={save} disabled={saving} className="px-8 py-3 rounded-2xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-100 flex items-center gap-2 disabled:opacity-60">
              {saving ? <Loader2 size={16} className="animate-spin" /> : form.id ? <Edit size={16} /> : <Plus size={16} />}
              {form.id ? "Update" : "Add"}
            </button>
          </div>
        </div>
      </div>

      {/* Gateways list */}
      <div className="bg-white rounded-3xl shadow-sm border overflow-x-auto">
        <AdminState loading={gateways.loading} error={gateways.error} empty={gatewayList.length === 0} emptyLabel="No payment methods yet." errorLabel="Failed to load payment methods" onRetry={gateways.reload}>
          {/* Mobile cards */}
          <div className="md:hidden divide-y">
            {gatewayList.map((g: any) => (
              <div key={g.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-gray-900">{g.name}</div>
                    <div className="text-[9px] font-bold text-gray-400 uppercase">{g.provider} · {g.type}</div>
                    <div className="text-xs font-bold text-gray-500 mt-1">{g.merchant_id || g.account_number || "—"}</div>
                    <div className="text-xs font-bold text-gray-500 font-mono">{g.min_amount} - {g.max_amount}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${g.status === "active" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>{g.status}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {g.type === 'auto' && (
                    <button onClick={() => testConnection(g.id)} disabled={testingId === g.id} className="px-3 py-2 rounded-xl bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest disabled:opacity-50 flex items-center gap-1">
                      {testingId === g.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Test
                    </button>
                  )}
                  <button onClick={() => edit(g)} className="px-3 py-2 rounded-xl bg-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><Edit size={12} /> Edit</button>
                  <button onClick={() => remove(g.id)} className="px-3 py-2 rounded-xl bg-red-600 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><Trash2 size={12} /> Delete</button>
                </div>
              </div>
            ))}
          </div>
          <table className="w-full text-left hidden md:table">

            <thead>
              <tr className="border-b">
                <Th>QR</Th><Th>Name</Th><Th>Merchant</Th><Th>Auto Verify</Th><Th>Limits</Th><Th>Status</Th><Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {gatewayList.map((g: any) => (
                <tr key={g.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="w-12 h-12 rounded-xl border bg-white flex items-center justify-center overflow-hidden">
                      <QrCode size={18} className="text-gray-300" />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-gray-900">{g.name}<div className="text-[9px] font-bold text-gray-400 uppercase">{g.provider} · {g.type}</div></td>
                  <td className="px-6 py-4 text-xs font-bold text-gray-500">{g.merchant_id || g.account_number || "—"}</td>
                  <td className="px-6 py-4 text-xs font-bold">{g.type === 'auto' ? (g.has_access_token ? <span className="text-green-600">ON</span> : <span className="text-gray-400">OFF</span>) : <span className="text-blue-500">MANUAL</span>}</td>
                  <td className="px-6 py-4 text-xs font-bold text-gray-500 font-mono">{g.min_amount} - {g.max_amount}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${g.status === "active" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>{g.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {g.type === 'auto' && (
                        <button onClick={() => testConnection(g.id)} disabled={testingId === g.id} className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest disabled:opacity-50 flex items-center gap-1">
                          {testingId === g.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Test
                        </button>
                      )}
                      <button onClick={() => edit(g)} className="px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:bg-gray-200"><Edit size={12} /> Edit</button>
                      <button onClick={() => remove(g.id)} className="px-3 py-1.5 rounded-xl bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:bg-red-100"><Trash2 size={12} /> Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminState>
      </div>

      {/* Deposits */}
      <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Deposit Requests</h2>
          <div className="flex items-center gap-2">
            {["pending", "approved", "rejected", "all"].map((s) => (
              <button key={s} onClick={() => setDepositFilter(s)} className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${depositFilter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"}`}>{s}</button>
            ))}
            <button onClick={deposits.reload} className="p-2 text-gray-400 hover:text-blue-600"><RefreshCw size={14} /></button>
          </div>
        </div>
        <AdminState loading={deposits.loading} error={deposits.error} empty={depositList.length === 0} emptyLabel="No deposit requests." errorLabel="Failed to load deposits" onRetry={deposits.reload}>
          <div className="md:hidden divide-y">
            {depositList.map((d: any) => (
              <div key={d.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-black text-gray-900">{d.profile?.mobile_number || d.user_id.slice(0, 8)}</div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${d.status === "approved" ? "bg-green-50 text-green-600" : d.status === "rejected" ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-600"}`}>{d.status}</span>
                </div>
                <div className="text-sm font-black text-gray-900 font-mono">{Number(d.amount).toFixed(2)}</div>
                <div className="text-[10px] font-bold text-gray-500 font-mono break-all">UTR: {d.utr || "—"}</div>
                <div className="text-[10px] font-bold text-gray-500">{d.gateway?.name || "—"} · {new Date(d.created_at).toLocaleString()}</div>
                {d.status === "pending" && (
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => review(d.id, "approve")} className="flex-1 px-3 py-2 rounded-xl bg-green-600 text-white text-[10px] font-black uppercase flex items-center justify-center gap-1"><CheckCircle2 size={12} /> Approve</button>
                    <button onClick={() => review(d.id, "reject")} className="flex-1 px-3 py-2 rounded-xl bg-red-600 text-white text-[10px] font-black uppercase flex items-center justify-center gap-1"><XCircle size={12} /> Reject</button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="border-b">
                <Th>User</Th><Th>Amount</Th><Th>UTR</Th><Th>Method</Th><Th>Status</Th><Th>Date</Th><Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {depositList.map((d: any) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-xs font-black text-gray-900">{d.profile?.mobile_number || d.user_id.slice(0, 8)}</td>
                  <td className="px-6 py-4 text-sm font-black text-gray-900 font-mono">{Number(d.amount).toFixed(2)}</td>
                  <td className="px-6 py-4 text-xs font-bold text-gray-500 font-mono">{d.utr}</td>
                  <td className="px-6 py-4 text-xs font-bold text-gray-500">{d.gateway?.name || "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${d.status === "approved" ? "bg-green-50 text-green-600" : d.status === "rejected" ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-600"}`}>{d.status}</span>
                  </td>
                  <td className="px-6 py-4 text-[10px] font-bold text-gray-400">{new Date(d.created_at).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    {d.status === "pending" && (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => review(d.id, "approve")} className="px-3 py-1.5 rounded-xl bg-green-600 text-white text-[10px] font-black uppercase flex items-center gap-1"><CheckCircle2 size={12} /> Approve</button>
                        <button onClick={() => review(d.id, "reject")} className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-[10px] font-black uppercase flex items-center gap-1"><XCircle size={12} /> Reject</button>
                      </div>
                    )}
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

const inputCls = "w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm font-bold border-none focus:ring-2 focus:ring-blue-100";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">{label}</label>
      {children}
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest ${className}`}>{children}</th>;
}
