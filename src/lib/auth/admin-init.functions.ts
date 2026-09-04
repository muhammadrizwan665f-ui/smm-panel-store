import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const ensureAdminAccount = createServerFn({ method: "POST" })
  .handler(async () => {
    const { supabaseAdmin: supabase } = await import("@/integrations/supabase/client.server");
    
    const adminMobile = "03154429417";
    const adminPassword = "03154429417";
    const adminEmail = `${adminMobile}@mobile.panel`;

    // 1. Check if user exists in auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    let adminUser = userData?.users.find(u => u.email === adminEmail);

    if (!adminUser) {
      // Create user if not exists
      const { data: newUserData, error: createError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          mobile_number: adminMobile
        }
      });
      if (createError) throw createError;
      adminUser = newUserData.user;
    }

    if (!adminUser) throw new Error("Could not create/find admin user");

    // 2. Ensure role is assigned in user_roles table
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', adminUser.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: adminUser.id, role: 'admin' });
      if (roleError) throw roleError;
    }

    // 3. Ensure profile exists and is active
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', adminUser.id)
      .single();

    if (!profileData) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: adminUser.id,
          mobile_number: adminMobile,
          wallet_balance: 0
        });
      if (profileError) throw profileError;
    } else {
      // Update role/status if profile exists
      await supabase
        .from('profiles')
        .update({ mobile_number: adminMobile })
        .eq('id', adminUser.id);
    }

    return { success: true, message: "Admin account verified/created" };
  });
