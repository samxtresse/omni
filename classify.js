"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function DiscountCodesChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
        <XAxis type="number" />
        <YAxis dataKey="code" type="category" width={80} tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="B2B_uses" name="B2B Uses" fill="#0f766e" />
        <Bar dataKey="DTC_uses" name="DTC Uses" fill="#7c3aed" />
      </BarChart>
    </ResponsiveContainer>
  );
}
