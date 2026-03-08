"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { PortfolioPriceHistory } from "../lib/types";

const LINES = [
  { key: "portfolio" as const, label: "Portfolio", color: "#00b070" },
  { key: "sp500" as const, label: "S&P 500", color: "#60a5fa" },
  { key: "bitcoin" as const, label: "Bitcoin", color: "#c084fc" },
] as const;

// Light theme chart internals
const TOOLTIP_BG = "#ffffff";
const TOOLTIP_BORDER = "#e5e7eb";
const INK_1 = "#1a1a1a";
const INK_2 = "#4b5563";
const INK_3 = "#6b7280";

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
  const { data, sp500, bitcoin } = priceHistory;
  const [visible, setVisible] = useState({
    portfolio: true,
    sp500: true,
    bitcoin: true,
  });

  const toggleLine = (key: (typeof LINES)[number]["key"]) => {
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const hasSp500 = (sp500?.length ?? 0) > 0;
  const hasBitcoin = (bitcoin?.length ?? 0) > 0;

  const chartData = data.map((p) => {
    const sp = sp500?.find((s) => s.date === p.date);
    const btc = bitcoin?.find((b) => b.date === p.date);
    return {
      date: p.date,
      valueUSD: p.valueUSD,
      sp500Value: sp?.valueUSD ?? null,
      bitcoinValue: btc?.valueUSD ?? null,
    };
  });

  if (data.length === 0) {
    return (
      <section className="rounded-xl bg-white p-5 border border-[#e5e7eb] h-full flex flex-col shadow-sm">
        <h2 className="text-xs font-medium text-ink-3 uppercase tracking-wider mb-3">
          Portfolio Value Over Time
        </h2>
        <p className="text-sm text-ink-3">No price history available.</p>
      </section>
    );
  }

  const portfolioValues = visible.portfolio ? chartData.map((p) => p.valueUSD) : [];
  const sp500Values =
    visible.sp500 && hasSp500
      ? chartData.map((p) => p.sp500Value).filter((v): v is number => v != null)
      : [];
  const bitcoinValues =
    visible.bitcoin && hasBitcoin
      ? chartData.map((p) => p.bitcoinValue).filter((v): v is number => v != null)
      : [];
  const allValues = [...portfolioValues, ...sp500Values, ...bitcoinValues];
  const min = allValues.length > 0 ? Math.min(...allValues) : 0;
  const max = allValues.length > 0 ? Math.max(...allValues) : 100000;
  const padding = (max - min) * 0.1 || 1000;
  const yMin = Math.floor((min - padding) / 1000) * 1000;
  const yMax = Math.ceil((max + padding) / 1000) * 1000;

  const tickInterval = Math.max(1, Math.floor(chartData.length / 6));
  const xTicks = chartData
    .filter((_, i) => i % tickInterval === 0)
    .map((p) => p.date);

  const lineConfigs = [
    { key: "portfolio" as const, show: true, hasData: true },
    { key: "sp500" as const, show: hasSp500, hasData: hasSp500 },
    { key: "bitcoin" as const, show: hasBitcoin, hasData: hasBitcoin },
  ].filter((c) => c.hasData);

  return (
    <section className="rounded-xl bg-white p-5 border border-[#e5e7eb] shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-xs font-medium text-ink-3 uppercase tracking-wider">
          Portfolio Value Over Time
        </h2>
        <div className="flex flex-wrap gap-2">
          {lineConfigs.map(({ key }) => {
            const config = LINES.find((l) => l.key === key)!;
            const isOn = visible[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleLine(key)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  isOn
                    ? "bg-navy-800 text-ink-1 ring-1 ring-[#e5e7eb]"
                    : "bg-navy-800/50 text-ink-4 hover:bg-navy-800"
                }`}
              >
                <span
                  className="h-2 w-4 rounded-sm shrink-0"
                  style={{ backgroundColor: config.color }}
                />
                {config.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis
              dataKey="date"
              ticks={xTicks}
              tickFormatter={formatDateShort}
              tick={{ fontSize: 11, fill: INK_3, fontFamily: "var(--font-plex-mono)" }}
              axisLine={{ stroke: TOOLTIP_BORDER }}
              tickLine={false}
            />
            <YAxis
              domain={[yMin, yMax]}
              tickFormatter={(v: number) => formatCurrency(v)}
              tick={{ fontSize: 11, fill: INK_3, fontFamily: "var(--font-plex-mono)" }}
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
                backgroundColor: TOOLTIP_BG,
                border: `1px solid ${TOOLTIP_BORDER}`,
                borderRadius: "10px",
                fontSize: "13px",
                color: INK_1,
                fontFamily: "var(--font-plex-sans)",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              labelStyle={{ color: INK_2, marginBottom: "4px" }}
              itemStyle={{ color: INK_1 }}
            />
            {visible.portfolio && (
              <Line
                type="monotone"
                dataKey="valueUSD"
                name="Portfolio"
                stroke="#00b070"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#00b070", strokeWidth: 0 }}
              />
            )}
            {visible.sp500 && sp500 && sp500.length > 0 && (
              <Line
                type="monotone"
                dataKey="sp500Value"
                name="S&P 500"
                stroke="#60a5fa"
                strokeWidth={2}
                dot={false}
                connectNulls
                activeDot={{ r: 4, fill: "#60a5fa", strokeWidth: 0 }}
              />
            )}
            {visible.bitcoin && bitcoin && bitcoin.length > 0 && (
              <Line
                type="monotone"
                dataKey="bitcoinValue"
                name="Bitcoin"
                stroke="#c084fc"
                strokeWidth={2}
                dot={false}
                connectNulls
                activeDot={{ r: 4, fill: "#c084fc", strokeWidth: 0 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
