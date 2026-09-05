import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const runOrderConsistencyTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({
    orderId: z.string().uuid()
  }))
  .handler(async ({ data, context }) => {
    const supabaseAdmin = (context as any)?.supabase;
    const { orderId } = data;

    console.log(`[OrderConsistencyTest] Starting test for order ${orderId}`);

    // Simulation: We expect the retry mechanism to kick in.
    // The test runner (client) should call this server function.
    
    // Step 1: Check if order exists. 
    // We will use the same retry mechanism as in placeProviderOrder
    let retryCount = 0;
    const maxRetries = 3;
    let found = false;

    while (retryCount < maxRetries) {
      const { data: order, error } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('id', orderId)
        .single();

      if (order && !error) {
        found = true;
        break;
      }

      retryCount++;
      const delay = 500 * retryCount;
      console.log(`[OrderConsistencyTest] Order ${orderId} not found (attempt ${retryCount}). Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    if (!found) {
      console.error(`[OrderConsistencyTest] All retries failed for ${orderId}.`);
      return { 
        success: false, 
        message: `Retry failed: Order not found. (ID: ${orderId})`,
        found: false,
        attempts: retryCount
      };
    }

    console.log(`[OrderConsistencyTest] Order ${orderId} found after ${retryCount} retries.`);
    return { 
      success: true, 
      message: `Order found after ${retryCount} retries.`,
      found: true,
      attempts: retryCount
    };
  });
