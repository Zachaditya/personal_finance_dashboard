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
import { formatCurrency } from "../lib/formatters";

const PALETTE = [
  "#00b070", // karma green
  "#60a5fa", // blue
  "#a78bfa", // violet
  "#34d399", // emerald
  "#f87171", // red
  "#fb923c", // orange
  "#38bdf8", // sky
  "#4ade80", // green
  "#e879f9", // fuchsia
  "#a8b4cc", // ink-2
];

const TOOLTIP_BG = "#ffffff";
const TOOLTIP_BORDER = "#e5e7eb";
const INK_1 = "#1a1a1a";
const INK_2 = "#4b5563";
const INK_3 = "#6b7280";

const TOOLTIP_STYLE = {
  backgroundColor: TOOLTIP_BG,
  border: `1px solid ${TOOLTIP_BORDER}`,
  borderRadius: "10px",
  fontSize: "13px",
  color: INK_1,
  fontFamily: "var(--font-plex-sans)",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
};
const TOOLTIP_LABEL_STYLE = { color: INK_2, marginBottom: "4px" };
const TOOLTIP_ITEM_STYLE = { color: INK_1 };

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

  const holdingColors = useMemo(
    () =>
      Object.fromEntries(
        holdings.map((h, i) => [h.assetId, PALETTE[i % PALETTE.length]]),
      ) as Record<string, string>,
    [holdings],
  );

  const [visible, setVisible] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(holdings.map((h) => [h.assetId, true])),
  );

  const toggleHolding = (assetId: string) =>
    setVisible((prev) => ({ ...prev, [assetId]: !prev[assetId] }));

  const allOn = holdings.every((h) => visible[h.assetId]);

  const toggleAll = () => {
    const next = !allOn;
    setVisible(Object.fromEntries(holdings.map((h) => [h.assetId, next])));
  };

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

  const cashTotal = useMemo(
    () =>
      holdings
        .filter((h) => h.assetClass === "cash")
        .reduce((s, h) => s + h.valueUSD, 0),
    [holdings],
  );
  const riskyTotal = totalValueUSD - cashTotal;
  const riskyWeights = useMemo(
    () =>
      Object.fromEntries(
        holdings
          .filter((h) => h.assetClass !== "cash")
          .map((h) => [
            h.assetId,
            riskyTotal > 0 ? h.valueUSD / riskyTotal : 0,
          ]),
      ) as Record<string, number>,
    [holdings, riskyTotal],
  );

  const chartData = useMemo(
    () =>
      data.map((p) => {
        const point: Record<string, string | number> = { date: p.date };
        const riskyPortion = p.valueUSD - cashTotal;
        for (const h of holdings) {
          if (h.assetClass === "cash") {
            point[h.assetId] = h.valueUSD;
          } else {
            point[h.assetId] = riskyPortion * (riskyWeights[h.assetId] ?? 0);
          }
        }
        return point;
      }),
    [data, holdings, cashTotal, riskyWeights],
  );

  if (data.length === 0 || holdings.length === 0) {
    return (
      <section className="rounded-xl bg-white p-5 border border-[#e5e7eb] shadow-sm">
        <h2 className="text-xs font-medium text-ink-3 uppercase tracking-wider mb-3">
          Individual Holdings
        </h2>
        <p className="text-sm text-ink-3">No data available.</p>
      </section>
    );
  }

  const visibleIds = holdings
    .filter((h) => visible[h.assetId])
    .map((h) => h.assetId);
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

  const visibleHoldings = holdings.filter((h) => visible[h.assetId]);

  // suppress unused warning
  void weights;

  return (
    <section className="rounded-xl bg-white p-5 border border-[#e5e7eb] shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 mb-4">
        <div>
          <h2 className="text-xs font-medium text-ink-3 uppercase tracking-wider">
            Individual Holdings Over Time
          </h2>
          <p className="text-xs text-ink-4 mt-0.5">
            Estimated by portfolio weight · toggle to compare
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleAll}
            className="text-xs font-medium text-ink-3 hover:text-ink-2 transition-colors whitespace-nowrap"
          >
            {allOn ? "Hide all" : "Show all"}
          </button>
          <span className="text-ink-4 text-xs">|</span>
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
                      ? "bg-navy-800 text-ink-1 ring-1 ring-[#e5e7eb]"
                      : "bg-navy-800/50 text-ink-4 hover:bg-navy-800"
                  }`}
                >
                  <span
                    className="h-2 w-4 rounded-sm shrink-0"
                    style={{
                      backgroundColor: isOn ? color : "rgba(255,255,255,0.10)",
                    }}
                  />
                  {h.ticker ?? h.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis
              dataKey="date"
              ticks={xTicks}
              tickFormatter={formatDateShort}
              tick={{
                fontSize: 11,
                fill: INK_3,
                fontFamily: "var(--font-plex-mono)",
              }}
              axisLine={{ stroke: TOOLTIP_BORDER }}
              tickLine={false}
            />
            <YAxis
              domain={[yMin, yMax]}
              tickFormatter={formatCurrency}
              tick={{
                fontSize: 11,
                fill: INK_3,
                fontFamily: "var(--font-plex-mono)",
              }}
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
                activeDot={{
                  r: 4,
                  fill: holdingColors[h.assetId],
                  strokeWidth: 0,
                }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
