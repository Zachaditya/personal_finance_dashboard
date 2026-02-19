"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { PortfolioPriceHistory } from "../lib/types";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function formatDateFull(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

type GraphProps = {
  priceHistory: PortfolioPriceHistory;
};

export function Graph({ priceHistory }: GraphProps) {
  const { data } = priceHistory;

  if (data.length === 0) {
    return (
      <section className="mb-10 rounded-xl bg-white p-6 shadow-sm border border-zinc-200">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">
          Portfolio Value Over Time
        </h2>
        <p className="text-sm text-zinc-500">No price history available.</p>
      </section>
    );
  }

  const values = data.map((p) => p.valueUSD);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min) * 0.1 || 1000;
  const yMin = Math.floor((min - padding) / 1000) * 1000;
  const yMax = Math.ceil((max + padding) / 1000) * 1000;

  // Show ~6 evenly spaced x-axis labels
  const tickInterval = Math.max(1, Math.floor(data.length / 6));
  const xTicks = data
    .filter((_, i) => i % tickInterval === 0)
    .map((p) => p.date);

  return (
    <section className="mb-10 rounded-xl bg-white p-6 shadow-sm border border-zinc-200">
      <h2 className="text-lg font-semibold text-zinc-900 mb-4">
        Portfolio Value Over Time
      </h2>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis
              dataKey="date"
              ticks={xTicks}
              tickFormatter={formatDateShort}
              tick={{ fontSize: 12, fill: "#71717a" }}
              axisLine={{ stroke: "#e4e4e7" }}
              tickLine={false}
            />
            <YAxis
              domain={[yMin, yMax]}
              tickFormatter={(v: number) => formatCurrency(v)}
              tick={{ fontSize: 12, fill: "#71717a" }}
              axisLine={false}
              tickLine={false}
              width={90}
            />
            <Tooltip
              formatter={(value) => [formatCurrency(value as number), "Value"]}
              labelFormatter={(label) => formatDateFull(String(label))}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e4e4e7",
                fontSize: "14px",
              }}
            />
            <Line
              type="monotone"
              dataKey="valueUSD"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#2563eb" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
