"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

export function UsageChart({ data }: { data: { day: string; count: number }[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No questions asked yet — activity will show up here.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data}>
        <XAxis dataKey="day" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis allowDecimals={false} fontSize={12} tickLine={false} axisLine={false} width={24} />
        <Tooltip />
        <Bar dataKey="count" fill="#000000" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}