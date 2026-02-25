import type {
  Holding,
  AssetClass,
  UserProfile,
  PortfolioPriceHistory,
} from "../lib/types";
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

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

const RISK_FREE_RATE = 0.04;

function getRatioValueClass(label: string, value: string): string {
  if (label === "Max drawdown") return "text-red-400";
  if (label === "Sharpe ratio") {
    const n = parseFloat(value);
    if (isNaN(n) || value === "—") return "text-slate-300";
    if (n >= 1) return "text-emerald-400";
    if (n >= 0) return "text-yellow-400";
    return "text-red-400";
  }
  return "text-slate-200";
}

function computeRatios(
  profile: UserProfile,
  priceHistory: PortfolioPriceHistory,
): { label: string; value: string }[] {
  const { portfolio } = profile;
  const { holdings } = portfolio;
  const total = portfolio.totals.totalValueUSD;
  const data = priceHistory.data;

  const ratios: { label: string; value: string }[] = [];

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

  const maxHolding =
    holdings.length > 0 ? Math.max(...holdings.map((h) => h.valueUSD)) : 0;
  ratios.push({
    label: "Top holding %",
    value: total > 0 ? formatPercent(maxHolding / total) : "—",
  });

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
    ratios.push({ label: "Max drawdown", value: formatPercent(maxDD) });

    const n = data.length;
    const cagr = Math.pow(values[n - 1] / values[0], 252 / n) - 1;
    const sharpe =
      annualizedVol > 0 ? (cagr - RISK_FREE_RATE) / annualizedVol : 0;
    ratios.push({ label: "Sharpe ratio", value: sharpe.toFixed(2) });
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
  const ratios = computeRatios(profile, priceHistory);

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
          <div className="px-5 py-4">
            <table className="w-full">
              <tbody className="divide-y divide-slate-800/60">
                {ratios.map(({ label, value }) => (
                  <tr key={label}>
                    <td className="py-2.5 text-sm text-slate-400">{label}</td>
                    <td
                      className={`py-2.5 text-sm font-semibold text-right tabular-nums ${getRatioValueClass(label, value)}`}
                    >
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
