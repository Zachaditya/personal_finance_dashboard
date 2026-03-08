"use client";

import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { Holding, AssetClass } from "../lib/types";

const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
  cash: "Currencies",
  stocks: "Equities",
  bonds: "Fixed income",
  crypto: "Crypto",
};

const CATEGORY_COLORS: Record<AssetClass, string> = {
  stocks: "#3b82f6",
  bonds: "#8b5cf6",
  cash: "#22c55e",
  crypto: "#f59e0b",
};

const EQUITY_COLORS = ["#1e40af", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"];
const BOND_COLORS = ["#6d28d9", "#7c3aed", "#8b5cf6", "#a78bfa"];
const CASH_COLORS = ["#15803d", "#22c55e", "#4ade80"];
const CRYPTO_COLORS = ["#b45309", "#d97706", "#f59e0b", "#fbbf24"];

function getCategoryColors(assetClass: AssetClass): string[] {
  switch (assetClass) {
    case "stocks": return EQUITY_COLORS;
    case "bonds": return BOND_COLORS;
    case "cash": return CASH_COLORS;
    case "crypto": return CRYPTO_COLORS;
  }
}

const TOOLTIP_BG = "#ffffff";
const TOOLTIP_BORDER = "#e5e7eb";
const INK_1 = "#1a1a1a";

const tooltipStyle = {
  backgroundColor: TOOLTIP_BG,
  border: `1px solid ${TOOLTIP_BORDER}`,
  borderRadius: "10px",
  fontSize: "13px",
  color: INK_1,
  fontFamily: "var(--font-plex-sans)",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
};

type ChartSegment = {
  id: string;
  name: string;
  value: number;
  pct: number;
  color: string;
  assetClass: AssetClass;
};

function useAllocationSegments(holdings: Holding[], totalValueUSD: number) {
  return useMemo(() => {
    if (totalValueUSD <= 0 || holdings.length === 0) {
      return {
        segments: [] as ChartSegment[],
        categorySegments: [] as ChartSegment[],
      };
    }

    const byCategory = {} as Record<AssetClass, ChartSegment[]>;
    const order: AssetClass[] = ["stocks", "bonds", "cash", "crypto"];
    for (const ac of order) byCategory[ac] = [];

    const sorted = [...holdings].sort((a, b) => b.valueUSD - a.valueUSD);

    for (const h of sorted) {
      const pct = (h.valueUSD / totalValueUSD) * 100;
      const colors = getCategoryColors(h.assetClass);
      const idx = byCategory[h.assetClass].length;
      const color = colors[idx % colors.length];
      byCategory[h.assetClass].push({
        id: h.assetId,
        name: h.ticker ?? h.name,
        value: h.valueUSD,
        pct,
        color,
        assetClass: h.assetClass,
      });
    }

    const segments = sorted.map((h) => {
      const colors = getCategoryColors(h.assetClass);
      const arr = byCategory[h.assetClass];
      const idx = arr.findIndex((s) => s.id === h.assetId);
      const color = colors[idx % colors.length];
      return {
        id: h.assetId,
        name: h.ticker ?? h.name,
        value: h.valueUSD,
        pct: (h.valueUSD / totalValueUSD) * 100,
        color,
        assetClass: h.assetClass,
      };
    });

    const categorySegments: ChartSegment[] = [];
    for (const ac of order) {
      const items = byCategory[ac] ?? [];
      if (items.length === 0) continue;
      const total = items.reduce((s, i) => s + i.value, 0);
      categorySegments.push({
        id: ac,
        name: ASSET_CLASS_LABELS[ac],
        value: total,
        pct: (total / totalValueUSD) * 100,
        color: CATEGORY_COLORS[ac],
        assetClass: ac,
      });
    }

    return { segments, categorySegments };
  }, [holdings, totalValueUSD]);
}

// Legacy combined component — used by health/page.tsx
type AllocationChartProps = {
  holdings: Holding[];
  totalValueUSD: number;
  className?: string;
};

export function AllocationChart({ holdings, totalValueUSD, className }: AllocationChartProps) {
  const [showAll, setShowAll] = useState(false);
  return (
    <div className={["flex gap-4", className].filter(Boolean).join(" ")}>
      <AllocationPieCard
        holdings={holdings}
        totalValueUSD={totalValueUSD}
        showAll={showAll}
        onToggleShowAll={() => setShowAll((v) => !v)}
        className="flex-1"
      />
      <AllocationBreakdownCard
        holdings={holdings}
        totalValueUSD={totalValueUSD}
        showAll={showAll}
        className="flex-1"
      />
    </div>
  );
}

type PieCardProps = {
  holdings: Holding[];
  totalValueUSD: number;
  showAll: boolean;
  onToggleShowAll: () => void;
  className?: string;
};

export function AllocationPieCard({
  holdings,
  totalValueUSD,
  showAll,
  onToggleShowAll,
  className,
}: PieCardProps) {
  const { segments, categorySegments } = useAllocationSegments(holdings, totalValueUSD);
  const displaySegments = showAll ? segments : categorySegments;

  if (holdings.length === 0 || totalValueUSD <= 0) {
    return (
      <section
        className={[
          "rounded-xl border border-[#e5e7eb] bg-white p-4 flex flex-col shadow-sm",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <h2 className="text-xs font-medium text-ink-3 uppercase tracking-wider mb-4">
          Allocation Overview
        </h2>
        <p className="text-sm text-ink-3">No holdings to display.</p>
      </section>
    );
  }

  return (
    <section
      className={[
        "rounded-xl border border-[#e5e7eb] bg-white p-4 flex flex-col shadow-sm",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 className="text-xs font-medium text-ink-3 uppercase tracking-wider">
            Allocation Overview
          </h2>
          <p className="text-xs text-ink-4 mt-0.5">Across all holdings</p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-xs text-ink-3">Show all</span>
          <button
            type="button"
            role="switch"
            aria-checked={showAll}
            onClick={onToggleShowAll}
            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
              showAll ? "bg-gold-500" : "bg-navy-600"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform mt-0.5 ${
                showAll ? "translate-x-4 ml-0.5" : "translate-x-0.5"
              }`}
            />
          </button>
        </label>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={displaySegments}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={1}
            >
              {displaySegments.map((entry) => (
                <Cell key={entry.id} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(
                value: number,
                name: string,
                props: { payload?: ChartSegment }
              ) => [
                `${props.payload?.pct.toFixed(1)}% · $${value.toLocaleString("en-US", {
                  maximumFractionDigits: 0,
                })}`,
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

type BreakdownCardProps = {
  holdings: Holding[];
  totalValueUSD: number;
  showAll: boolean;
  className?: string;
};

export function AllocationBreakdownCard({
  holdings,
  totalValueUSD,
  showAll,
  className,
}: BreakdownCardProps) {
  const { segments, categorySegments } = useAllocationSegments(holdings, totalValueUSD);
  const items = showAll ? segments : categorySegments;

  if (holdings.length === 0 || totalValueUSD <= 0) {
    return (
      <section
        className={[
          "rounded-xl border border-[#e5e7eb] bg-white p-6 flex flex-col shadow-sm",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <h2 className="text-xs font-medium text-ink-3 uppercase tracking-wider mb-4">
          Breakdown
        </h2>
        <p className="text-sm text-ink-3">No holdings to display.</p>
      </section>
    );
  }

  return (
    <section
      className={[
        "rounded-xl border border-[#e5e7eb] bg-white p-5 flex flex-col shadow-sm",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <h2 className="text-xs font-medium text-ink-3 uppercase tracking-wider mb-4">
        Breakdown
      </h2>

      <div
        className={`rounded-lg border border-[#e5e7eb] flex-1 min-h-0 ${
          showAll ? "overflow-y-auto max-h-[220px]" : "overflow-hidden"
        }`}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e5e7eb] bg-navy-800/80">
              <th className="px-3 py-2 text-left text-xs font-medium text-ink-3 uppercase tracking-wider">
                Asset
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-ink-3 uppercase tracking-wider">
                Value
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-ink-3 uppercase tracking-wider">
                %
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className="border-b border-[#e5e7eb] last:border-b-0"
              >
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-sm"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-ink-2 truncate max-w-[160px]">
                      {item.name}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right font-medium font-mono tabular-nums text-ink-1">
                  ${item.value.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </td>
                <td className="px-3 py-2.5 text-right font-medium font-mono tabular-nums text-ink-1">
                  {item.pct.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
