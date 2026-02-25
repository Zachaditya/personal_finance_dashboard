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
  { key: "portfolio" as const, label: "Portfolio", color: "#34d399" },
  { key: "sp500" as const, label: "S&P 500", color: "#60a5fa" },
  { key: "bitcoin" as const, label: "Bitcoin", color: "#f59e0b" },
] as const;

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
      <section className="rounded-xl bg-slate-900 p-5 border border-slate-800 h-full flex flex-col">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Portfolio Value Over Time
        </h2>
        <p className="text-sm text-slate-500">No price history available.</p>
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
  const min =
    allValues.length > 0 ? Math.min(...allValues) : 0;
  const max =
    allValues.length > 0 ? Math.max(...allValues) : 100000;
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
    <section className="rounded-xl bg-slate-900 p-5 border border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
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
                    ? "bg-slate-700 text-slate-100 ring-1 ring-slate-600"
                    : "bg-slate-800/50 text-slate-500 hover:bg-slate-800"
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
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={{ stroke: "#1e293b" }}
              tickLine={false}
            />
            <YAxis
              domain={[yMin, yMax]}
              tickFormatter={(v: number) => formatCurrency(v)}
              tick={{ fontSize: 11, fill: "#64748b" }}
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
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "8px",
                fontSize: "13px",
                color: "#f1f5f9",
              }}
              labelStyle={{ color: "#94a3b8", marginBottom: "4px" }}
              itemStyle={{ color: "#f1f5f9" }}
            />
            {visible.portfolio && (
              <Line
                type="monotone"
                dataKey="valueUSD"
                name="Portfolio"
                stroke="#34d399"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#34d399", strokeWidth: 0 }}
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
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                connectNulls
                activeDot={{ r: 4, fill: "#f59e0b", strokeWidth: 0 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
