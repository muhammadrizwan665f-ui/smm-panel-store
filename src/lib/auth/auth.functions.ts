import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const authSchema = z.object({
  identifier: z.string(),
  password: z.string().min(8),
});

/**
 * Standard public registration using supabase.auth.signUp.
 * Does NOT use Admin API or bypass email confirmation unless configured in Supabase.
 */
export const signUp = createServerFn({ method: "POST" })
  .inputValidator((data: any) => {
    const input = data?.data || data;
    return authSchema.extend({ confirmPassword: z.string() }).parse(input);
  })
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUrl = process.env['SUPABASE_URL'] || process.env['VITE_SUPABASE_URL'] || 'https://owlbeyryintvqaykodxs.supabase.co';
    const supabaseAnonKey = process.env['SUPABASE_PUBLISHABLE_KEY'] || process.env['VITE_SUPABASE_PUBLISHABLE_KEY'] || 'sb_publishable_t8tESVD5AZkds6n6Pd1Oqg_5CuktjKc';
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });
    
    if (data.password !== data.confirmPassword) {
      throw new Error("Passwords do not match");
    }

    const isEmail = data.identifier.includes('@');
    const normalizedIdentifier = isEmail ? data.identifier.trim().toLowerCase() : data.identifier.replace(/\D/g, '');
    const email = isEmail ? normalizedIdentifier : `${normalizedIdentifier}@mobile.panel`;
    const mobileNumber = isEmail ? null : normalizedIdentifier;
    
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: data.password,
      options: {
        data: {
          mobile_number: mobileNumber,
          is_email_auth: isEmail
        }
      }
    });

    if (signUpError) {
      console.error("Supabase signUp error:", signUpError);
      return { success: false, error: signUpError.message };
    }
    
    return { 
      success: true, 
      user: authData.user ? { id: authData.user.id, email: authData.user.email } : null, 
      session: authData.session ? { 
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_in: authData.session.expires_in,
        token_type: authData.session.token_type,
        user: { id: authData.session.user.id, email: authData.session.user.email }
      } : null 
    };
  });

/**
 * Securely initialize profile and roles after signup.
 * Requires an authenticated session.
 */
export const completeProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;

    if (!userId) {
      console.warn("completeProfile: No userId in context");
      return { success: false, error: "Unauthorized" };
    }

    try {
      // Uses the already-validated JWT claims from auth middleware — no
      // fresh privileged lookup needed, since this data is already on the
      // user's own token. Writes go through a SECURITY DEFINER RPC
      // (complete_my_profile) rather than the service-role client, so
      // signup no longer depends on SUPABASE_SERVICE_ROLE_KEY being
      // configured at all.
      const user = (context as any).claims;
      if (!user) {
        return { success: false, error: "Auth user not found" };
      }

      const userMetadata = (user.user_metadata || {}) as any;
      const mobileNumber = userMetadata['mobile_number'] || user.email?.split('@')[0];
      // Only store a real email (not the synthetic "xxxxx@mobile.panel"
      // placeholder used for mobile-only signups).
      const realEmail = user.email && !user.email.endsWith('@mobile.panel') ? user.email : null;

      const supabase = (context as any).supabase;
      const { error } = await supabase.rpc("complete_my_profile", {
        p_mobile_number: mobileNumber,
        p_email: realEmail,
      });
      if (error) {
        console.error("completeProfile RPC error:", error.message);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (e: any) {
      console.error("completeProfile unexpected error:", e);
      return { success: false, error: "Internal error" };
    }
  });

export const signIn = createServerFn({ method: "POST" })
  .inputValidator((data: any) => {
    const input = data?.data || data;
    return authSchema.parse(input);
  })
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUrl = process.env['SUPABASE_URL'] || process.env['VITE_SUPABASE_URL'] || 'https://owlbeyryintvqaykodxs.supabase.co';
    const supabaseAnonKey = process.env['SUPABASE_PUBLISHABLE_KEY'] || process.env['VITE_SUPABASE_PUBLISHABLE_KEY'] || 'sb_publishable_t8tESVD5AZkds6n6Pd1Oqg_5CuktjKc';
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });
    
    const isEmail = data.identifier.includes('@');
    const normalizedIdentifier = isEmail ? data.identifier.trim().toLowerCase() : data.identifier.replace(/\D/g, '');
    const email = isEmail ? normalizedIdentifier : `${normalizedIdentifier}@mobile.panel`;
    
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: data.password,
    });

    if (signInError) {
      console.error("Supabase signIn error:", signInError);
      return { success: false, error: signInError.message };
    }

    if (!authData.user || !authData.session) {
      return { success: false, error: "Login failed: Session not established." };
    }

    return { 
      success: true, 
      user: { id: authData.user.id, email: authData.user.email }, 
      session: { 
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_in: authData.session.expires_in,
        token_type: authData.session.token_type,
        user: { id: authData.session.user.id, email: authData.session.user.email }
      } 
    };
  });

export const signOut = createServerFn({ method: "POST" })
  .handler(async () => {
    return { success: true };
  });

/** Public: request a password-reset OTP for a mobile-only account (free,
 * WhatsApp-relayed alternative to email reset — see admin_view_reset_requests). */
export const requestMobilePasswordResetOtp = createServerFn({ method: "POST" })
  .inputValidator((d: any) => z.object({ mobile: z.string().min(5) }).parse(d?.data ?? d))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUrl = process.env['SUPABASE_URL'] || process.env['VITE_SUPABASE_URL'] || 'https://owlbeyryintvqaykodxs.supabase.co';
    const supabaseAnonKey = process.env['SUPABASE_PUBLISHABLE_KEY'] || process.env['VITE_SUPABASE_PUBLISHABLE_KEY'] || 'sb_publishable_t8tESVD5AZkds6n6Pd1Oqg_5CuktjKc';
    const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });

    const mobile = data.mobile.replace(/\D/g, '');
    await supabase.rpc("request_password_reset_otp", { p_mobile: mobile });
    // Always return success — never reveal whether that number is registered.
    return { success: true };
  });

/** Public: complete the reset once the user has the OTP (relayed by an admin via WhatsApp). */
export const resetMobilePasswordWithOtp = createServerFn({ method: "POST" })
  .inputValidator((d: any) =>
    z.object({ mobile: z.string().min(5), otp: z.string().length(6), newPassword: z.string().min(6) }).parse(d?.data ?? d),
  )
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUrl = process.env['SUPABASE_URL'] || process.env['VITE_SUPABASE_URL'] || 'https://owlbeyryintvqaykodxs.supabase.co';
    const supabaseAnonKey = process.env['SUPABASE_PUBLISHABLE_KEY'] || process.env['VITE_SUPABASE_PUBLISHABLE_KEY'] || 'sb_publishable_t8tESVD5AZkds6n6Pd1Oqg_5CuktjKc';
    const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });

    const mobile = data.mobile.replace(/\D/g, '');
    const { data: ok, error } = await supabase.rpc("reset_password_with_otp", {
      p_mobile: mobile,
      p_otp: data.otp,
      p_new_password: data.newPassword,
    });
    if (error) return { success: false, error: error.message };
    return { success: !!ok, error: ok ? undefined : "Invalid or expired code" };
  });
