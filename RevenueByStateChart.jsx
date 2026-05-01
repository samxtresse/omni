"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function NewVsReturningChart({ data, channel = "B2B" }) {
  const newKey = `${channel}_new`;
  const retKey = `${channel}_returning`;
  const colorNew = channel === "B2B" ? "#0f766e" : "#7c3aed";
  const colorRet = channel === "B2B" ? "#5eead4" : "#c4b5fd";

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey={newKey} name={`New (${channel})`} stackId="a" fill={colorNew} radius={[0, 0, 0, 0]} />
        <Bar dataKey={retKey} name={`Returning (${channel})`} stackId="a" fill={colorRet} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
