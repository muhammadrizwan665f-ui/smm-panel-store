import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DEFAULT_EXCHANGE_RATE, DEFAULT_CUSTOMER_CURRENCY, DEFAULT_PRICE_ROUNDING } from "../currency.constants";

/**
 * Imports services from a provider into the internal service catalog
 * Refactored to use global currency conversion logic
 */
export const importServices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d as {
    providerId: string;
    serviceIds?: string[]; // If empty, import all
    markupType: 'fixed' | 'percentage';
    markupAmount: number;
    categoryId?: string; // Target category
    createNewCategory?: string; // Name for new category if needed
    parentCategoryId?: string; // If creating a new category, which platform it belongs under
  })
  .handler(async ({ data, context }) => {
    const supabaseAdmin = (context as any)?.supabase;

    const { providerId, serviceIds, markupType, markupAmount, categoryId, createNewCategory, parentCategoryId } = data;
    
    // 1. Fetch global currency settings
    const { data: settingsData } = await supabaseAdmin
      .from('site_settings')
      .select('key, value')
      .in('key', ['customer_currency', 'price_rounding', 'usdt_rate', 'usdt_to_inr']);
    
    const settings: Record<string, string> = {};
    settingsData?.forEach((item: any) => {
      settings[item.key] = item.value || '';
    });

    const usdtExchangeRate = parseFloat(settings['usdt_to_inr'] || settings['usdt_rate'] || String(DEFAULT_EXCHANGE_RATE)) || DEFAULT_EXCHANGE_RATE;
    const customerCurrency = settings['customer_currency'] || DEFAULT_CUSTOMER_CURRENCY;
    const roundingMethod = settings['price_rounding'] || DEFAULT_PRICE_ROUNDING;

    // 2. Fetch provider
    const { data: provider, error: pError } = await supabaseAdmin
      .from('providers')
      .select('currency')
      .eq('id', providerId)
      .single();

    if (pError || !provider) throw new Error("Provider not found");

    // 3. Fetch specific services to import
    let query = supabaseAdmin
      .from('provider_services')
      .select('*')
      .eq('provider_id', providerId);
    
    if (serviceIds && serviceIds.length > 0) {
      query = query.in('provider_service_id', serviceIds);
    }

    const { data: pServices, error: psError } = await query;
    if (psError || !pServices || pServices.length === 0) {
      console.error("Fetch provider services error:", psError);
      throw new Error("No provider services found to import");
    }

    // 4. Resolve category (admin chooses their own category during import)
    let targetCategoryId = categoryId || undefined;
    if (createNewCategory) {
      const { data: newCat, error: catError } = await supabaseAdmin
        .from('service_categories')
        .upsert({ name: createNewCategory, parent_category_id: parentCategoryId || null }, { onConflict: 'name' })
        .select('id')
        .single();

      if (catError) {
        const { data: existingCat } = await supabaseAdmin
          .from('service_categories')
          .select('id')
          .eq('name', createNewCategory)
          .maybeSingle();
        if (!existingCat) {
          return JSON.stringify({ success: false, message: `Category error: ${catError.message}` });
        }
        targetCategoryId = existingCat.id;
      } else {
        targetCategoryId = newCat?.id;
      }
    }


    let importedCount = 0;
    let updatedCount = 0;
    let errors = [];

    // 5. Process each service
    for (const ps of pServices) {
      try {
        const providerRate = Number(ps.provider_cost);
        const providerCurrency = provider.currency || 'USDT';
        
        // Step A: Normalize to USDT
        let usdtCost = providerRate;
        if (providerCurrency === 'PKR' || providerCurrency === 'PKR') {
          // If provider is already in base currency (PKR or PKR), cost is as is
          // Note: The logic previously assumed provider costs were in USDT unless PKR.
          // If the provider rate is in PKR and the customer currency is also PKR, no conversion needed.
          usdtCost = providerRate / usdtExchangeRate;
        } else if (providerCurrency === 'USD' || providerCurrency === 'USDT') {
          usdtCost = providerRate; // Base USDT
        } else {
          // Default: assume USDT unless explicitly specified as base currency
          usdtCost = providerRate;
        }
        
        // Step B: Convert USDT to Customer Currency
        const internalCost = usdtCost * usdtExchangeRate;

        // Step C: Apply Profit Markup
        let customerPrice = internalCost;
        if (markupType === 'percentage') {
          customerPrice = internalCost * (1 + markupAmount / 100);
        } else {
          customerPrice = internalCost + markupAmount;
        }

        // Step D: Apply Rounding
        if (roundingMethod === 'whole') {
          customerPrice = Math.round(customerPrice);
        } else if (roundingMethod === 'nearest_5') {
          customerPrice = Math.round(customerPrice / 5) * 5;
        } else if (roundingMethod === 'nearest_10') {
          customerPrice = Math.round(customerPrice / 10) * 10;
        } else if (roundingMethod === 'none') {
          // keep as is
        } else {
          // default 2 decimals
          customerPrice = Math.round(customerPrice * 100) / 100;
        }

        // Check if internal service already exists to decide if it's new import or update
        const { data: existingService } = await supabaseAdmin
          .from('services')
          .select('id')
          .eq('provider_id', providerId)
          .eq('provider_service_id', String(ps.provider_service_id))
          .maybeSingle();

        // Create/Update internal service (stays INACTIVE until admin activates it)
        const { error: upsertError } = await supabaseAdmin
          .from('services')
          .upsert({
            name: ps.name || `Service ${ps.provider_service_id}`,
            category_id: targetCategoryId || null,
            price_per_1000: customerPrice,
            customer_rate: customerPrice,
            min_quantity: ps.provider_min || 1,
            max_quantity: ps.provider_max || 9999999,
            description: ps.category ? `${ps.category} — provider service #${ps.provider_service_id}` : null,
            provider_id: providerId,
            provider_service_id: String(ps.provider_service_id),
            
            // Audit columns
            provider_currency: providerCurrency,
            provider_rate: providerRate,
            usdt_rate_at_calculation: usdtExchangeRate,
            normalized_usdt_cost: usdtCost,
            customer_currency: customerCurrency,
            converted_cost: internalCost,
            profit_type: markupType,
            profit_value: markupAmount,
            customer_price: customerPrice,
            
            status: 'inactive', // Remain inactive until admin review
            last_synced_at: new Date().toISOString()
          }, {
            onConflict: 'provider_id,provider_service_id'
          });

        if (upsertError) {
          console.error(`[IMPORT] failed for service ${ps.provider_service_id}:`, upsertError.message);
          errors.push(`Service ${ps.provider_service_id}: ${upsertError.message}`);
        } else {
          if (existingService) updatedCount++;
          else importedCount++;
        }
      } catch (e: any) {
        errors.push(`Service ${ps.provider_service_id}: ${e.message}`);
      }
    }

    return JSON.stringify({
      success: (importedCount + updatedCount) > 0,
      importedCount,
      updatedCount,
      totalProcessed: pServices.length,
      currency: customerCurrency,
      usdtExchangeRate,
      message: (importedCount + updatedCount) > 0
        ? `Imported ${importedCount}, Updated ${updatedCount} services (total ${pServices.length})`
        : `Import failed: ${errors[0] || 'no services processed'}`,
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined
    });
  });
