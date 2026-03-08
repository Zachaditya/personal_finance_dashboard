"use client";

import { useState } from "react";
import type {
  Holding,
  AssetClass,
  UserProfile,
  PortfolioPriceHistory,
} from "../lib/types";
import { computeRatioSections } from "../lib/ratios";
import { formatCurrency } from "../lib/formatters";
import { Graph } from "./Graph";
import { IndividualAssets } from "./IndividualAssets";
import { AllocationPieCard, AllocationBreakdownCard } from "./AllocationChart";

const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
  cash: "Cash",
  stocks: "Stocks",
  bonds: "Bonds",
  crypto: "Crypto",
};

const ASSET_CLASS_BADGE: Record<AssetClass, string> = {
  cash: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
  stocks: "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20",
  bonds: "bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20",
  crypto: "bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20",
};

const ASSET_CLASS_DOT: Record<AssetClass, string> = {
  cash: "bg-emerald-400",
  stocks: "bg-blue-400",
  bonds: "bg-violet-400",
  crypto: "bg-orange-400",
};

const ASSET_CLASS_VALUE: Record<AssetClass, string> = {
  cash: "text-emerald-400",
  stocks: "text-blue-400",
  bonds: "text-violet-400",
  crypto: "text-orange-400",
};

function getRatioValueClass(sentiment?: string): string {
  if (sentiment === "positive") return "text-emerald-400";
  if (sentiment === "neutral") return "text-ink-1";
  if (sentiment === "slightly-negative") return "text-yellow-400";
  if (sentiment === "very-negative") return "text-red-400";
  return "text-ink-1";
}

type DashboardProps = {
  profile: UserProfile;
  priceHistory: PortfolioPriceHistory;
};

const CLASS_ORDER: AssetClass[] = ["stocks", "bonds", "cash", "crypto"];

export function Dashboard({ profile, priceHistory }: DashboardProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [showAllAllocation, setShowAllAllocation] = useState(false);

  const { netWorthUSD, portfolio } = profile;
  const { holdings } = portfolio;
  const ratioSections = computeRatioSections(profile, priceHistory);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const classTotals = holdings.reduce<Record<AssetClass, number>>(
    (acc, h) => {
      acc[h.assetClass] = (acc[h.assetClass] ?? 0) + h.valueUSD;
      return acc;
    },
    { cash: 0, stocks: 0, bonds: 0, crypto: 0 }
  );

  const activeClasses = CLASS_ORDER.filter((ac) => classTotals[ac] > 0);

  return (
    <div className="min-h-screen bg-navy-950 font-sans">
      <main className="mx-auto max-w-6xl px-6 py-8 space-y-4">

        {/* Hero — two-column */}
        <div className="grid grid-cols-4 gap-4 items-stretch">
          {/* Left: Net Worth */}
          <section className="col-span-3 rounded-2xl border border-[#e5e7eb] bg-white p-7 relative overflow-hidden shadow-sm">
            <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-gold-400/[0.06] blur-3xl" />
            <p className="text-xs font-medium text-ink-3 uppercase tracking-widest mb-3">
              Total Portfolio Value
            </p>
            <p className="font-mono text-5xl font-semibold text-ink-1 tracking-tight leading-none tabular-nums">
              {formatCurrency(netWorthUSD)}
            </p>
            <p className="mt-3 text-sm text-ink-4">As of {profile.asOf}</p>
          </section>

          {/* Right: Asset class breakdown */}
          <section className="col-span-1 rounded-2xl border border-[#e5e7eb] bg-white p-5 flex flex-col justify-center shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-4 mb-4">
              By Asset Class
            </p>
            <div className="space-y-3">
              {activeClasses.length === 0 ? (
                <p className="text-xs text-ink-4">No holdings</p>
              ) : (
                activeClasses.map((ac) => (
                  <div key={ac} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${ASSET_CLASS_DOT[ac]}`} />
                      <span className="text-xs text-ink-3 truncate">
                        {ASSET_CLASS_LABELS[ac]}
                      </span>
                    </div>
                    <span className={`text-xs font-mono font-semibold tabular-nums shrink-0 ${ASSET_CLASS_VALUE[ac]}`}>
                      {formatCurrency(classTotals[ac])}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Portfolio Value Over Time */}
        <section className="rounded-xl bg-white border border-[#e5e7eb] overflow-hidden shadow-sm">
          <Graph priceHistory={priceHistory} />
        </section>

        {/* Allocation row — two columns */}
        <div className="grid grid-cols-2 gap-4 items-stretch">
          <AllocationPieCard
            holdings={holdings}
            totalValueUSD={portfolio.totals.totalValueUSD}
            showAll={showAllAllocation}
            onToggleShowAll={() => setShowAllAllocation((v) => !v)}
          />
          <AllocationBreakdownCard
            holdings={holdings}
            totalValueUSD={portfolio.totals.totalValueUSD}
            showAll={showAllAllocation}
          />
        </div>

        {/* Individual Holdings Over Time */}
        <section className="rounded-xl bg-white border border-[#e5e7eb] overflow-hidden shadow-sm">
          <IndividualAssets
            priceHistory={priceHistory}
            holdings={holdings}
            totalValueUSD={portfolio.totals.totalValueUSD}
          />
        </section>

        {/* Financial Ratios */}
        <section className="rounded-xl bg-white border border-[#e5e7eb] overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-[#e5e7eb]">
            <h2 className="text-xs font-medium text-ink-3 uppercase tracking-wider">
              Financial Ratios
            </h2>
          </div>
          <div className="divide-y divide-[#e5e7eb]">
            {ratioSections.map((section) => {
              const isExpanded = expandedSections[section.id] ?? false;
              return (
                <div key={section.id}>
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-navy-800/50 transition-colors"
                  >
                    <h3 className="text-sm font-semibold text-ink-1">
                      {section.title}
                    </h3>
                    <span
                      className={`text-ink-4 text-xs transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    >
                      ▼
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="px-5 pb-4">
                      <table className="w-full">
                        <tbody className="divide-y divide-[#e5e7eb]">
                          {section.ratios.map(({ label, value, sentiment }) => (
                            <tr key={label}>
                              <td className="py-2.5">
                                <span className="text-sm text-ink-2">{label}</span>
                              </td>
                              <td
                                className={`py-2.5 text-sm font-semibold text-right font-mono tabular-nums ${getRatioValueClass(sentiment)}`}
                              >
                                {value}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Holdings Table */}
        <section className="rounded-xl bg-white border border-[#e5e7eb] overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-[#e5e7eb] flex items-center gap-3">
            <h2 className="text-xs font-medium text-ink-3 uppercase tracking-wider">
              Holdings
            </h2>
            <span className="text-xs text-ink-4 font-medium">
              {holdings.length} assets
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e5e7eb]">
                  <th className="px-5 py-3 text-left text-xs font-medium text-ink-3 uppercase tracking-wider">
                    Asset
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-ink-3 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-ink-3 uppercase tracking-wider">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {holdings.map((holding: Holding) => (
                  <tr
                    key={holding.assetId}
                    className="hover:bg-navy-800/50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-ink-1">
                        {holding.name}
                      </p>
                      {holding.ticker && (
                        <p className="text-xs text-ink-4 mt-0.5">
                          {holding.ticker}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ASSET_CLASS_BADGE[holding.assetClass]}`}
                      >
                        {ASSET_CLASS_LABELS[holding.assetClass]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold font-mono tabular-nums text-ink-1">
                      {formatCurrency(holding.valueUSD)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </main>
    </div>
  );
}
