"use client";
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const fmt = (n) => `$${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}k`;

export default function RevenueByChannelChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="b2bFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0f766e" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#0f766e" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="dtcFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="month" />
        <YAxis tickFormatter={fmt} />
        <Tooltip
          formatter={(v) => `$${Number(v).toLocaleString()}`}
          contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area type="monotone" dataKey="B2B_revenue" name="B2B Revenue" stroke="#0f766e" fill="url(#b2bFill)" strokeWidth={2} />
        <Area type="monotone" dataKey="DTC_revenue" name="DTC Revenue" stroke="#7c3aed" fill="url(#dtcFill)" strokeWidth={2} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
