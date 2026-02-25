"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { PortfolioPriceHistory, Holding } from "../lib/types";

// Distinct colors that read well on slate-900
const PALETTE = [
  "#34d399", // emerald
  "#60a5fa", // blue
  "#f59e0b", // amber
  "#a78bfa", // violet
  "#f87171", // red
  "#fb923c", // orange
  "#38bdf8", // sky
  "#4ade80", // green
  "#e879f9", // fuchsia
  "#94a3b8", // slate
];

// Defined outside JSX to avoid double-brace parse issues
const TOOLTIP_STYLE = {
  backgroundColor: "#1e293b",
  border: "1px solid #334155",
  borderRadius: "8px",
  fontSize: "13px",
  color: "#f1f5f9",
};
const TOOLTIP_LABEL_STYLE = { color: "#94a3b8", marginBottom: "4px" };
const TOOLTIP_ITEM_STYLE = { color: "#f1f5f9" };

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

function formatTooltipLabel(label: string): string {
  return formatDateFull(label);
}

function formatTooltipValue(value: unknown): string {
  return typeof value === "number" ? formatCurrency(value) : "—";
}

type IndividualAssetsProps = {
  priceHistory: PortfolioPriceHistory;
  holdings: Holding[];
  totalValueUSD: number;
};

export function IndividualAssets({
  priceHistory,
  holdings,
  totalValueUSD,
}: IndividualAssetsProps) {
  const { data } = priceHistory;

  // Assign a stable color per holding
  const holdingColors = useMemo(
    () =>
      Object.fromEntries(
        holdings.map((h, i) => [h.assetId, PALETTE[i % PALETTE.length]]),
      ) as Record<string, string>,
    [holdings],
  );

  // All holdings visible by default
  const [visible, setVisible] = useState<Record<string, boolean>>(
    () => Object.fromEntries(holdings.map((h) => [h.assetId, true])),
  );

  const toggleHolding = (assetId: string) =>
    setVisible((prev) => ({ ...prev, [assetId]: !prev[assetId] }));

  const allOn = holdings.every((h) => visible[h.assetId]);

  const toggleAll = () => {
    const next = !allOn;
    setVisible(Object.fromEntries(holdings.map((h) => [h.assetId, next])));
  };

  // weight[assetId] = fraction of portfolio that holding represents
  const weights = useMemo(
    () =>
      Object.fromEntries(
        holdings.map((h) => [
          h.assetId,
          totalValueUSD > 0 ? h.valueUSD / totalValueUSD : 0,
        ]),
      ) as Record<string, number>,
    [holdings, totalValueUSD],
  );

  // Each row: { date, [assetId]: portfolioValue * weight, ... }
  // Projects the portfolio's daily returns onto each holding's starting weight,
  // giving an estimated USD value for each asset over time.
  const chartData = useMemo(
    () =>
      data.map((p) => {
        const point: Record<string, string | number> = { date: p.date };
        for (const h of holdings) {
          point[h.assetId] = p.valueUSD * (weights[h.assetId] ?? 0);
        }
        return point;
      }),
    [data, holdings, weights],
  );

  if (data.length === 0 || holdings.length === 0) {
    return (
      <section className="rounded-xl bg-slate-900 p-5 border border-slate-800">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Individual Holdings
        </h2>
        <p className="text-sm text-slate-500">No data available.</p>
      </section>
    );
  }

  // Y-axis domain from currently visible holdings only
  const visibleIds = holdings.filter((h) => visible[h.assetId]).map((h) => h.assetId);
  const visibleValues = chartData.flatMap((p) =>
    visibleIds.map((id) => p[id] as number),
  );
  const min = visibleValues.length > 0 ? Math.min(...visibleValues) : 0;
  const max = visibleValues.length > 0 ? Math.max(...visibleValues) : 100_000;
  const padding = (max - min) * 0.1 || 1_000;
  const yMin = Math.floor((min - padding) / 1_000) * 1_000;
  const yMax = Math.ceil((max + padding) / 1_000) * 1_000;

  const tickInterval = Math.max(1, Math.floor(chartData.length / 6));
  const xTicks = chartData
    .filter((_, i) => i % tickInterval === 0)
    .map((p) => p.date as string);

  // Pre-filter to visible holdings for clean Line rendering
  const visibleHoldings = holdings.filter((h) => visible[h.assetId]);

  return (
    <section className="rounded-xl bg-slate-900 p-5 border border-slate-800">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 mb-4">
        <div>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Individual Holdings Over Time
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Estimated by portfolio weight · toggle to compare
          </p>
        </div>

        {/* Toggle controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleAll}
            className="text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors whitespace-nowrap"
          >
            {allOn ? "Hide all" : "Show all"}
          </button>
          <span className="text-slate-700 text-xs">|</span>
          <div className="flex flex-wrap gap-1.5">
            {holdings.map((h) => {
              const color = holdingColors[h.assetId];
              const isOn = visible[h.assetId];
              return (
                <button
                  key={h.assetId}
                  type="button"
                  onClick={() => toggleHolding(h.assetId)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    isOn
                      ? "bg-slate-700 text-slate-100 ring-1 ring-slate-600"
                      : "bg-slate-800/50 text-slate-500 hover:bg-slate-800"
                  }`}
                >
                  <span
                    className="h-2 w-4 rounded-sm shrink-0"
                    style={{ backgroundColor: isOn ? color : "#334155" }}
                  />
                  {h.ticker ?? h.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis
              dataKey="date"
              ticks={xTicks}
              tickFormatter={formatDateShort}
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={{ stroke: "#1e293b" }}
              tickLine={false}
            />
            <YAxis
              domain={[yMin, yMax]}
              tickFormatter={formatCurrency}
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              width={90}
            />
            <Tooltip
              formatter={formatTooltipValue}
              labelFormatter={formatTooltipLabel}
              contentStyle={TOOLTIP_STYLE}
              labelStyle={TOOLTIP_LABEL_STYLE}
              itemStyle={TOOLTIP_ITEM_STYLE}
            />
            {visibleHoldings.map((h) => (
              <Line
                key={h.assetId}
                type="monotone"
                dataKey={h.assetId}
                stroke={holdingColors[h.assetId]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: holdingColors[h.assetId], strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
