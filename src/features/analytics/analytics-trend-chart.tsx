"use client";

import { CartesianGrid } from "recharts";
import { Legend } from "recharts";
import { Line } from "recharts";
import { LineChart } from "recharts";
import { ResponsiveContainer } from "recharts";
import { Tooltip } from "recharts";
import { XAxis } from "recharts";
import { YAxis } from "recharts";
import type { AnalyticsTrendPoint } from "@/features/analytics/analytics-metrics";

type AnalyticsTrendChartProps = {
  data: AnalyticsTrendPoint[];
  emptyMessage: string;
};

export function AnalyticsTrendChart({
  data,
  emptyMessage,
}: AnalyticsTrendChartProps) {
  const hasData = data.some((point) => point.calories > 0 || point.protein > 0);

  if (!hasData) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            interval="preserveStartEnd"
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
            contentStyle={{
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="calories"
            name="Calories"
            stroke="#059669"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="protein"
            name="Protein (g)"
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
