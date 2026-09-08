import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { requestMobilePasswordResetOtp, resetMobilePasswordWithOtp } from "@/lib/auth/auth.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [mode, setMode] = React.useState<"email" | "mobile">("mobile");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 rounded-3xl border p-8 shadow-sm">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Reset Password</h1>
        </div>

        <div className="flex rounded-2xl border p-1">
          <button
            onClick={() => setMode("mobile")}
            className={`flex-1 rounded-xl py-2 text-xs font-black uppercase tracking-widest ${mode === "mobile" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            Mobile Number
          </button>
          <button
            onClick={() => setMode("email")}
            className={`flex-1 rounded-xl py-2 text-xs font-black uppercase tracking-widest ${mode === "email" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            Email
          </button>
        </div>

        {mode === "mobile" ? <MobileResetFlow /> : <EmailResetFlow />}

        <Link to="/login" className="block text-center text-sm font-medium text-primary hover:text-primary/80">
          Back to Login
        </Link>
      </div>
    </div>
  );
}

function EmailResetFlow() {
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
      await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
    } catch {
      // fall through — always show the same neutral message
    } finally {
      setSent(true);
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="rounded-2xl bg-primary/5 p-4 text-sm">
        If an account exists for <span className="font-bold">{email}</span>, a reset link has been sent.
        Check your inbox (and spam folder).
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">Only works if you signed up with a real email address.</p>
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
  );
}

function MobileResetFlow() {
  const navigate = useNavigate();
  const [step, setStep] = React.useState<"request" | "verify">("request");
  const [mobile, setMobile] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile.trim()) return;
    setLoading(true);
    try {
      await requestMobilePasswordResetOtp({ data: { mobile } });
      toast.success("If this number is registered, our support team will send you a code via WhatsApp shortly.");
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
      const res = await resetMobilePasswordWithOtp({ data: { mobile, otp, newPassword: password } });
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

  if (step === "request") {
    return (
      <form onSubmit={requestOtp} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Enter your registered mobile number. Our support team will send you a 6-digit code via WhatsApp.
        </p>
        <input
          type="tel"
          required
          placeholder="03XXXXXXXXX"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
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
    );
  }

  return (
    <form onSubmit={verifyAndReset} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Enter the 6-digit code sent to your WhatsApp, and your new password.
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
  );
}
