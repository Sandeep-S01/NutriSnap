"use client";

import { Bar } from "recharts";
import { BarChart } from "recharts";
import { CartesianGrid } from "recharts";
import { ResponsiveContainer } from "recharts";
import { Tooltip } from "recharts";
import { XAxis } from "recharts";
import { YAxis } from "recharts";
import type { ChartPoint } from "@/features/dashboard/dashboard-metrics";

export function NutritionChart({ data }: { data: ChartPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
        Charts will appear after meals are saved today.
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "#64748b" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "#64748b" }}
          />
          <Tooltip
            cursor={{ fill: "#f1f5f9" }}
            contentStyle={{
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
            }}
          />
          <Bar dataKey="calories" name="Calories" fill="#059669" radius={[4, 4, 0, 0]} />
          <Bar dataKey="protein" name="Protein (g)" fill="#2563eb" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
