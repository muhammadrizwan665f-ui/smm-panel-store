
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  DEFAULT_EXCHANGE_RATE,
  DEFAULT_CUSTOMER_CURRENCY,
  DEFAULT_PRICE_ROUNDING,
} from "../currency.constants";

type ImportInput = {
  providerId: string;
  serviceIds?: string[];
  markupType: "fixed" | "percentage";
  markupAmount: number;
  categoryId?: string;
  createNewCategory?: string;
  parentCategoryId?: string;
  autoCategorize?: boolean;
};

const normalize = (value: unknown) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const hasTerm = (value: string, terms: string[]) =>
  terms.some((term) => {
    const normalizedTerm = normalize(term);
    return (` ${value} `).includes(` ${normalizedTerm} `);
  });

function detectPlatform(text: string): string | null {
  const rules: Array<[string, RegExp]> = [
    ["INSTAGRAM", /\b(instagram|insta|ig)\b/i],
    ["FACEBOOK", /\b(facebook|fb)\b/i],
    ["TIKTOK", /\b(tiktok|tik tok)\b/i],
    ["YOUTUBE", /\b(youtube|you tube|yt)\b/i],
    ["TWITTER", /\b(twitter|retweets?|tweets?|x platform)\b/i],
    ["WEBSITE", /\b(website|web traffic|seo|site traffic)\b/i],
  ];

  const matches = rules.filter(([, regex]) => regex.test(text));
  return matches.length === 1 ? matches[0][0] : null;
}

function detectSubcategory(text: string): string | null {
  const rules: Array<[string, RegExp]> = [
    ["STORY VIEWS", /\b(story|stories)\b.*\b(views?|impressions?)\b|\b(views?|impressions?)\b.*\b(story|stories)\b/i],
    ["REELS VIEWS", /\b(reels?|reel)\b.*\b(views?|plays?)\b|\b(views?|plays?)\b.*\b(reels?|reel)\b/i],
    ["WATCH HOURS", /\b(watch|view)\s*hours?\b|\bhours?\s*watch\b/i],
    ["SUBSCRIBERS", /\b(subscribers?|subs)\b/i],
    ["RETWEETS", /\b(retweets?|reposts?)\b/i],
    ["COMMENTS", /\b(comments?|replies)\b/i],
    ["FOLLOWERS", /\b(followers?|follows)\b/i],
    ["LIKES", /\b(likes?|hearts?|reactions?)\b/i],
    ["SHARES", /\b(shares?|share)\b/i],
    ["SAVES", /\b(saves?|bookmarks?)\b/i],
    ["VIEWS", /\b(views?|plays?|impressions?)\b/i],
    ["SEO", /\b(seo|backlinks?|keywords?|rankings?|domain authority)\b/i],
    ["TRAFFIC", /\b(traffic|visitors?|sessions?)\b/i],
  ];

  const matches = rules.filter(([, regex]) => regex.test(text));
  return matches.length === 1 ? matches[0][0] : null;
}

function findAutoCategory(
  service: any,
  categories: any[],
): string | null {
  const combined = `${service.name ?? ""} ${service.category ?? ""}`;
  const platform = detectPlatform(combined);
  const subcategory = detectSubcategory(combined);

  if (!platform || !subcategory) return null;

  const parent = categories.find(
    (category) =>
      !category.parent_category_id &&
      normalize(category.name) === normalize(platform),
  );

  if (!parent) return null;

  const aliases: Record<string, string[]> = {
    "STORY VIEWS": ["story views"],
    "REELS VIEWS": ["reels views", "reel views"],
    "WATCH HOURS": ["watch hours"],
    SUBSCRIBERS: ["subscribers", "subscriber"],
    RETWEETS: ["retweets", "retweet"],
    COMMENTS: ["comments", "comment"],
    FOLLOWERS: ["followers", "follower"],
    LIKES: ["likes", "like"],
    SHARES: ["shares", "share"],
    SAVES: ["saves", "save", "bookmarks"],
    VIEWS: ["views", "view"],
    SEO: ["seo"],
    TRAFFIC: ["traffic"],
  };

  const acceptedNames = aliases[subcategory] ?? [subcategory.toLowerCase()];

  const child = categories.find(
    (category) =>
      category.parent_category_id === parent.id &&
      acceptedNames.includes(normalize(category.name)),
  );

  return child?.id ?? null;
}

/**
 * Imports provider services into the internal catalog.
 * Auto mode maps services only to confidently identified existing subcategories.
 */
export const importServices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d as ImportInput)
  .handler(async ({ data, context }) => {
    const supabaseAdmin = (context as any)?.supabase;

    const {
      providerId,
      serviceIds,
      markupType,
      markupAmount,
      categoryId,
      createNewCategory,
      parentCategoryId,
      autoCategorize = false,
    } = data;

    if (!supabaseAdmin) throw new Error("Database connection unavailable.");

    const { data: settingsData } = await supabaseAdmin
      .from("site_settings")
      .select("key, value")
      .in("key", [
        "customer_currency",
        "price_rounding",
        "usdt_rate",
        "usdt_to_inr",
      ]);

    const settings: Record<string, string> = {};
    settingsData?.forEach((item: any) => {
      settings[item.key] = item.value || "";
    });

    const usdtExchangeRate =
      parseFloat(
        settings["usdt_to_inr"] ||
          settings["usdt_rate"] ||
          String(DEFAULT_EXCHANGE_RATE),
      ) || DEFAULT_EXCHANGE_RATE;

    const customerCurrency =
      settings["customer_currency"] || DEFAULT_CUSTOMER_CURRENCY;
    const roundingMethod =
      settings["price_rounding"] || DEFAULT_PRICE_ROUNDING;

    const { data: provider, error: providerError } = await supabaseAdmin
      .from("providers")
      .select("currency")
      .eq("id", providerId)
      .single();

    if (providerError || !provider) throw new Error("Provider not found.");

    let query = supabaseAdmin
      .from("provider_services")
      .select("*")
      .eq("provider_id", providerId);

    if (serviceIds?.length) {
      query = query.in("provider_service_id", serviceIds);
    }

    const { data: providerServices, error: servicesError } = await query;

    if (servicesError) throw new Error(servicesError.message);
    if (!providerServices?.length) {
      throw new Error("No provider services found to import.");
    }

    let targetCategoryId = categoryId || undefined;
    let categories: any[] = [];

    if (autoCategorize) {
      const { data: categoryRows, error: categoryError } = await supabaseAdmin
        .from("service_categories")
        .select("id, name, parent_category_id");

      if (categoryError) throw new Error(categoryError.message);
      categories = categoryRows || [];
    } else {
      if (createNewCategory?.trim()) {
        if (!parentCategoryId) {
          return JSON.stringify({
            success: false,
            message: "Please select a parent platform for the new subcategory.",
          });
        }

        const { data: parentPlatform } = await supabaseAdmin
          .from("service_categories")
          .select("id")
          .eq("id", parentCategoryId)
          .is("parent_category_id", null)
          .maybeSingle();

        if (!parentPlatform) {
          return JSON.stringify({
            success: false,
            message: "Invalid parent platform selected.",
          });
        }

        const categoryName = createNewCategory.trim();

        const { data: existingCategory, error: findError } =
          await supabaseAdmin
            .from("service_categories")
            .select("id")
            .eq("name", categoryName)
            .eq("parent_category_id", parentCategoryId)
            .maybeSingle();

        if (findError) throw new Error(findError.message);

        if (existingCategory) {
          targetCategoryId = existingCategory.id;
        } else {
          const { data: newCategory, error: insertError } =
            await supabaseAdmin
              .from("service_categories")
              .insert({
                name: categoryName,
                parent_category_id: parentCategoryId,
                service_type: "api",
                status: "active",
              })
              .select("id")
              .single();

          if (insertError) throw new Error(insertError.message);
          targetCategoryId = newCategory.id;
        }
      } else if (targetCategoryId) {
        const { data: selectedCategory } = await supabaseAdmin
          .from("service_categories")
          .select("id, parent_category_id")
          .eq("id", targetCategoryId)
          .maybeSingle();

        if (!selectedCategory?.parent_category_id) {
          return JSON.stringify({
            success: false,
            message: "Please select a valid platform subcategory.",
          });
        }
      }

      if (!targetCategoryId) {
        return JSON.stringify({
          success: false,
          message: "Please select or create a target subcategory.",
        });
      }
    }

    let importedCount = 0;
    let updatedCount = 0;
    let unmatchedCount = 0;
    const errors: string[] = [];

    for (const ps of providerServices) {
      try {
        const mappedCategoryId = autoCategorize
          ? findAutoCategory(ps, categories)
          : targetCategoryId;

        if (!mappedCategoryId) {
          unmatchedCount++;
          continue;
        }

        const providerRate = Number(ps.provider_cost);
        if (!Number.isFinite(providerRate)) {
          errors.push(`Service ${ps.provider_service_id}: Invalid provider rate.`);
          continue;
        }

        const providerCurrency = provider.currency || "USDT";

        let usdtCost = providerRate;
        if (providerCurrency === "PKR") {
          usdtCost = providerRate / usdtExchangeRate;
        }

        const internalCost = usdtCost * usdtExchangeRate;

        let customerPrice =
          markupType === "percentage"
            ? internalCost * (1 + markupAmount / 100)
            : internalCost + markupAmount;

        if (roundingMethod === "whole") {
          customerPrice = Math.round(customerPrice);
        } else if (roundingMethod === "nearest_5") {
          customerPrice = Math.round(customerPrice / 5) * 5;
        } else if (roundingMethod === "nearest_10") {
          customerPrice = Math.round(customerPrice / 10) * 10;
        } else if (roundingMethod !== "none") {
          customerPrice = Math.round(customerPrice * 100) / 100;
        }

        const providerServiceId = String(ps.provider_service_id);

        const { data: existingService, error: existingError } =
          await supabaseAdmin
            .from("services")
            .select("id")
            .eq("provider_id", providerId)
            .eq("provider_service_id", providerServiceId)
            .maybeSingle();

        if (existingError) throw new Error(existingError.message);

        const servicePayload: Record<string, any> = {
          name: ps.name || `Service ${providerServiceId}`,
          price_per_1000: customerPrice,
          customer_rate: customerPrice,
          min_quantity: ps.provider_min || 1,
          max_quantity: ps.provider_max || 9999999,
          description: ps.description || null,
          provider_id: providerId,
          provider_service_id: providerServiceId,
          provider_type: ps.type || null,
          provider_currency: providerCurrency,
          provider_rate: providerRate,
          usdt_rate_at_calculation: usdtExchangeRate,
          normalized_usdt_cost: usdtCost,
          customer_currency: customerCurrency,
          converted_cost: internalCost,
          profit_type: markupType,
          profit_value: markupAmount,
          customer_price: customerPrice,
          last_synced_at: new Date().toISOString(),
        };

        // Existing services keep their current category and status.
        // New services get the matched category and are activated.
        if (!existingService) {
          servicePayload.category_id = mappedCategoryId;
          servicePayload.status = "active";
        }

        const { error: upsertError } = await supabaseAdmin
          .from("services")
          .upsert(servicePayload, {
            onConflict: "provider_id,provider_service_id",
          });

        if (upsertError) throw new Error(upsertError.message);

        if (existingService) updatedCount++;
        else importedCount++;
      } catch (error: any) {
        errors.push(
          `Service ${ps.provider_service_id}: ${error?.message || "Unknown error"}`,
        );
      }
    }

    const processedCount = importedCount + updatedCount;

    return JSON.stringify({
      success: processedCount > 0,
      importedCount,
      updatedCount,
      unmatchedCount,
      totalProcessed: providerServices.length,
      currency: customerCurrency,
      usdtExchangeRate,
      message: autoCategorize
        ? `Imported ${importedCount}, updated ${updatedCount}, unmatched ${unmatchedCount}.`
        : `Imported ${importedCount}, updated ${updatedCount} services.`,
      errors: errors.length ? errors.slice(0, 10) : undefined,
    });
  });

/**
 * Refresh min/max and provider details without changing category or status.
 */
export const syncServiceLimits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d as { providerId: string })
  .handler(async ({ data, context }) => {
    const supabaseAdmin = (context as any)?.supabase;
    const { providerId } = data;

    const { data: services, error: svcError } = await supabaseAdmin
      .from("services")
      .select("id, provider_service_id")
      .eq("provider_id", providerId);

    if (svcError) throw new Error(svcError.message);

    if (!services?.length) {
      return JSON.stringify({
        success: true,
        updatedCount: 0,
        message: "No imported services for this provider.",
      });
    }

    const { data: providerServices, error: psError } = await supabaseAdmin
      .from("provider_services")
      .select("provider_service_id, provider_min, provider_max, type, provider_cost")
      .eq("provider_id", providerId);

    if (psError) throw new Error(psError.message);

    const byPsid = new Map<string, any>();
    (providerServices || []).forEach((service: any) =>
      byPsid.set(String(service.provider_service_id), service),
    );

    let updatedCount = 0;
    const errors: string[] = [];

    for (const service of services) {
      const match = byPsid.get(String(service.provider_service_id));
      if (!match) continue;

      const { error } = await supabaseAdmin
        .from("services")
        .update({
          min_quantity: match.provider_min || 1,
          max_quantity: match.provider_max || 9999999,
          provider_type: match.type || null,
          provider_rate: match.provider_cost,
          last_synced_at: new Date().toISOString(),
        })
        .eq("id", service.id);

      if (error) errors.push(`${service.id}: ${error.message}`);
      else updatedCount++;
    }

    return JSON.stringify({
      success: true,
      updatedCount,
      totalChecked: services.length,
      message: `Refreshed min/max for ${updatedCount} of ${services.length} imported services.`,
      errors: errors.length ? errors.slice(0, 5) : undefined,
    });
  });
