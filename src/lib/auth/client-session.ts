import { supabase } from "@/integrations/supabase/client";

/**
 * Centralized client-side session management.
 *
 * This is the ONLY code in the app allowed to touch the Supabase auth
 * cookie/localStorage. Everywhere else must go through:
 *   - establishClientSession() after signIn/signUp
 *   - clearClientSession() on logout
 *   - initSessionCookieSync() once, at app startup
 */

function getProjectRef(): string | null {
  const url = (import.meta as any).env?.['VITE_SUPABASE_URL'] || 'https://owlbeyryintvqaykodxs.supabase.co';
  if (typeof url !== 'string') return null;
  const match = url.match(/https?:\/\/([^.]+)\./);
  return match ? (match[1] as string) : null;
}

function getCookieName(): string | null {
  const ref = getProjectRef();
  return ref ? `sb-${ref}-auth-token` : null;
}

function writeSessionCookie(session: { access_token: string; refresh_token: string; expires_at?: number }) {
  if (typeof document === 'undefined') return;
  const cookieName = getCookieName();
  if (!cookieName) return;
  const payload = JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
  });
  document.cookie = `${cookieName}=${encodeURIComponent(payload)}; path=/; max-age=31536000; SameSite=Lax`;
}

function clearSessionCookie() {
  if (typeof document === 'undefined') return;
  const cookieName = getCookieName();
  if (!cookieName) return;
  document.cookie = `${cookieName}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export async function establishClientSession(tokens: {
  access_token: string;
  refresh_token: string;
}): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!tokens?.access_token || !tokens?.refresh_token) return false;

  const { data, error } = await supabase.auth.setSession({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
  });

  if (error || !data?.session) {
    console.error("[establishClientSession] Rejected by Supabase Auth:", error?.message);
    return false;
  }

  writeSessionCookie(data.session);
  return true;
}

export async function clearClientSession(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.error("[clearClientSession] signOut error:", e);
  }
  clearSessionCookie();
}

export function initSessionCookieSync(): () => void {
  if (typeof window === 'undefined') return () => {};

  const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      clearSessionCookie();
      return;
    }
    if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION')) {
      writeSessionCookie(session);
    }
  });

  return () => listener?.subscription?.unsubscribe();
}
