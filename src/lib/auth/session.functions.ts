import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

function getAuthCookieName(): string | null {
  const supabaseUrl = process.env['VITE_SUPABASE_URL'] || process.env['SUPABASE_URL'] || 'https://owlbeyryintvqaykodxs.supabase.co';
  const projectRefMatch = supabaseUrl.match(/https:\/\/([^.]+)/);
  const projectRef = projectRefMatch ? projectRefMatch[1] : null;
  return projectRef ? `sb-${projectRef}-auth-token` : null;
}

function readAuthCookie(cookieHeader: string | null | undefined): { access_token?: string; refresh_token?: string } | null {
  if (!cookieHeader) return null;
  const cookieName = getAuthCookieName();
  if (!cookieName) return null;
  const match = cookieHeader.match(new RegExp(`${cookieName}=([^;]+)`));
  if (!match?.[1]) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}

/**
 * Centralized, server-authoritative session resolution.
 */
export const getSession = createServerFn({ method: "GET" })
  .handler(async () => {
    const { createClient } = await import("@supabase/supabase-js");
    const SUPABASE_URL = process.env['SUPABASE_URL'] || process.env['VITE_SUPABASE_URL'] || 'https://owlbeyryintvqaykodxs.supabase.co';
    const SUPABASE_PUBLISHABLE_KEY = process.env['SUPABASE_PUBLISHABLE_KEY'] || process.env['VITE_SUPABASE_PUBLISHABLE_KEY'] || 'sb_publishable_t8tESVD5AZkds6n6Pd1Oqg_5CuktjKc';

    // A plain (anon-key) client is enough to validate a user's own token —
    // it does not require the service-role key.
    const anonClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false },
    });

    const request = getRequest();

    let userId: string | null = null;
    let activeToken: string | null = null;

    // 1. Authorization header (RPC/API calls)
    const authHeader = request?.headers?.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data, error: userError } = await anonClient.auth.getUser(token);
      if (!userError && data?.user) {
        userId = data.user.id;
        activeToken = token;
      }
    }

    // 2. Cookie (SSR / full navigations)
    let cookieSession: { access_token?: string; refresh_token?: string } | null = null;
    let refreshTokenCandidate: string | null = null;
    if (!userId) {
      cookieSession = readAuthCookie(request?.headers?.get('cookie'));
      if (cookieSession?.access_token) {
        const { data } = await anonClient.auth.getUser(cookieSession.access_token);
        if (data?.user) {
          userId = data.user.id;
          activeToken = cookieSession.access_token;
        } else if (cookieSession.refresh_token) {
          refreshTokenCandidate = cookieSession.refresh_token;
        }
      } else if (cookieSession?.refresh_token) {
        refreshTokenCandidate = cookieSession.refresh_token;
      }
    }

    // 3. Refresh safety net
    if (!userId && refreshTokenCandidate) {
      const { data, error } = await anonClient.auth.refreshSession({ refresh_token: refreshTokenCandidate });
      if (!error && data?.user) {
        userId = data.user.id;
        activeToken = data.session?.access_token ?? null;
      }
    }

    if (!userId) {
      return { user: null, role: null };
    }

    try {
      // Query as the user themselves (their own token), so normal
      // "read your own row" RLS policies apply — no admin key needed.
      const scopedClient = activeToken
        ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
            auth: { persistSession: false },
            global: { headers: { Authorization: `Bearer ${activeToken}` } },
          })
        : anonClient;

      const [profileRes, rolesRes] = await Promise.all([
        scopedClient
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle(),
        scopedClient
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
      ]);

      const profile = profileRes.data;
      const roles = rolesRes.data || [];
      const isAdmin = roles.some((r: { role: string }) => r.role === 'admin');
      const finalRole = isAdmin ? 'admin' : (roles[0]?.role || 'user');

      return {
        user: profile,
        role: finalRole
      };
    } catch (e) {
      console.error("[getSession] Database error:", e);
      return { user: null, role: null };
    }
  });
