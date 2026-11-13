
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

function findAutoCategory(service: any, categories: any[]): string | null {
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

function applyRounding(price: number, method: string): number {
  if (method === "whole") return Math.round(price);
  if (method === "nearest_5") return Math.round(price / 5) * 5;
  if (method === "nearest_10") return Math.round(price / 10) * 10;
  if (method === "none") return price;
  return Math.round(price * 100) / 100;
}

function getQuantity(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

/**
 * Imports provider services using bulk database operations.
 * Existing service category/status and custom profit are preserved.
 */
export const importServices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d as ImportInput)
  .handler(async ({ data, context }) => {
    const supabaseAdmin = (context as any)?.supabase;

    if (!supabaseAdmin) {
      throw new Error("Database connection unavailable.");
    }

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

    if (
      !providerId ||
      !["fixed", "percentage"].includes(markupType) ||
      !Number.isFinite(Number(markupAmount)) ||
      Number(markupAmount) < 0
    ) {
      throw new Error("Invalid import settings.");
    }

    const { data: settingsData, error: settingsError } = await supabaseAdmin
      .from("site_settings")
      .select("key, value")
      .in("key", [
        "customer_currency",
        "price_rounding",
        "usdt_rate",
        "usdt_to_inr",
      ]);

    if (settingsError) throw new Error(settingsError.message);

    const settings: Record<string, string> = {};
    (settingsData || []).forEach((item: any) => {
      settings[item.key] = item.value || "";
    });

    const usdtExchangeRate =
      parseFloat(
        settings.usdt_to_inr ||
          settings.usdt_rate ||
          String(DEFAULT_EXCHANGE_RATE),
      ) || DEFAULT_EXCHANGE_RATE;

    const customerCurrency =
      settings.customer_currency || DEFAULT_CUSTOMER_CURRENCY;
    const roundingMethod =
      settings.price_rounding || DEFAULT_PRICE_ROUNDING;

    const { data: provider, error: providerError } = await supabaseAdmin
      .from("providers")
      .select("currency")
      .eq("id", providerId)
      .single();

    if (providerError || !provider) {
      throw new Error("Provider not found.");
    }

    let providerQuery = supabaseAdmin
      .from("provider_services")
      .select("*")
      .eq("provider_id", providerId);

    if (serviceIds?.length) {
      providerQuery = providerQuery.in("provider_service_id", serviceIds);
    }

    const { data: providerServices, error: servicesError } =
      await providerQuery;

    if (servicesError) throw new Error(servicesError.message);

    if (!providerServices?.length) {
      throw new Error("No provider services found to import.");
    }

    let targetCategoryId = categoryId || undefined;
    let categories: any[] = [];

    if (autoCategorize) {
      const { data: categoryRows, error: categoryError } =
        await supabaseAdmin
          .from("service_categories")
          .select("id, name, parent_category_id");

      if (categoryError) throw new Error(categoryError.message);
      categories = categoryRows || [];
    } else {
      if (createNewCategory?.trim()) {
        if (!parentCategoryId) {
          return JSON.stringify({
            success: false,
            message:
              "Please select a parent platform for the new subcategory.",
          });
        }

        const { data: parentPlatform, error: parentError } =
          await supabaseAdmin
            .from("service_categories")
            .select("id")
            .eq("id", parentCategoryId)
            .is("parent_category_id", null)
            .maybeSingle();

        if (parentError) throw new Error(parentError.message);

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
        const { data: selectedCategory, error: categoryError } =
          await supabaseAdmin
            .from("service_categories")
            .select("id, parent_category_id")
            .eq("id", targetCategoryId)
            .maybeSingle();

        if (categoryError) throw new Error(categoryError.message);

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

    const matchedCategoryIds = new Set<string>();
    const errors: string[] = [];

    // Resolve category mappings and validate provider rates first.
    const eligibleServices: Array<{
      service: any;
      categoryId: string;
      providerServiceId: string;
    }> = [];

    for (const ps of providerServices) {
      const mappedCategoryId = autoCategorize
        ? findAutoCategory(ps, categories)
        : targetCategoryId;

      if (!mappedCategoryId) {
        unmatchedCount++;
        continue;
      }

      const providerServiceId = String(ps.provider_service_id ?? "");

      if (!providerServiceId) {
        errors.push("A provider service has no service ID.");
        continue;
      }

      if (!Number.isFinite(Number(ps.provider_cost))) {
        errors.push(`Service ${providerServiceId}: Invalid provider rate.`);
        continue;
      }

      matchedCategoryIds.add(mappedCategoryId);

      eligibleServices.push({
        service: ps,
        categoryId: mappedCategoryId,
        providerServiceId,
      });
    }

    if (eligibleServices.length === 0) {
      return JSON.stringify({
        success: false,
        importedCount: 0,
        updatedCount: 0,
        unmatchedCount,
        totalProcessed: providerServices.length,
        matchedCategoryIds: [...matchedCategoryIds],
        totalCategories: categories.filter(
          (category: any) => category.parent_category_id,
        ).length,
        currency: customerCurrency,
        usdtExchangeRate,
        message: "No services matched a valid category.",
        errors: errors.length ? errors.slice(0, 10) : undefined,
      });
    }

    // Fetch existing records in one query instead of one query per service.
    const providerServiceIds = eligibleServices.map(
      (item) => item.providerServiceId,
    );

    const { data: existingRows, error: existingError } = await supabaseAdmin
      .from("services")
      .select(
        "id, provider_service_id, markup_type, markup_amount, profit_type, profit_value",
      )
      .eq("provider_id", providerId)
      .in("provider_service_id", providerServiceIds);

    if (existingError) throw new Error(existingError.message);

    const existingByProviderId = new Map<string, any>();

    (existingRows || []).forEach((row: any) => {
      existingByProviderId.set(String(row.provider_service_id), row);
    });

    const newPayloads: Record<string, any>[] = [];
    const updatePayloads: Record<string, any>[] = [];

    const syncedAt = new Date().toISOString();
    const providerCurrency = provider.currency || "USDT";

    for (const item of eligibleServices) {
      const ps = item.service;
      const existing = existingByProviderId.get(item.providerServiceId);

      const providerRate = Number(ps.provider_cost);

      let usdtCost = providerRate;

      if (providerCurrency === "PKR") {
        usdtCost = providerRate / usdtExchangeRate;
      }

      const internalCost = usdtCost * usdtExchangeRate;

      const effectiveMarkupType = (
        existing?.markup_type ||
        existing?.profit_type ||
        markupType
      ) as "fixed" | "percentage";

      const effectiveMarkupAmount = Number(
        existing?.markup_amount ??
          existing?.profit_value ??
          markupAmount,
      );

      const rawCustomerPrice =
        effectiveMarkupType === "percentage"
          ? internalCost * (1 + effectiveMarkupAmount / 100)
          : internalCost + effectiveMarkupAmount;

      const customerPrice = applyRounding(
        rawCustomerPrice,
        roundingMethod,
      );

      const payload: Record<string, any> = {
        name: ps.name || `Service ${item.providerServiceId}`,
        price_per_1000: customerPrice,
        customer_rate: customerPrice,
        min_quantity: getQuantity(ps.provider_min, 1),
        max_quantity: getQuantity(ps.provider_max, 9999999),
        description: ps.description || null,
        provider_id: providerId,
        provider_service_id: item.providerServiceId,
        provider_type: ps.type || null,
        provider_currency: providerCurrency,
        provider_rate: providerRate,
        usdt_rate_at_calculation: usdtExchangeRate,
        normalized_usdt_cost: usdtCost,
        customer_currency: customerCurrency,
        converted_cost: internalCost,
        markup_type: effectiveMarkupType,
        markup_amount: effectiveMarkupAmount,
        profit_type: effectiveMarkupType,
        profit_value: effectiveMarkupAmount,
        customer_price: customerPrice,
        last_synced_at: syncedAt,
      };

      if (existing) {
        // Do not include category_id or status in existing service updates.
        updatePayloads.push(payload);
      } else {
        payload.category_id = item.categoryId;
        payload.status = "active";
        newPayloads.push(payload);
      }
    }

    // Bulk upsert new services separately so existing category/status
    // fields are never overwritten by missing values.
    if (newPayloads.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from("services")
        .upsert(newPayloads, {
          onConflict: "provider_id,provider_service_id",
        });

      if (insertError) {
        errors.push(`New services import failed: ${insertError.message}`);
      } else {
        importedCount = newPayloads.length;
      }
    }

    if (updatePayloads.length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from("services")
        .upsert(updatePayloads, {
          onConflict: "provider_id,provider_service_id",
        });

      if (updateError) {
        errors.push(`Existing services update failed: ${updateError.message}`);
      } else {
        updatedCount = updatePayloads.length;
      }
    }

    const processedCount = importedCount + updatedCount;

    return JSON.stringify({
      success: processedCount > 0,
      importedCount,
      updatedCount,
      unmatchedCount,
      totalProcessed: providerServices.length,
      matchedCategoryIds: [...matchedCategoryIds],
      totalCategories: categories.filter(
        (category: any) => category.parent_category_id,
      ).length,
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

    if (!supabaseAdmin) {
      throw new Error("Database connection unavailable.");
    }

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
      .select(
        "provider_service_id, provider_min, provider_max, type, provider_cost",
      )
      .eq("provider_id", providerId);

    if (psError) throw new Error(psError.message);

    const byPsid = new Map<string, any>();

    (providerServices || []).forEach((service: any) => {
      byPsid.set(String(service.provider_service_id), service);
    });

    let updatedCount = 0;
    const errors: string[] = [];

    // Keep this operation limited to manageable batches.
    for (let i = 0; i < services.length; i += 50) {
      const batch = services.slice(i, i + 50);

      for (const service of batch) {
        const match = byPsid.get(String(service.provider_service_id));
        if (!match) continue;

        const { error } = await supabaseAdmin
          .from("services")
          .update({
            min_quantity: getQuantity(match.provider_min, 1),
            max_quantity: getQuantity(match.provider_max, 9999999),
            provider_type: match.type || null,
            provider_rate: match.provider_cost,
            last_synced_at: new Date().toISOString(),
          })
          .eq("id", service.id);

        if (error) errors.push(`${service.id}: ${error.message}`);
        else updatedCount++;
      }
    }

    return JSON.stringify({
      success: true,
      updatedCount,
      totalChecked: services.length,
      message: `Refreshed min/max for ${updatedCount} of ${services.length} imported services.`,
      errors: errors.length ? errors.slice(0, 5) : undefined,
    });
  });

export const getDefaultServiceMarkup = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabaseAdmin = (context as any)?.supabase;

    const { data, error } = await supabaseAdmin
      .from("site_settings")
      .select("key, value")
      .in("key", [
        "default_service_markup_type",
        "default_service_markup_amount",
      ]);

    if (error) throw new Error(error.message);

    const settings: Record<string, string> = {};

    (data || []).forEach((item: any) => {
      settings[item.key] = item.value || "";
    });

    return JSON.stringify({
      markupType: settings.default_service_markup_type || "percentage",
      markupAmount: Number(settings.default_service_markup_amount || 20),
    });
  });

export const saveDefaultServiceMarkup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: any) =>
      d as {
        markupType: "percentage" | "fixed";
        markupAmount: number;
      },
  )
  .handler(async ({ data, context }) => {
    const supabaseAdmin = (context as any)?.supabase;

    if (
      !["percentage", "fixed"].includes(data.markupType) ||
      !Number.isFinite(Number(data.markupAmount)) ||
      Number(data.markupAmount) < 0
    ) {
      throw new Error("Invalid markup settings.");
    }

    const { error } = await supabaseAdmin
      .from("site_settings")
      .upsert(
        [
          {
            key: "default_service_markup_type",
            value: data.markupType,
          },
          {
            key: "default_service_markup_amount",
            value: String(data.markupAmount),
          },
        ],
        { onConflict: "key" },
      );

    if (error) throw new Error(error.message);

    return JSON.stringify({ success: true });
  });
