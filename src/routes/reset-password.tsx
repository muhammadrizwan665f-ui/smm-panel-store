import { createFileRoute, useNavigate } from "@tanstack/react-router";
import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = React.useState(false);
  const [invalid, setInvalid] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    // Clicking the emailed link lands here with a recovery token in the URL
    // (Supabase's client picks it up automatically and establishes a
    // temporary "recovery" session — this is what lets updateUser() below
    // work without the user needing to already be logged in).
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      else setTimeout(() => setInvalid((r) => (ready ? r : true)), 3000);
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated — you're logged in.");
      await navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message || "Could not update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 rounded-3xl border p-8 shadow-sm">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Set New Password</h1>
        </div>

        {invalid && !ready ? (
          <div className="rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">
            This reset link is invalid or has expired. Please request a new one from the login page.
          </div>
        ) : !ready ? (
          <p className="text-sm text-muted-foreground">Verifying your reset link…</p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <input
              type="password"
              required
              minLength={6}
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border px-4 py-3 text-sm"
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-2xl border px-4 py-3 text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl py-3 text-sm font-black uppercase tracking-widest text-white gradient-primary shadow-lg disabled:opacity-70"
            >
              {loading ? "Saving…" : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
