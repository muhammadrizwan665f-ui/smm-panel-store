import React, { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { establishClientSession } from "@/lib/auth/client-session";
import { completeProfile } from "@/lib/auth/auth.functions";

export const Route = createFileRoute("/auth/callback")({
  component: GoogleAuthCallbackPage,
});

function GoogleAuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const finishGoogleSignIn = async () => {
      try {
        // Supabase's detectSessionInUrl handles the OAuth code exchange.
        // getSession() waits for the Supabase client to finish initialization.
        let { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        // Fallback for cases where automatic URL detection has not exchanged
        // the authorization code yet.
        if (!data.session) {
          const code = new URLSearchParams(window.location.search).get("code");
          if (code) {
            const exchange = await supabase.auth.exchangeCodeForSession(code);
            if (exchange.error) throw exchange.error;
            data = { session: exchange.data.session };
          }
        }

        if (!data.session?.access_token || !data.session.refresh_token) {
          throw new Error("Google sign-in did not return a valid session. Please try again.");
        }

        const established = await establishClientSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        if (!established) {
          throw new Error("Your Google account was verified, but the session could not be saved. Please try again.");
        }

        try {
          await completeProfile();
        } catch (profileError) {
          // A profile-sync issue should not discard a valid authenticated session.
          console.warn("Google sign-in profile sync failed:", profileError);
        }

        if (active) {
          await navigate({ to: "/dashboard", replace: true });
        }
      } catch (err) {
        console.error("GOOGLE_AUTH_CALLBACK_ERROR:", err);
        if (active) {
          setError(err instanceof Error ? err.message : "Google sign-in failed. Please try again.");
        }
      }
    };

    void finishGoogleSignIn();

    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <section className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-xl">
        {error ? (
          <>
            <h1 className="text-xl font-bold text-foreground">Google sign-in failed</h1>
            <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>
            <Link
              to="/login"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
            >
              Back to Login
            </Link>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto h-9 w-9 animate-spin text-primary" />
            <h1 className="mt-5 text-xl font-bold text-foreground">Signing you in</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Please wait while we securely connect your Google account.
            </p>
          </>
        )}
      </section>
    </main>
  );
}
