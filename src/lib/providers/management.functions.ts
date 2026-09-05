import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getInternalServices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabaseAdmin = (context as any)?.supabase;

    const { data, error } = await supabaseAdmin
      .from('services')
      .select(`
        *,
        category:service_categories(id, name),
        provider:providers(id, name)
      `)
      .eq('service_type', 'api')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return JSON.stringify(data || []);
  });

export const updateServiceStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d as { id: string; status: 'active' | 'inactive' })
  .handler(async ({ data, context }) => {
    const supabaseAdmin = (context as any)?.supabase;

    const { error } = await supabaseAdmin
      .from('services')
      .update({ status: data.status })
      .eq('id', data.id);

    if (error) throw new Error(error.message);
    return JSON.stringify({ success: true });
  });

export const deleteService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d as { id: string })
  .handler(async ({ data, context }) => {
    const supabaseAdmin = (context as any)?.supabase;

    const { error } = await supabaseAdmin
      .from('services')
      .delete()
      .eq('id', data.id);

    if (error) throw new Error(error.message);
    return JSON.stringify({ success: true });
  });
