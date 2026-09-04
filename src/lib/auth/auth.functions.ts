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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    if (!userId) {
      console.warn("completeProfile: No userId in context");
      return { success: false, error: "Unauthorized" };
    }

    try {
      // Bypassing any User object that might trigger the seroval-plugin-supabase error
      const { data: userRows, error: userError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();
      
      // We check if it exists or create it
      const { data: { user }, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (authUserError || !user) {
         return { success: false, error: "Auth user not found" };
      }

      const userMetadata = (user.user_metadata || {}) as any;
      const mobileNumber = userMetadata['mobile_number'] || user.email?.split('@')[0];

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userId,
          mobile_number: mobileNumber,
          wallet_balance: 0
        }, { onConflict: 'id' });

      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: 'user' as any
        }, { onConflict: 'user_id, role' });

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
