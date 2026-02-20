import Link from "next/link";
import type {
  Holding,
  AssetClass,
  UserProfile,
  PortfolioPriceHistory,
} from "../lib/types";
import { Graph } from "./Graph";

const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
  cash: "Cash",
  stocks: "Stocks",
  bonds: "Bonds",
  crypto: "Crypto",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

const RISK_FREE_RATE = 0.04; // 4% annual

function computeRatios(
  profile: UserProfile,
  priceHistory: PortfolioPriceHistory,
): { label: string; value: string }[] {
  const { portfolio } = profile;
  const { holdings } = portfolio;
  const total = portfolio.totals.totalValueUSD;
  const data = priceHistory.data;

  const ratios: { label: string; value: string }[] = [];

  // Equity / Bond / Cash %
  const byClass = { stocks: 0, bonds: 0, cash: 0, crypto: 0 };
  for (const h of holdings) {
    byClass[h.assetClass] += h.valueUSD;
  }
  if (total > 0) {
    ratios.push({
      label: "Equity %",
      value: formatPercent(byClass.stocks / total),
    });
    ratios.push({
      label: "Bond %",
      value: formatPercent(byClass.bonds / total),
    });
    ratios.push({
      label: "Cash %",
      value: formatPercent(byClass.cash / total),
    });
    if (byClass.crypto > 0) {
      ratios.push({
        label: "Crypto %",
        value: formatPercent(byClass.crypto / total),
      });
    }
  }

  // Top holding %
  const maxHolding =
    holdings.length > 0 ? Math.max(...holdings.map((h) => h.valueUSD)) : 0;
  ratios.push({
    label: "Top holding %",
    value: total > 0 ? formatPercent(maxHolding / total) : "—",
  });

  // Volatility, Max drawdown, Sharpe (need price history)
  if (data.length >= 2) {
    const values = data.map((p) => p.valueUSD);
    const dailyReturns = values
      .slice(1)
      .map((v, i) => (v - values[i]) / values[i]);
    const mean = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
    const variance =
      dailyReturns.reduce((s, r) => s + (r - mean) ** 2, 0) /
      Math.max(1, dailyReturns.length - 1);
    const annualizedVol = Math.sqrt(variance) * Math.sqrt(252);
    ratios.push({
      label: "Volatility (ann.)",
      value: formatPercent(annualizedVol),
    });

    let peak = values[0];
    let maxDD = 0;
    for (let i = 0; i < values.length; i++) {
      peak = Math.max(peak, values[i]);
      const dd = values[i] / peak - 1;
      maxDD = Math.min(maxDD, dd);
    }
    ratios.push({
      label: "Max drawdown",
      value: formatPercent(maxDD),
    });

    const n = data.length;
    const cagr = Math.pow(values[n - 1] / values[0], 252 / n) - 1;
    const sharpe =
      annualizedVol > 0 ? (cagr - RISK_FREE_RATE) / annualizedVol : 0;
    ratios.push({
      label: "Sharpe ratio",
      value: sharpe.toFixed(2),
    });
  } else {
    ratios.push({ label: "Volatility (ann.)", value: "—" });
    ratios.push({ label: "Max drawdown", value: "—" });
    ratios.push({ label: "Sharpe ratio", value: "—" });
  }

  return ratios;
}

type DashboardProps = {
  profile: UserProfile;
  priceHistory: PortfolioPriceHistory;
};

export function Dashboard({ profile, priceHistory }: DashboardProps) {
  const { netWorthUSD, portfolio } = profile;
  const { holdings } = portfolio;

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      <main className="mx-auto max-w-6xl px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-zinc-900">
            Portfolio Dashboard
          </h1>
          <Link
            href="/"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            Change assets
          </Link>
        </div>

        {/* Net Worth Card */}
        <section className="mb-4 rounded-xl bg-white p-5 shadow-sm border border-zinc-200">
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-1">
            Total Net Worth
          </h2>
          <p className="text-3xl font-bold text-zinc-900">
            {formatCurrency(netWorthUSD)}
          </p>
          <p className="mt-1 text-sm text-zinc-500">As of {profile.asOf}</p>
        </section>

        {/* Portfolio Value Graph + Financial Ratios */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <div className="lg:col-span-2">
            <Graph priceHistory={priceHistory} />
          </div>
          <section className="rounded-xl bg-white shadow-sm border border-zinc-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-200">
              <h2 className="text-lg font-semibold text-zinc-900">
                Financial Ratios
              </h2>
            </div>
            <div className="p-5">
              <table className="w-full">
                <tbody className="divide-y divide-zinc-200">
                  {computeRatios(profile, priceHistory).map(
                    ({ label, value }) => (
                      <tr key={label}>
                        <td className="py-1.5 text-sm text-zinc-600">{label}</td>
                        <td className="py-1.5 text-sm font-medium text-zinc-900 text-right">
                          {value}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Holdings Table */}
        <section className="rounded-xl bg-white shadow-sm border border-zinc-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-200">
            <h2 className="text-lg font-semibold text-zinc-900">Holdings</h2>
            <p className="text-sm text-zinc-500 mt-0.5">
              {holdings.length} assets
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50">
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Asset
                    </th>
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-5 py-2.5 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Value (USD)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {holdings.map((holding: Holding) => (
                    <tr
                      key={holding.assetId}
                      className="hover:bg-zinc-50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div>
                          <p className="font-medium text-zinc-900">
                            {holding.name}
                          </p>
                          {holding.ticker && (
                            <p className="text-sm text-zinc-500">
                              {holding.ticker}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-zinc-600">
                        {ASSET_CLASS_LABELS[holding.assetClass]}
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-zinc-900">
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
