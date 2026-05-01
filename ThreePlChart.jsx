"use client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const fmt = (n) => `$${(n / 1000).toFixed(1)}k`;

export default function SubscriptionMixChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="month" />
        <YAxis tickFormatter={fmt} />
        <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area type="monotone" dataKey="subscription" name="Subscription" stackId="1" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.4} strokeWidth={2} />
        <Area type="monotone" dataKey="one_time" name="One-time" stackId="1" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.4} strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
