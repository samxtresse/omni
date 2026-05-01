"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const fmt = (n) => `$${(n / 1000).toFixed(0)}k`;

export default function RevenueByStateChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="state" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={fmt} />
        <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="B2B" name="B2B" fill="#0f766e" radius={[3, 3, 0, 0]} />
        <Bar dataKey="DTC" name="DTC" fill="#7c3aed" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
