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

type DashboardProps = {
  profile: UserProfile;
  priceHistory: PortfolioPriceHistory;
};

export function Dashboard({ profile, priceHistory }: DashboardProps) {
  const { netWorthUSD, portfolio } = profile;
  const { holdings } = portfolio;

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-2xl font-semibold text-zinc-900 mb-8">
          Portfolio Dashboard
        </h1>

        {/* Net Worth Card */}
        <section className="mb-10 rounded-xl bg-white p-6 shadow-sm border border-zinc-200">
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-1">
            Total Net Worth
          </h2>
          <p className="text-3xl font-bold text-zinc-900">
            {formatCurrency(netWorthUSD)}
          </p>
          <p className="mt-1 text-sm text-zinc-500">As of {profile.asOf}</p>
        </section>

        {/* Portfolio Value Graph */}
        <Graph priceHistory={priceHistory} />

        {/* Holdings Table */}
        <section className="rounded-xl bg-white shadow-sm border border-zinc-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-200">
            <h2 className="text-lg font-semibold text-zinc-900">Holdings</h2>
            <p className="text-sm text-zinc-500 mt-0.5">
              {holdings.length} assets
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Asset
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
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
                    <td className="px-6 py-4">
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
                    <td className="px-6 py-4 text-sm text-zinc-600">
                      {ASSET_CLASS_LABELS[holding.assetClass]}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-zinc-900">
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
