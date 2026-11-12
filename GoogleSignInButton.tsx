import React from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function GoogleSignInButton() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { prompt: "select_account" },
        },
      });

      if (authError) throw authError;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in could not start.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative flex items-center">
        <div className="flex-1 border-t border-border" />
        <span className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          or continue with
        </span>
        <div className="flex-1 border-t border-border" />
      </div>

      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 rounded-2xl border border-border bg-background px-4 py-3.5 text-sm font-bold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.75 3.27-8.1Z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.28-1.93-6.15-4.53H2.16v2.87A11 11 0 0 0 12 23Z" />
            <path fill="#FBBC05" d="M5.85 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.35-2.11V7.02H2.16A11 11 0 0 0 1 12c0 1.78.43 3.46 1.16 4.98l3.69-2.87Z" />
            <path fill="#EA4335" d="M12 5.36c1.62 0 3.07.56 4.21 1.64l3.16-3.16C17.45 2.17 14.97 1 12 1a11 11 0 0 0-9.84 6.02l3.69 2.87c.87-2.6 3.29-4.53 6.15-4.53Z" />
          </svg>
        )}
        {loading ? "Connecting..." : "Continue with Google"}
      </button>

      {error && (
        <p role="alert" className="text-center text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
