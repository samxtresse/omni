import { B2B_REP_DISCOUNT_PATTERNS, DTC_EXCLUDED_SKUS } from "./constants.js";

/**
 * Parse Shopify order_tags string. Tags arrive as comma-separated strings,
 * sometimes wrapped in stringified Python list literals (per leadership dash patterns).
 */
export function parseOrderTags(rawTags) {
  if (!rawTags) return [];

  let s = String(rawTags).trim();

  // Strip Python-style list wrapper: "['tag1', 'tag2']" → "tag1,tag2"
  if (s.startsWith("[") && s.endsWith("]")) {
    s = s.slice(1, -1);
    s = s.replace(/['"]/g, "");
  }

  return s
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

/**
 * Detect rep name from order_tags. Rep tags are stored as the rep's name
 * (e.g., "Sonia Mace", "Lexi Cavaliere") in order_tags.
 *
 * Returns null if no rep tag detected (=> DTC order).
 */
export function detectRepFromTags(rawTags) {
  const tags = parseOrderTags(rawTags);
  if (!tags.length) return null;

  // Known non-rep tags (all case-insensitive)
  const NON_REP_TAGS = new Set([
    "b2b", "dtc", "first order", "first", "subscription",
    "subscription first order", "active subscriber",
    "wholesale", "sample", "test", "loyalty",
    "gold", "platinum", "diamond",
    "adcs", "national", "microsite",
    "gummy", "xvie", "serum", "sachet", "bundle",
    "newsletter", "ugc", "ugc bag", "shop",
    "medical doctor", "medical spa", "healthcare practitioner",
    "order fulfillment guru", "old customer", "new customer",
    "net terms", "login with shop", "manager", "accounting",
    "scale3pl", "shipbob ga", "shipbob tx", "shipbob",
    "location_shipping",
  ]);

  for (const tag of tags) {
    const lower = tag.toLowerCase();
    if (NON_REP_TAGS.has(lower)) continue;
    if (lower.startsWith("ofg:")) continue; // routing system tags
    if (lower.includes("(")) continue; // multi-location designators e.g. "Nova Vita (XVIE Only)"

    // Person-name pattern: 2-3 words, primarily letters (case-insensitive
    // because some reps are stored lowercase like "michelle spencer")
    if (/^[a-zA-Z][a-zA-Z'.-]+(?:\s+[a-zA-Z][a-zA-Z'.-]+){1,2}$/.test(tag)) {
      // Title-case the name for display
      return tag
        .split(/\s+/)
        .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
    }
  }
  return null;
}

/**
 * Classify a single Shopify order row as B2B or DTC.
 *
 * Priority (per leadership dash convention — rep/b2b tag is the authoritative signal):
 *   1. Explicit 'b2b' tag → B2B
 *   2. Explicit 'dtc' tag → DTC
 *   3. Rep name detected in tags → B2B
 *   4. B2B-pattern discount code (REP-*, XVIE\d+) → B2B
 *   5. Default → DTC
 *
 * Note: SKU-based fallback intentionally NOT used. SKUs like X-GN-060CT-001
 * are sold in BOTH channels (it's the 60ct gummies bottle); they're excluded
 * from leadership B2B-only reports but appear legitimately in DTC orders.
 */
export function classifyOrder(order) {
  const tags = parseOrderTags(order.order_tags);
  const lowerTags = tags.map((t) => t.toLowerCase());

  if (lowerTags.includes("b2b")) {
    return { channel: "B2B", rep: detectRepFromTags(order.order_tags) };
  }

  if (lowerTags.includes("dtc")) {
    return { channel: "DTC", rep: null };
  }

  const rep = detectRepFromTags(order.order_tags);
  if (rep) return { channel: "B2B", rep };

  const codes = String(order.order_discount_codes || "").split(/[,;]/);
  for (const code of codes) {
    const c = code.trim();
    if (!c) continue;
    if (B2B_REP_DISCOUNT_PATTERNS.some((re) => re.test(c))) {
      return { channel: "B2B", rep: null };
    }
  }

  return { channel: "DTC", rep: null };
}

/**
 * Subscription detection (DTC-only).
 */
export function isSubscription(rawTags) {
  const tags = parseOrderTags(rawTags);
  return tags.some((t) => /subscription/i.test(t));
}

/**
 * First-order detection.
 */
export function isFirstOrder(rawTags) {
  const tags = parseOrderTags(rawTags);
  return tags.some((t) => t.toLowerCase() === "first order");
}
