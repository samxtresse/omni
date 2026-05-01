# Xtressé Omnichannel Dashboard

Unified B2B + DTC analytics dashboard pulling from Windsor.ai → Shopify.
Combines logic from `xtresse-leadershipdash` (B2B) and `xtressedtcdash` (DTC) into a single omnichannel view with channel-comparison charts.

## What's included

**Tier 1 — Top-line performance**
- Revenue by channel (stacked area, monthly)
- Order count by channel (line, monthly)
- AOV by channel (dual-axis line)
- Cumulative YTD revenue (line, resets per year)
- Top 10 SKUs by channel (stacked bar)
- Product family revenue: Gummies / Xvié / Sachets / Starter Pack (grouped bar)

**Tier 2 — Customer dynamics**
- B2B new vs returning accounts (stacked bar)
- DTC new vs returning customers (stacked bar)
- Repeat purchase rate by channel (line)
- DTC subscription vs one-time mix (stacked area)

**Tier 3 — Operational & geographic**
- Revenue by state, top 15, B2B vs DTC (grouped bar)
- Discount code usage by channel (horizontal bar)
- 3PL fulfillment split: Scale3PL vs ShipBob GA vs ShipBob TX (grouped bar)

**Tier 4 — Marketing (scaffolded, awaiting connectors)**
- Blended ROAS placeholder
- CAC by channel placeholder
- Ad spend allocation placeholder
- Activates once Google Ads, Meta, TikTok, Klaviyo are authorized on Windsor.ai

## Architecture

- **Framework**: Next.js 14 (App Router)
- **Charts**: Recharts
- **Styling**: Tailwind CSS
- **Data source**: Windsor.ai → Shopify connector (account `ace1d0-26.myshopify.com`)
- **Channel classification**: Tag-based (matches leadership dash logic)
  - B2B: `b2b` tag, rep name in tags, or REP-/XVIE\d+ discount code pattern
  - DTC: `dtc` tag, or no rep/B2B signal
- **DTC SKU exclusions** are intentionally NOT applied at the data layer here, since this dashboard *compares* both channels (a 60ct gummy bottle sold to DTC IS the DTC channel; same SKU sold via a B2B rep IS B2B)

## Deployment

### Option A: GitHub → Vercel (recommended, matches existing pattern)

1. Create a new GitHub repo: `samxtresse/xtresse-omnichannel`
2. Push these files
3. Import the repo on Vercel under team `team_nutKciUOSpBvDrfG2cSPbSSA`
4. Add environment variable: `WINDSOR_API_KEY` = your Windsor API key
5. Deploy

### Option B: Vercel CLI from your local machine

```bash
cd xtresse-omnichannel
npm install
vercel login
vercel deploy --prod
# When prompted, link to team Xtressé and create new project
# Add WINDSOR_API_KEY in Vercel dashboard after first deploy
```

## Local development

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your WINDSOR_API_KEY
npm run dev
# Open http://localhost:3000
```

## Data layer notes

- Pulls at line-item granularity (one row per SKU per order); de-duplicated to order-level for revenue/order-count metrics, kept at line level for SKU mix.
- `order_total_price > 0` filter excludes test/comp orders.
- Default time window is `last_2years`. Date selector in header lets users switch between last 30d / 3mo / 6mo / YTD / last year / all-time.
- 5-minute API cache (`revalidate: 300`) on the `/api/dashboard` route.

## Constraints

- **DTC backfill pending**: Windsor only has DTC Shopify data from 3/31/26 forward (~30 days). Long-range DTC trends will be sparse until Windsor support extends the historical range.
- **Tier 4 inactive** until ad-platform connectors are authorized on Windsor.ai.

## File structure

```
xtresse-omnichannel/
├── app/
│   ├── api/dashboard/route.js   # Server-side data endpoint
│   ├── layout.js
│   ├── page.js
│   └── globals.css
├── components/
│   ├── Dashboard.jsx            # Main dashboard layout
│   ├── KpiTiles.jsx             # Top KPI strip
│   └── charts/                  # 12 individual chart components
├── lib/
│   ├── windsor.js               # Data fetcher + aggregations
│   ├── classify.js              # B2B/DTC classification logic
│   └── constants.js             # SKU families, 3PL routing, discount patterns
├── .env.example
├── package.json
└── tailwind.config.js
```
