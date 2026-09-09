import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import React from "react";
import { requestMobilePasswordResetOtp, resetMobilePasswordWithOtp } from "@/lib/auth/auth.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = React.useState<"request" | "verify">("request");
  const [identifier, setIdentifier] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    setLoading(true);
    try {
      await requestMobilePasswordResetOtp({ data: { mobile: identifier.trim() } });
      toast.success("If this account exists, our support team will send you a code via WhatsApp/email shortly.");
      setStep("verify");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const verifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (password !== confirm) { toast.error("Passwords don't match"); return; }
    setLoading(true);
    try {
      const res = await resetMobilePasswordWithOtp({ data: { mobile: identifier.trim(), otp, newPassword: password } });
      if (res.success) {
        toast.success("Password updated! Please log in.");
        await navigate({ to: "/login" });
      } else {
        toast.error(res.error || "Invalid or expired code");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 rounded-3xl border p-8 shadow-sm">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Reset Password</h1>
        </div>

        {step === "request" ? (
          <form onSubmit={requestOtp} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter the mobile number or email you registered with. Our support team will send you a 6-digit code.
            </p>
            <input
              type="text"
              required
              placeholder="03XXXXXXXXX or you@example.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full rounded-2xl border px-4 py-3 text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl py-3 text-sm font-black uppercase tracking-widest text-white gradient-primary shadow-lg disabled:opacity-70"
            >
              {loading ? "Requesting…" : "Request Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyAndReset} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit code we sent you, and your new password.
            </p>
            <input
              type="text"
              required
              maxLength={6}
              placeholder="6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="w-full rounded-2xl border px-4 py-3 text-sm tracking-[0.3em] text-center font-black"
            />
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
              {loading ? "Saving…" : "Set New Password"}
            </button>
            <button
              type="button"
              onClick={() => setStep("request")}
              className="w-full text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Didn't get a code? Try again
            </button>
          </form>
        )}

        <Link to="/login" className="block text-center text-sm font-medium text-primary hover:text-primary/80">
          Back to Login
        </Link>
      </div>
    </div>
  );
}
