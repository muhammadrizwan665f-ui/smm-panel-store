import { createFileRoute } from "@tanstack/react-router";
import React from "react";
import { toast } from "sonner";
import { Loader2, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { adminUpdateCredentials } from "@/lib/settings/branding.functions";

export const Route = createFileRoute("/management/settings/account")({
  component: AccountPage,
});

function AccountPage() {
  const [currentEmail, setCurrentEmail] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const e = data.user?.email ?? "";
      setCurrentEmail(e);
      setEmail(e);
    });
  }, []);

  const save = async () => {
    if (password && password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setSaving(true);
    try {
      const res = JSON.parse(
        await adminUpdateCredentials({
          data: {
            email: email !== currentEmail ? email : undefined,
            password: password || undefined,
          },
        })
      );
      if (!res.success) throw new Error(res.message);
      toast.success("Login credentials updated");
      setPassword("");
      setConfirm("");
      setCurrentEmail(email);
    } catch (e: any) {
      toast.error(e?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl bg-white rounded-3xl border shadow-sm p-6 space-y-5">
      <h2 className="text-sm font-black uppercase tracking-widest text-gray-500">Admin Login</h2>

      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Email</label>
        <input
          className="mt-1 w-full rounded-xl border px-4 py-3 text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@example.com"
        />
      </div>

      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-gray-500">New Password</label>
        <input
          type="password"
          className="mt-1 w-full rounded-xl border px-4 py-3 text-sm"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Leave blank to keep current password"
        />
      </div>

      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Confirm Password</label>
        <input
          type="password"
          className="mt-1 w-full rounded-xl border px-4 py-3 text-sm"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-6 py-3 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
        Update Credentials
      </button>
    </div>
  );
}
