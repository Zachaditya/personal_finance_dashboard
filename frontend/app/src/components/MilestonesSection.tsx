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

function computeCompounding(
  initial: number,
  monthlyContrib: number,
  aprPct: number,
  years: number
): { year: number; value: number }[] {
  const r = aprPct / 100 / 12;
  const data: { year: number; value: number }[] = [];
  for (let y = 1; y <= years; y++) {
    const n = y * 12;
    const fv =
      initial * Math.pow(1 + r, n) +
      (r === 0
        ? monthlyContrib * n
        : (monthlyContrib * (Math.pow(1 + r, n) - 1)) / r * (1 + r));
    data.push({ year: y, value: Math.round(fv) });
  }
  return data;
}

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value}`;
}

const TOOLTIP_BG = "#ffffff";
const TOOLTIP_BORDER = "#e5e7eb";
const INK_1 = "#1a1a1a";
const GOLD = "#00b070";

const tooltipStyle = {
  backgroundColor: TOOLTIP_BG,
  border: `1px solid ${TOOLTIP_BORDER}`,
  borderRadius: "10px",
  fontSize: "13px",
  color: INK_1,
  fontFamily: "var(--font-plex-sans)",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
};

type MilestonesSectionProps = {
  netWorth: number;
};

export function MilestonesSection({ netWorth: _netWorth }: MilestonesSectionProps) {
  const [initialAmount, setInitialAmount] = useState(0);
  const [horizon, setHorizon] = useState(20);
  const [monthlyContrib] = useState(100);
  const [apr] = useState(10);

  const chartData = useMemo(
    () => computeCompounding(initialAmount, monthlyContrib, apr, horizon),
    [initialAmount, monthlyContrib, apr, horizon]
  );

  const snap5 = chartData.find((d) => d.year === 5);
  const snap10 = chartData.find((d) => d.year === 10);
  const snapEnd = chartData[chartData.length - 1];

  return (
    <section className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-4 mb-1">
        Compounding Calculator
      </h2>
      <p className="text-xs text-ink-4 mb-5">
        {apr}% APR · +${monthlyContrib}/mo
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
        {/* Initial amount input */}
        <div>
          <label className="block text-xs text-ink-3 mb-1.5">
            What-if invested amount (USD)
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-[#e5e7eb] bg-navy-800 px-4 py-3 focus-within:border-gold-400 focus-within:ring-1 focus-within:ring-gold-400/30">
            <span className="text-ink-4 font-medium text-sm">$</span>
            <input
              type="number"
              min={0}
              value={initialAmount || ""}
              onChange={(e) =>
                setInitialAmount(Math.max(0, Number(e.target.value) || 0))
              }
              placeholder="0"
              className="flex-1 bg-transparent font-mono text-base font-semibold text-ink-1 placeholder-ink-4 focus:outline-none tabular-nums"
            />
          </div>
        </div>

        {/* Snapshot values */}
        <div className="flex items-end gap-4">
          {[
            { label: `${Math.min(5, horizon)}Y`, data: snap5 },
            { label: `${Math.min(10, horizon)}Y`, data: snap10 },
            { label: `${horizon}Y`, data: snapEnd },
          ]
            .filter((s, i, arr) => {
              if (i === 0 && horizon < 5) return false;
              if (i === 1 && horizon < 10) return false;
              return arr.findIndex((x) => x.label === s.label) === i;
            })
            .map(({ label, data }) => (
              <div key={label} className="flex flex-col">
                <span className="text-xs text-ink-4 mb-1">{label}</span>
                <span className="font-mono text-lg font-semibold text-ink-1 tabular-nums">
                  {data ? formatCompact(data.value) : "—"}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Horizon slider */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-ink-3">Horizon</label>
          <span className="font-mono text-xs font-semibold text-gold-400 tabular-nums">
            {horizon} years
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={40}
          value={horizon}
          onChange={(e) => setHorizon(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none bg-navy-700 cursor-pointer accent-gold-400"
          style={{
            background: `linear-gradient(to right, #00b070 ${((horizon - 1) / 39) * 100}%, #e5e7eb ${((horizon - 1) / 39) * 100}%)`,
          }}
        />
        <div className="flex justify-between mt-1 font-mono text-xs text-ink-4">
          <span>1Y</span>
          <span>10Y</span>
          <span>20Y</span>
          <span>30Y</span>
          <span>40Y</span>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="year"
            tick={{ fill: "#6b7280", fontSize: 11, fontFamily: "var(--font-plex-mono)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}Y`}
            interval={Math.max(0, Math.floor(horizon / 6) - 1)}
          />
          <YAxis
            tick={{ fill: "#6b7280", fontSize: 11, fontFamily: "var(--font-plex-mono)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatCompact(v)}
            width={56}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: number) => [formatCompact(value), "Portfolio Value"]}
            labelFormatter={(label) => `Year ${label}`}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={GOLD}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: GOLD, stroke: "none" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </section>
  );
}
