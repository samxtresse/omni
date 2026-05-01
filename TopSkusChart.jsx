"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const fmt = (n) => `$${(n / 1000).toFixed(0)}k`;

export default function CumulativeRevenueChart({ data }) {
  // Compute YTD-cumulative within each calendar year
  const cumulative = [];
  const totals = {};
  const lastYear = {};

  for (const row of data) {
    const year = row.month.split("-")[0];
    if (lastYear.B2B !== year) { totals.B2B = 0; lastYear.B2B = year; }
    if (lastYear.DTC !== year) { totals.DTC = 0; lastYear.DTC = year; }
    totals.B2B += row.B2B_revenue;
    totals.DTC += row.DTC_revenue;
    cumulative.push({
      month: row.month,
      B2B_cum: Math.round(totals.B2B),
      DTC_cum: Math.round(totals.DTC),
    });
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={cumulative} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="month" />
        <YAxis tickFormatter={fmt} />
        <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="B2B_cum" name="B2B Cumulative" stroke="#0f766e" strokeWidth={2.5} dot={false} />
        <Line type="monotone" dataKey="DTC_cum" name="DTC Cumulative" stroke="#7c3aed" strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
