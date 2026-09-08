import { createFileRoute, Link } from "@tanstack/react-router";
import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      // Supabase handles the whole secure flow itself: a one-time signed
      // link is emailed to the user, and nobody — not the admin, not us,
      // not even Supabase — ever sees or sets their password directly.
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      // Deliberately vague — don't reveal whether an account exists for
      // this email, same reasoning as the site's other auth flows.
      toast.error("If an account exists for this email, a reset link has been sent.");
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 rounded-3xl border p-8 shadow-sm">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Reset Password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the email you signed up with and we'll send you a secure link to set a new password.
          </p>
        </div>

        {sent ? (
          <div className="rounded-2xl bg-primary/5 p-4 text-sm">
            If an account exists for <span className="font-bold">{email}</span>, a reset link has been sent.
            Check your inbox (and spam folder) and follow the link to set a new password.
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border px-4 py-3 text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl py-3 text-sm font-black uppercase tracking-widest text-white gradient-primary shadow-lg disabled:opacity-70"
            >
              {loading ? "Sending…" : "Send Reset Link"}
            </button>
          </form>
        )}

        <p className="text-xs text-muted-foreground">
          Signed up with just a mobile number (no email)? Email reset won't reach you — please contact support
          via WhatsApp instead so an admin can help you regain access.
        </p>

        <Link to="/login" className="block text-center text-sm font-medium text-primary hover:text-primary/80">
          Back to Login
        </Link>
      </div>
    </div>
  );
}
