import { classifyOrder, isSubscription, isFirstOrder, parseOrderTags } from "./classify.js";
import { classifySku, classify3PLFromTags, SKU_FAMILIES } from "./constants.js";

const WINDSOR_BASE = "https://connectors.windsor.ai";
const SHOPIFY_CONNECTOR = "shopify";

/**
 * Fetch raw rows from Windsor.ai Shopify connector.
 *
 * IMPORTANT: We pull at line-item granularity (one row per SKU per order)
 * because we need SKU-level analysis. Order-level metrics are deduplicated
 * via DISTINCT order_id downstream.
 */
async function fetchWindsorRows({ datePreset = "last_2years", dateFrom, dateTo } = {}) {
  const apiKey = process.env.WINDSOR_API_KEY;
  if (!apiKey) throw new Error("WINDSOR_API_KEY env var is not set");

  // Fields needed across all four tiers
  const fields = [
    // Order identity
    "order_id",
    "order_name",
    "order_created_at",
    "order_processed_at",

    // Money
    "order_total_price",
    "order_subtotal_price",
    "order_total_discounts",
    "order_total_tax_amount",
    "order_total_shipping_price",
    "order_gross_sales",
    "order_net_sales",

    // Classification inputs
    "order_tags",
    "order_discount_codes",
    "order_app_name", // sales channel

    // Customer
    "order_customer_id",
    "customer_is_returning",
    "customer_orders_count",
    "customer_total_spent",
    "order_email",

    // Geography
    "order_shipping_address_province",
    "order_shipping_address_country",
    "order_shipping_address_city",

    // Line items (SKU-level)
    "line_item__sku",
    "line_item__name",
    "line_item__quantity",
    "line_item__price",
    "line_item__total_discount",
  ];

  const params = new URLSearchParams({
    api_key: apiKey,
    fields: fields.join(","),
    date_preset: datePreset,
    // CRITICAL: filter dates against createdAt, not Windsor's default field
    date_filters: JSON.stringify({ orders: "createdAt" }),
  });
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);

  const url = `${WINDSOR_BASE}/${SHOPIFY_CONNECTOR}?${params.toString()}`;

  const res = await fetch(url, {
    next: { revalidate: 300 }, // 5-min cache
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Windsor API ${res.status}: ${text.slice(0, 300)}`);
  }

  const json = await res.json();
  const rows = Array.isArray(json) ? json : json.data || [];

  // Filter: drop test orders, drop $0 comps (per leadership dash logic)
  return rows.filter((r) => {
    const total = Number(r.order_total_price || 0);
    return total > 0;
  });
}

/**
 * Enrich each row with channel classification, sku family, 3pl routing.
 */
function enrichRows(rows) {
  return rows.map((r) => {
    const { channel, rep } = classifyOrder(r);
    const tags = parseOrderTags(r.order_tags);
    return {
      ...r,
      _channel: channel,
      _rep: rep,
      _sku_family: classifySku(r.line_item__sku),
      _3pl: classify3PLFromTags(tags, r.order_shipping_address_province),
      _is_subscription: isSubscription(r.order_tags),
      _is_first_order: isFirstOrder(r.order_tags),
      _ts: r.order_created_at ? new Date(r.order_created_at).getTime() : 0,
      _month: monthKey(r.order_created_at),
    };
  });
}

function monthKey(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * De-duplicate to one row per order. Allocates total_price proportionally
 * to line items only when needed (e.g. SKU-mix charts use the line-item rows;
 * order-count charts use deduped rows).
 */
function dedupeOrders(rows) {
  const seen = new Map();
  for (const r of rows) {
    if (!r.order_id) continue;
    if (!seen.has(r.order_id)) seen.set(r.order_id, r);
  }
  return Array.from(seen.values());
}

// =============================================================================
// AGGREGATIONS
// =============================================================================

/**
 * Tier 1: Monthly revenue, order count, AOV by channel.
 */
function aggregateMonthlyByChannel(orders) {
  const map = new Map(); // month → { B2B: {rev,orders,customers}, DTC: {...} }

  for (const o of orders) {
    if (!o._month) continue;
    if (!map.has(o._month)) {
      map.set(o._month, {
        month: o._month,
        B2B_revenue: 0, B2B_orders: 0, B2B_customers: new Set(),
        DTC_revenue: 0, DTC_orders: 0, DTC_customers: new Set(),
      });
    }
    const bucket = map.get(o._month);
    const rev = Number(o.order_total_price || 0);
    const ch = o._channel;
    bucket[`${ch}_revenue`] += rev;
    bucket[`${ch}_orders`] += 1;
    if (o.order_customer_id) bucket[`${ch}_customers`].add(o.order_customer_id);
  }

  return Array.from(map.values())
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((m) => ({
      month: m.month,
      B2B_revenue: round(m.B2B_revenue),
      DTC_revenue: round(m.DTC_revenue),
      B2B_orders: m.B2B_orders,
      DTC_orders: m.DTC_orders,
      B2B_customers: m.B2B_customers.size,
      DTC_customers: m.DTC_customers.size,
      B2B_aov: m.B2B_orders ? round(m.B2B_revenue / m.B2B_orders) : 0,
      DTC_aov: m.DTC_orders ? round(m.DTC_revenue / m.DTC_orders) : 0,
    }));
}

/**
 * Tier 1: Channel mix snapshot (current period totals).
 */
function aggregateChannelMix(orders) {
  let b2b = 0, dtc = 0, b2bOrders = 0, dtcOrders = 0;
  const b2bCust = new Set(), dtcCust = new Set();

  for (const o of orders) {
    const rev = Number(o.order_total_price || 0);
    if (o._channel === "B2B") {
      b2b += rev;
      b2bOrders += 1;
      if (o.order_customer_id) b2bCust.add(o.order_customer_id);
    } else {
      dtc += rev;
      dtcOrders += 1;
      if (o.order_customer_id) dtcCust.add(o.order_customer_id);
    }
  }

  const total = b2b + dtc;
  return {
    B2B: {
      revenue: round(b2b),
      orders: b2bOrders,
      customers: b2bCust.size,
      pct: total ? round((b2b / total) * 100, 1) : 0,
      aov: b2bOrders ? round(b2b / b2bOrders) : 0,
    },
    DTC: {
      revenue: round(dtc),
      orders: dtcOrders,
      customers: dtcCust.size,
      pct: total ? round((dtc / total) * 100, 1) : 0,
      aov: dtcOrders ? round(dtc / dtcOrders) : 0,
    },
    total: round(total),
  };
}

/**
 * Tier 1: Top SKUs by revenue, faceted by channel.
 * Uses LINE-ITEM rows so SKU revenue = line_item__price * quantity.
 */
function aggregateTopSkus(lineItemRows, limit = 10) {
  const map = new Map(); // sku → { name, B2B, DTC }
  for (const r of lineItemRows) {
    const sku = r.line_item__sku;
    if (!sku) continue;
    const lineRev = Number(r.line_item__price || 0) * Number(r.line_item__quantity || 0);
    if (!map.has(sku)) {
      map.set(sku, { sku, name: r.line_item__name || sku, B2B: 0, DTC: 0, total: 0 });
    }
    const e = map.get(sku);
    e[r._channel] += lineRev;
    e.total += lineRev;
  }
  return Array.from(map.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, limit)
    .map((e) => ({ sku: e.sku, name: e.name, B2B: round(e.B2B), DTC: round(e.DTC) }));
}

/**
 * Tier 1: Product family revenue by channel.
 */
function aggregateProductFamilies(lineItemRows) {
  const map = new Map();
  for (const r of lineItemRows) {
    const fam = r._sku_family;
    const lineRev = Number(r.line_item__price || 0) * Number(r.line_item__quantity || 0);
    if (!map.has(fam)) map.set(fam, { family: fam, B2B: 0, DTC: 0 });
    map.get(fam)[r._channel] += lineRev;
  }
  return Array.from(map.values())
    .filter((e) => e.B2B + e.DTC > 0)
    .map((e) => ({ family: e.family, B2B: round(e.B2B), DTC: round(e.DTC) }))
    .sort((a, b) => (b.B2B + b.DTC) - (a.B2B + a.DTC));
}

/**
 * Tier 2: New vs returning customers per month per channel.
 */
function aggregateNewVsReturning(orders) {
  // For each customer, find their first-ever order date, then for each subsequent
  // order in the period, mark as returning.
  const firstSeen = new Map();
  for (const o of orders) {
    if (!o.order_customer_id) continue;
    const ts = o._ts;
    const cur = firstSeen.get(o.order_customer_id);
    if (!cur || ts < cur) firstSeen.set(o.order_customer_id, ts);
  }

  const map = new Map();
  for (const o of orders) {
    if (!o._month || !o.order_customer_id) continue;
    if (!map.has(o._month)) {
      map.set(o._month, {
        month: o._month,
        B2B_new: 0, B2B_returning: 0,
        DTC_new: 0, DTC_returning: 0,
      });
    }
    const bucket = map.get(o._month);
    const isNew = firstSeen.get(o.order_customer_id) === o._ts;
    const key = `${o._channel}_${isNew ? "new" : "returning"}`;
    bucket[key] += 1;
  }

  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Tier 2: Repeat purchase rate by channel by month.
 * RPR = customers with >1 order that month / total customers that month.
 */
function aggregateRepeatRate(orders) {
  const map = new Map(); // month → channel → customer → orderCount
  for (const o of orders) {
    if (!o._month || !o.order_customer_id) continue;
    if (!map.has(o._month)) map.set(o._month, { B2B: new Map(), DTC: new Map() });
    const ch = map.get(o._month)[o._channel];
    ch.set(o.order_customer_id, (ch.get(o.order_customer_id) || 0) + 1);
  }

  return Array.from(map.entries())
    .map(([month, channels]) => {
      const calc = (m) => {
        if (m.size === 0) return 0;
        const repeats = Array.from(m.values()).filter((n) => n > 1).length;
        return round((repeats / m.size) * 100, 1);
      };
      return {
        month,
        B2B_repeat_rate: calc(channels.B2B),
        DTC_repeat_rate: calc(channels.DTC),
      };
    })
    .sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Tier 2: DTC subscription vs one-time orders over time.
 */
function aggregateSubscriptionMix(orders) {
  const map = new Map();
  for (const o of orders) {
    if (o._channel !== "DTC" || !o._month) continue;
    if (!map.has(o._month)) {
      map.set(o._month, { month: o._month, subscription: 0, one_time: 0 });
    }
    const rev = Number(o.order_total_price || 0);
    if (o._is_subscription) map.get(o._month).subscription += rev;
    else map.get(o._month).one_time += rev;
  }
  return Array.from(map.values())
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((m) => ({
      month: m.month,
      subscription: round(m.subscription),
      one_time: round(m.one_time),
    }));
}

/**
 * Tier 3: Revenue by state, B2B vs DTC.
 */
function aggregateByState(orders, limit = 15) {
  const map = new Map();
  for (const o of orders) {
    const state = o.order_shipping_address_province;
    if (!state) continue;
    if (!map.has(state)) map.set(state, { state, B2B: 0, DTC: 0 });
    map.get(state)[o._channel] += Number(o.order_total_price || 0);
  }
  return Array.from(map.values())
    .map((e) => ({ state: e.state, B2B: round(e.B2B), DTC: round(e.DTC) }))
    .sort((a, b) => (b.B2B + b.DTC) - (a.B2B + a.DTC))
    .slice(0, limit);
}

/**
 * Tier 3: Discount code usage by channel.
 */
function aggregateDiscountCodes(orders, limit = 10) {
  const map = new Map();
  for (const o of orders) {
    const codes = String(o.order_discount_codes || "")
      .split(/[,;]/)
      .map((c) => c.trim())
      .filter(Boolean);
    for (const code of codes) {
      if (!map.has(code)) map.set(code, { code, B2B_uses: 0, DTC_uses: 0, B2B_revenue: 0, DTC_revenue: 0 });
      const e = map.get(code);
      e[`${o._channel}_uses`] += 1;
      e[`${o._channel}_revenue`] += Number(o.order_total_price || 0);
    }
  }
  return Array.from(map.values())
    .sort((a, b) => (b.B2B_uses + b.DTC_uses) - (a.B2B_uses + a.DTC_uses))
    .slice(0, limit)
    .map((e) => ({
      code: e.code,
      B2B_uses: e.B2B_uses,
      DTC_uses: e.DTC_uses,
      B2B_revenue: round(e.B2B_revenue),
      DTC_revenue: round(e.DTC_revenue),
    }));
}

/**
 * Tier 3: 3PL fulfillment split by channel.
 */
function aggregate3PL(orders) {
  const map = new Map();
  for (const o of orders) {
    const loc = o._3pl;
    if (!map.has(loc)) map.set(loc, { location: loc, B2B: 0, DTC: 0 });
    map.get(loc)[o._channel] += 1;
  }
  return Array.from(map.values())
    .sort((a, b) => (b.B2B + b.DTC) - (a.B2B + a.DTC));
}

// =============================================================================
// HELPERS
// =============================================================================

function round(n, places = 2) {
  const f = Math.pow(10, places);
  return Math.round((Number(n) || 0) * f) / f;
}

// =============================================================================
// PUBLIC API
// =============================================================================

export async function getDashboardData(opts = {}) {
  const rawRows = await fetchWindsorRows(opts);
  const enrichedLineItems = enrichRows(rawRows);
  const orders = dedupeOrders(enrichedLineItems);

  return {
    asOf: new Date().toISOString(),
    rowCount: rawRows.length,
    orderCount: orders.length,
    tier1: {
      monthlyByChannel: aggregateMonthlyByChannel(orders),
      channelMix: aggregateChannelMix(orders),
      topSkus: aggregateTopSkus(enrichedLineItems, 10),
      productFamilies: aggregateProductFamilies(enrichedLineItems),
    },
    tier2: {
      newVsReturning: aggregateNewVsReturning(orders),
      repeatRate: aggregateRepeatRate(orders),
      subscriptionMix: aggregateSubscriptionMix(orders),
    },
    tier3: {
      byState: aggregateByState(orders, 15),
      discountCodes: aggregateDiscountCodes(orders, 10),
      threePL: aggregate3PL(orders),
    },
    tier4: {
      // Scaffolded - will populate when Google Ads / Meta / TikTok / Klaviyo
      // are authorized on Windsor.ai
      blendedRoas: null,
      cacByChannel: null,
      adSpendAllocation: null,
      _placeholder: true,
      _missingConnectors: ["google_ads", "facebook", "tiktok", "klaviyo"],
    },
  };
}
