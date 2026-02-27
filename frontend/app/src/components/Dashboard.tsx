"use client";

import { useState } from "react";
import type {
  Holding,
  AssetClass,
  UserProfile,
  PortfolioPriceHistory,
} from "../lib/types";
import { computeRatioSections } from "../lib/ratios";
import { Graph } from "./Graph";
import { IndividualAssets } from "./IndividualAssets";

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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getRatioValueClass(sentiment?: string): string {
  if (sentiment === "positive") return "text-emerald-400";
  if (sentiment === "neutral") return "text-slate-200";
  if (sentiment === "slightly-negative") return "text-yellow-400";
  if (sentiment === "very-negative") return "text-red-400";
  return "text-slate-200";
}

type DashboardProps = {
  profile: UserProfile;
  priceHistory: PortfolioPriceHistory;
};

export function Dashboard({ profile, priceHistory }: DashboardProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const { netWorthUSD, portfolio } = profile;
  const { holdings } = portfolio;
  const ratioSections = computeRatioSections(profile, priceHistory);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans">
      <main className="mx-auto max-w-6xl px-6 py-8 space-y-4">
        {/* Net Worth Hero */}
        <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/20 p-7 shadow-2xl shadow-slate-950/50">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
            Total Net Worth
          </p>
          <p className="text-5xl font-bold text-white tracking-tight leading-none">
            {formatCurrency(netWorthUSD)}
          </p>
          <p className="mt-3 text-sm text-slate-500">As of {profile.asOf}</p>
        </section>

        {/* Graph section */}
        <section className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
          <Graph priceHistory={priceHistory} />
        </section>

        {/* Individual Holdings */}
        <section className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
          <IndividualAssets
            priceHistory={priceHistory}
            holdings={holdings}
            totalValueUSD={portfolio.totals.totalValueUSD}
          />
        </section>

        {/* Financial Ratios */}
        <section className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-800">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Financial Ratios
            </h2>
          </div>
          <div className="divide-y divide-slate-800">
            {ratioSections.map((section) => {
              const isExpanded = expandedSections[section.id] ?? false;
              return (
                <div key={section.id}>
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-800/30 transition-colors"
                  >
                    <h3 className="text-base font-bold text-slate-200">
                      {section.title}
                    </h3>
                    <span
                      className={`text-slate-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    >
                      ▼
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="px-5 pb-4">
                      <table className="w-full">
                        <tbody className="divide-y divide-slate-800/60">
                          {section.ratios.map(({ label, value, sentiment }) => (
                            <tr key={label}>
                              <td className="py-2.5">
                                <span className="text-sm text-slate-200">{label}</span>
                              </td>
                              <td
                                className={`py-2.5 text-sm font-semibold text-right tabular-nums ${getRatioValueClass(sentiment)}`}
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
        <section className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-800 flex items-center gap-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Holdings
            </h2>
            <span className="text-xs text-slate-600 font-medium">
              {holdings.length} assets
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Asset
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {holdings.map((holding: Holding) => (
                  <tr
                    key={holding.assetId}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-100">
                        {holding.name}
                      </p>
                      {holding.ticker && (
                        <p className="text-xs text-slate-500 mt-0.5">
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
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-100 tabular-nums">
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
