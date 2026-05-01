"use client";

function fmtCurrency(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${Math.round(n).toLocaleString()}`;
}

export default function KpiTiles({ channelMix }) {
  const { B2B, DTC, total } = channelMix;
  const tiles = [
    { label: "Total Revenue", value: fmtCurrency(total), sub: "B2B + DTC", accent: "slate" },
    { label: "B2B Revenue", value: fmtCurrency(B2B.revenue), sub: `${B2B.pct}% mix · ${B2B.orders} orders`, accent: "b2b" },
    { label: "DTC Revenue", value: fmtCurrency(DTC.revenue), sub: `${DTC.pct}% mix · ${DTC.orders} orders`, accent: "dtc" },
    { label: "B2B AOV", value: fmtCurrency(B2B.aov), sub: `${B2B.customers} active accts`, accent: "b2b" },
    { label: "DTC AOV", value: fmtCurrency(DTC.aov), sub: `${DTC.customers} active customers`, accent: "dtc" },
  ];

  const accentClass = {
    slate: "border-slate-200",
    b2b: "border-teal-300 bg-teal-50/30",
    dtc: "border-violet-300 bg-violet-50/30",
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {tiles.map((t) => (
        <div
          key={t.label}
          className={`rounded-xl border ${accentClass[t.accent]} bg-white p-4 shadow-sm`}
        >
          <div className="text-[11px] uppercase tracking-wide text-slate-500 font-medium">{t.label}</div>
          <div className="text-2xl font-semibold text-slate-900 mt-1">{t.value}</div>
          <div className="text-xs text-slate-500 mt-1">{t.sub}</div>
        </div>
      ))}
    </div>
  );
}
