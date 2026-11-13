
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request
        ? input.headers
        : undefined
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

function getAuthCookieName(supabaseUrl: string): string | null {
  const match = supabaseUrl.match(/https:\/\/([^.]+)/);
  return match ? `sb-${match[1]}-auth-token` : null;
}

function readAccessToken(
  cookieHeader: string | null,
  supabaseUrl: string
): string | null {
  if (!cookieHeader) return null;

  const cookieName = getAuthCookieName(supabaseUrl);
  if (!cookieName) return null;

  const cookie = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${cookieName}=`));

  if (!cookie) return null;

  try {
    const value = decodeURIComponent(cookie.substring(cookieName.length + 1));
    const session = JSON.parse(value);
    return session?.access_token || null;
  } catch (error) {
    console.error("[AuthMiddleware] Could not read auth cookie:", error);
    return null;
  }
}

export const requireSupabaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const SUPABASE_URL =
      process.env["SUPABASE_URL"] ||
      process.env["VITE_SUPABASE_URL"] ||
      "https://mhyphzgzfijhjvptferr.supabase.co";

    const SUPABASE_PUBLISHABLE_KEY =
      process.env["SUPABASE_PUBLISHABLE_KEY"] ||
      process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
      "sb_publishable_ygB7P-HWTgI98Bs1xNUbYg_iiIx_hCb";

    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
      throw new Error("Missing Supabase configuration");
    }

    const request = getRequest();

    const authHeader = request?.headers?.get("authorization");
    const cookieHeader = request?.headers?.get("cookie");

    // First try Authorization header, then the website's Supabase session cookie.
    const token =
      authHeader?.startsWith("Bearer ")
        ? authHeader.substring(7)
        : readAccessToken(cookieHeader, SUPABASE_URL);
console.log("[AUTH DEBUG]", {
  hasAuthorizationHeader: !!authHeader,
  hasCookieHeader: !!cookieHeader,
  hasToken: !!token,
});
    const createPublicClient = () =>
      createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        global: {
          fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY),
        },
        auth: { persistSession: false },
      });

    if (!token) {
      return next({
        context: {
          supabase: createPublicClient() as any,
          userId: null as string | null,
          claims: null as any,
        },
      });
    }

    const supabase = createClient<Database>(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      {
        global: {
          fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY),
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        auth: { persistSession: false },
      }
    );

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.warn(
        "[AuthMiddleware] Invalid or expired session:",
        error?.message
      );

      return next({
        context: {
          supabase: createPublicClient() as any,
          userId: null as string | null,
          claims: null as any,
        },
      });
    }

    return next({
      context: {
        supabase: supabase as any,
        userId: user.id as string,
        claims: user as any,
      },
    });
  }
);
