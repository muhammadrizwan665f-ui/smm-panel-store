import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const adminCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const ensureAdminUser = createServerFn({ method: "POST" })
  .inputValidator((data: any) => adminCreateSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    console.log(`[AdminSetup] Ensuring admin user: ${data.email}`);
    
    // 1. Check if user exists in Auth
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;
    
    let user = users.find(u => u.email === data.email);
    
    if (!user) {
      console.log(`[AdminSetup] Creating new auth user...`);
      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: { is_admin: true }
      });
      
      if (createError) throw createError;
      user = createData.user;
    } else {
      console.log(`[AdminSetup] User already exists, updating password...`);
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password: data.password,
        email_confirm: true
      });
      if (updateError) throw updateError;
    }

    if (!user) throw new Error("Failed to resolve user");

    // 2. Ensure profile exists
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: user.id,
        mobile_number: user.email?.split('@')[0] || 'admin',
        wallet_balance: 0
      }, { onConflict: 'id' });
    
    if (profileError) console.error("[AdminSetup] Profile upsert error:", profileError);

    // 3. Ensure admin role exists
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: user.id,
        role: 'admin'
      }, { onConflict: 'user_id, role' });

    if (roleError) throw roleError;

    return { success: true, userId: user.id };
  });
