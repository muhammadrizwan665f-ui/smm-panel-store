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
