"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const fmt = (n) => `$${(n / 1000).toFixed(1)}k`;

export default function TopSkusChart({ data }) {
  // Truncate names for display
  const trimmed = data.map((d) => ({
    ...d,
    label: d.name.length > 28 ? d.name.slice(0, 26) + "…" : d.name,
  }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={trimmed} layout="vertical" margin={{ top: 5, right: 20, left: 130, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
        <XAxis type="number" tickFormatter={fmt} />
        <YAxis dataKey="label" type="category" width={130} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="B2B" name="B2B" stackId="a" fill="#0f766e" />
        <Bar dataKey="DTC" name="DTC" stackId="a" fill="#7c3aed" />
      </BarChart>
    </ResponsiveContainer>
  );
}
