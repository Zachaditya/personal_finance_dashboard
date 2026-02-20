"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
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
  const { data, sp500 } = priceHistory;

  // Merge portfolio and S&P 500 by date for chart
  const chartData =
    sp500 && sp500.length > 0
      ? data.map((p) => {
          const sp = sp500.find((s) => s.date === p.date);
          return {
            date: p.date,
            valueUSD: p.valueUSD,
            sp500Value: sp?.valueUSD ?? null,
          };
        })
      : data.map((p) => ({ date: p.date, valueUSD: p.valueUSD, sp500Value: null }));

  if (data.length === 0) {
    return (
      <section className="rounded-xl bg-white p-5 shadow-sm border border-zinc-200">
        <h2 className="text-lg font-semibold text-zinc-900 mb-3">
          Portfolio Value Over Time
        </h2>
        <p className="text-sm text-zinc-500">No price history available.</p>
      </section>
    );
  }

  const portfolioValues = chartData.map((p) => p.valueUSD);
  const sp500Values = chartData
    .map((p) => p.sp500Value)
    .filter((v): v is number => v != null);
  const allValues = [...portfolioValues, ...sp500Values];
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const padding = (max - min) * 0.1 || 1000;
  const yMin = Math.floor((min - padding) / 1000) * 1000;
  const yMax = Math.ceil((max + padding) / 1000) * 1000;

  // Show ~6 evenly spaced x-axis labels
  const tickInterval = Math.max(1, Math.floor(chartData.length / 6));
  const xTicks = chartData
    .filter((_, i) => i % tickInterval === 0)
    .map((p) => p.date);

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm border border-zinc-200">
      <h2 className="text-lg font-semibold text-zinc-900 mb-4">
        Portfolio Value Over Time
      </h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
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
              formatter={(value) =>
                value != null ? formatCurrency(value as number) : "—"
              }
              labelFormatter={(label) => formatDateFull(String(label))}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e4e4e7",
                fontSize: "14px",
              }}
            />
            {(sp500?.length ?? 0) > 0 && (
              <Legend
                wrapperStyle={{ fontSize: "12px" }}
                iconType="line"
                iconSize={10}
              />
            )}
            <Line
              type="monotone"
              dataKey="valueUSD"
              name="Portfolio"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#2563eb" }}
            />
            {sp500 && sp500.length > 0 && (
              <Line
                type="monotone"
                dataKey="sp500Value"
                name="S&P 500"
                stroke="#eab308"
                strokeWidth={2}
                dot={false}
                connectNulls
                activeDot={{ r: 4, fill: "#eab308" }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
