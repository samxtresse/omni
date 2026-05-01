"use client";
import { useEffect, useState } from "react";
import KpiTiles from "./KpiTiles.jsx";
import ChartCard from "./charts/ChartCard.jsx";
import RevenueByChannelChart from "./charts/RevenueByChannelChart.jsx";
import OrdersByChannelChart from "./charts/OrdersByChannelChart.jsx";
import AovByChannelChart from "./charts/AovByChannelChart.jsx";
import CumulativeRevenueChart from "./charts/CumulativeRevenueChart.jsx";
import TopSkusChart from "./charts/TopSkusChart.jsx";
import ProductFamilyChart from "./charts/ProductFamilyChart.jsx";
import NewVsReturningChart from "./charts/NewVsReturningChart.jsx";
import RepeatRateChart from "./charts/RepeatRateChart.jsx";
import SubscriptionMixChart from "./charts/SubscriptionMixChart.jsx";
import RevenueByStateChart from "./charts/RevenueByStateChart.jsx";
import DiscountCodesChart from "./charts/DiscountCodesChart.jsx";
import ThreePlChart from "./charts/ThreePlChart.jsx";

const PRESETS = [
  { id: "last_30dT", label: "Last 30d" },
  { id: "last_3m", label: "Last 3mo" },
  { id: "last_6m", label: "Last 6mo" },
  { id: "this_yearT", label: "YTD" },
  { id: "last_year", label: "Last year" },
  { id: "last_2years", label: "All time" },
];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [preset, setPreset] = useState("last_2years");

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/dashboard?preset=${preset}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [preset]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Xtressé Omnichannel</h1>
            <p className="text-xs text-slate-500 mt-0.5">B2B + DTC unified view · powered by Windsor.ai → Shopify</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value)}
              className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 bg-white"
            >
              {PRESETS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
            <strong>Error loading data:</strong> {error}
          </div>
        )}

        {loading && !data && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
            Loading omnichannel data from Windsor.ai…
          </div>
        )}

        {data && (
          <>
            <KpiTiles channelMix={data.tier1.channelMix} />

            {/* TIER 1 - Top-line performance */}
            <Section title="Top-line performance" subtitle="Revenue, orders, AOV trends across channels">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard title="Revenue by channel" subtitle="Monthly, stacked area">
                  <RevenueByChannelChart data={data.tier1.monthlyByChannel} />
                </ChartCard>
                <ChartCard title="Order count by channel" subtitle="Monthly trend">
                  <OrdersByChannelChart data={data.tier1.monthlyByChannel} />
                </ChartCard>
                <ChartCard title="Average Order Value" subtitle="Dual-axis: B2B (left) vs DTC (right)">
                  <AovByChannelChart data={data.tier1.monthlyByChannel} />
                </ChartCard>
                <ChartCard title="Cumulative YTD revenue" subtitle="Resets each calendar year">
                  <CumulativeRevenueChart data={data.tier1.monthlyByChannel} />
                </ChartCard>
              </div>
            </Section>

            {/* TIER 1 (cont) - Channel mix */}
            <Section title="Channel & product mix" subtitle="What's selling, where">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard title="Top 10 SKUs by revenue" subtitle="Stacked B2B + DTC" height={400}>
                  <TopSkusChart data={data.tier1.topSkus} />
                </ChartCard>
                <ChartCard title="Product family revenue" subtitle="Gummies / Xvié / Sachets / Starter Pack">
                  <ProductFamilyChart data={data.tier1.productFamilies} />
                </ChartCard>
              </div>
            </Section>

            {/* TIER 2 - Customer dynamics */}
            <Section title="Customer dynamics" subtitle="Acquisition, retention, subscription mix">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard title="B2B: New vs returning accounts" subtitle="Stacked, monthly">
                  <NewVsReturningChart data={data.tier2.newVsReturning} channel="B2B" />
                </ChartCard>
                <ChartCard title="DTC: New vs returning customers" subtitle="Stacked, monthly">
                  <NewVsReturningChart data={data.tier2.newVsReturning} channel="DTC" />
                </ChartCard>
                <ChartCard title="Repeat purchase rate" subtitle="% of customers ordering 2+ times in a month">
                  <RepeatRateChart data={data.tier2.repeatRate} />
                </ChartCard>
                <ChartCard title="DTC: Subscription vs one-time" subtitle="Revenue mix, stacked area">
                  <SubscriptionMixChart data={data.tier2.subscriptionMix} />
                </ChartCard>
              </div>
            </Section>

            {/* TIER 3 - Operational */}
            <Section title="Operational & geographic" subtitle="Where revenue lands, how it ships">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard title="Revenue by state (top 15)" subtitle="B2B vs DTC grouped" height={380}>
                  <RevenueByStateChart data={data.tier3.byState} />
                </ChartCard>
                <ChartCard title="Discount codes (top 10)" subtitle="Usage count by channel" height={380}>
                  <DiscountCodesChart data={data.tier3.discountCodes} />
                </ChartCard>
                <ChartCard title="3PL fulfillment split" subtitle="Order count by location">
                  <ThreePlChart data={data.tier3.threePL} />
                </ChartCard>
                <SummaryCard data={data} />
              </div>
            </Section>

            {/* TIER 4 - Marketing (scaffolded) */}
            <Section
              title="Marketing & ROAS"
              subtitle="Will populate when ad connectors are authorized on Windsor.ai"
              badge="Pending connections"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <PlaceholderCard title="Blended ROAS" subtitle="Total revenue / total ad spend across channels" />
                <PlaceholderCard title="CAC by channel" subtitle="Customer acquisition cost: B2B vs DTC" />
                <PlaceholderCard title="Ad spend allocation" subtitle="Google / Meta / TikTok / Klaviyo split" />
              </div>
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900">
                <strong>To unlock Tier 4:</strong> authorize Google Ads, Meta, TikTok, and Klaviyo on
                Windsor.ai. Connectors needed: <code>{data.tier4._missingConnectors.join(", ")}</code>
              </div>
            </Section>

            <footer className="text-xs text-slate-400 pt-4 pb-8">
              Data as of {new Date(data.asOf).toLocaleString()} · {data.orderCount.toLocaleString()} orders, {data.rowCount.toLocaleString()} line items
            </footer>
          </>
        )}
      </main>
    </div>
  );
}

function Section({ title, subtitle, badge, children }) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-3 mt-2">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {badge && (
          <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-amber-100 text-amber-800 uppercase tracking-wide">
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function PlaceholderCard({ title, subtitle }) {
  return (
    <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-6 flex flex-col items-center justify-center text-center min-h-[180px]">
      <div className="text-sm font-semibold text-slate-700">{title}</div>
      <div className="text-xs text-slate-500 mt-1">{subtitle}</div>
      <div className="text-[10px] text-slate-400 mt-3 uppercase tracking-wide">Awaiting data</div>
    </div>
  );
}

function SummaryCard({ data }) {
  const { channelMix } = data.tier1;
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-slate-900 mb-3">Period summary</h3>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-slate-500">Total revenue</dt>
          <dd className="font-medium">${channelMix.total.toLocaleString()}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">B2B share</dt>
          <dd className="font-medium text-teal-700">{channelMix.B2B.pct}%</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">DTC share</dt>
          <dd className="font-medium text-violet-700">{channelMix.DTC.pct}%</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Total orders</dt>
          <dd className="font-medium">{(channelMix.B2B.orders + channelMix.DTC.orders).toLocaleString()}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Unique customers</dt>
          <dd className="font-medium">{(channelMix.B2B.customers + channelMix.DTC.customers).toLocaleString()}</dd>
        </div>
        <div className="pt-3 mt-3 border-t border-slate-100 text-xs text-slate-500">
          DTC backfill pending — only ~30 days of DTC history available until Windsor support extends the range.
        </div>
      </dl>
    </div>
  );
}
