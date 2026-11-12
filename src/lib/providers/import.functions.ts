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

    // 4. Resolve exact target subcategory
    let targetCategoryId = categoryId || undefined;

    if (createNewCategory?.trim()) {
      const categoryName = createNewCategory.trim();

      if (!parentCategoryId) {
        return JSON.stringify({
          success: false,
          message: "Please select a parent platform for the new subcategory."
        });
      }

      // Verify that selected parent is a top-level platform
      const { data: parentPlatform, error: parentError } = await supabaseAdmin
        .from("service_categories")
        .select("id")
        .eq("id", parentCategoryId)
        .is("parent_category_id", null)
        .maybeSingle();

      if (parentError || !parentPlatform) {
        return JSON.stringify({
          success: false,
          message: "Invalid parent platform selected."
        });
      }

      // Find category only under the selected platform
      const { data: existingCategory, error: findError } = await supabaseAdmin
        .from("service_categories")
        .select("id")
        .eq("name", categoryName)
        .eq("parent_category_id", parentCategoryId)
        .maybeSingle();

      if (findError) {
        return JSON.stringify({
          success: false,
          message: `Category lookup error: ${findError.message}`
        });
      }

      if (existingCategory) {
        targetCategoryId = existingCategory.id;
      } else {
        // Create a new category without changing another platform's category
        const { data: newCategory, error: insertError } = await supabaseAdmin
          .from("service_categories")
          .insert({
            name: categoryName,
            parent_category_id: parentCategoryId,
            service_type: "api",
            status: "active"
          })
          .select("id")
          .single();

        if (insertError) {
          return JSON.stringify({
            success: false,
            message: `Category creation error: ${insertError.message}`
          });
        }

        targetCategoryId = newCategory.id;
      }
    } else if (targetCategoryId) {
      // Verify selected category is a subcategory, not a platform
      const { data: selectedCategory, error: categoryError } = await supabaseAdmin
        .from("service_categories")
        .select("id, parent_category_id")
        .eq("id", targetCategoryId)
        .maybeSingle();

      if (categoryError || !selectedCategory || !selectedCategory.parent_category_id) {
        return JSON.stringify({
          success: false,
          message: "Please select a valid platform subcategory."
        });
      }
    }

    if (!targetCategoryId) {
      return JSON.stringify({
        success: false,
        message: "Please select or create a target subcategory."
      });
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
          usdtCost = providerRate / usdtExchangeRate;
        } else if (providerCurrency === 'USD' || providerCurrency === 'USDT') {
          usdtCost = providerRate;
        } else {
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
          customerPrice = Math.round(customerPrice * 100) / 100;
        }

        // Check if internal service already exists to decide if it's new import or update
        const { data: existingService } = await supabaseAdmin
          .from('services')
          .select('id')
          .eq('provider_id', providerId)
          .eq('provider_service_id', String(ps.provider_service_id))
          .maybeSingle();

        // Create/Update internal service (automatically active upon import)
        const { error: upsertError } = await supabaseAdmin
          .from('services')
          .upsert({
            name: ps.name || `Service ${ps.provider_service_id}`,
            category_id: targetCategoryId || null,
            price_per_1000: customerPrice,
            customer_rate: customerPrice,
            min_quantity: ps.provider_min || 1,
            max_quantity: ps.provider_max || 9999999,
            description: ps.description || null,
            provider_id: providerId,
            provider_service_id: String(ps.provider_service_id),
            provider_type: ps.type || null,
            
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
            
            status: 'active', // Automatically activate imported services
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

/**
 * Refreshes min/max order quantity (and provider cost/type) for services
 * that are ALREADY imported, pulling the latest values from the
 * provider_services cache — without touching status/price/category, so
 * live active services never get silently deactivated just to pick up an
 * updated provider minimum.
 */
export const syncServiceLimits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d as { providerId: string })
  .handler(async ({ data, context }) => {
    const supabaseAdmin = (context as any)?.supabase;
    const { providerId } = data;

    const { data: services, error: svcError } = await supabaseAdmin
      .from('services')
      .select('id, provider_service_id')
      .eq('provider_id', providerId);
    if (svcError) throw new Error(svcError.message);
    if (!services || services.length === 0) {
      return JSON.stringify({ success: true, updatedCount: 0, message: "No imported services for this provider." });
    }

    const { data: providerServices, error: psError } = await supabaseAdmin
      .from('provider_services')
      .select('provider_service_id, provider_min, provider_max, type, provider_cost')
      .eq('provider_id', providerId);
    if (psError) throw new Error(psError.message);

    const byPsid = new Map<string, any>();
    (providerServices || []).forEach((p: any) => byPsid.set(String(p.provider_service_id), p));

    let updatedCount = 0;
    const errors: string[] = [];
    for (const svc of services) {
      const match = byPsid.get(String(svc.provider_service_id));
      if (!match) continue;
      const { error } = await supabaseAdmin
        .from('services')
        .update({
          min_quantity: match.provider_min || 1,
          max_quantity: match.provider_max || 9999999,
          provider_type: match.type || null,
          provider_rate: match.provider_cost,
          last_synced_at: new Date().toISOString(),
        })
        .eq('id', svc.id);
      if (error) errors.push(`${svc.id}: ${error.message}`);
      else updatedCount++;
    }

    return JSON.stringify({
      success: true,
      updatedCount,
      totalChecked: services.length,
      message: `Refreshed min/max for ${updatedCount} of ${services.length} imported services.`,
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
    });
  });
