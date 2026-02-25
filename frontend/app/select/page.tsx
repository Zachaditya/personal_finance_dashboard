"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAssets } from "../src/lib/api";
import type { Asset, AssetClass } from "../src/lib/types";

const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
  cash: "Cash",
  stocks: "Stocks",
  bonds: "Bonds",
  crypto: "Crypto",
};

const ASSET_CLASS_ACCENT: Record<AssetClass, string> = {
  cash: "text-emerald-400",
  stocks: "text-blue-400",
  bonds: "text-violet-400",
  crypto: "text-orange-400",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function SelectPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [values, setValues] = useState<Record<string, number>>({});
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAssets()
      .then((list) => {
        setAssets(list);
        setSelected(new Set(list.map((a) => a.assetId)));
        setValues(Object.fromEntries(list.map((a) => [a.assetId, 0])));
        setInputValues(Object.fromEntries(list.map((a) => [a.assetId, ""])));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const updateValue = (assetId: string, raw: string) => {
    setInputValues((prev) => ({ ...prev, [assetId]: raw }));
    const cleaned = raw.replace(/[^0-9.-]/g, "");
    const num = cleaned === "" ? 0 : parseFloat(cleaned);
    setValues((prev) => ({ ...prev, [assetId]: isNaN(num) ? 0 : num }));
  };

  const reformatOnBlur = (assetId: string) => {
    const num = values[assetId] ?? 0;
    setInputValues((prev) => ({
      ...prev,
      [assetId]: num === 0 ? "" : num.toLocaleString("en-US"),
    }));
  };

  const toggleAsset = (assetId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(assetId)) {
        next.delete(assetId);
      } else {
        next.add(assetId);
      }
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(assets.map((a) => a.assetId)));
  const selectNone = () => setSelected(new Set());

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="h-4 w-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
          <span className="text-sm">Loading assets…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="rounded-xl bg-slate-900 border border-red-900/50 p-6 max-w-sm">
          <p className="text-sm text-red-400">Failed to load assets: {error}</p>
        </div>
      </div>
    );
  }

  const groupedByClass = assets.reduce<Record<AssetClass, Asset[]>>(
    (acc, a) => {
      (acc[a.assetClass] = acc[a.assetClass] || []).push(a);
      return acc;
    },
    { cash: [], stocks: [], bonds: [], crypto: [] },
  );

  const totalSelected = [...selected].reduce(
    (sum, id) => sum + (values[id] ?? 0),
    0,
  );

  const ASSET_CLASS_BORDER: Record<AssetClass, string> = {
    cash: "border-emerald-500/30",
    stocks: "border-blue-500/30",
    bonds: "border-violet-500/30",
    crypto: "border-orange-500/30",
  };

  const ASSET_CLASS_HEADER: Record<AssetClass, string> = {
    cash: "bg-emerald-500/10 border-emerald-500/20",
    stocks: "bg-blue-500/10 border-blue-500/20",
    bonds: "bg-violet-500/10 border-violet-500/20",
    crypto: "bg-orange-500/10 border-orange-500/20",
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans">
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight mb-2">
            Build your portfolio
          </h1>
          <p className="text-sm text-slate-400">
            Select assets and enter their current values to analyze your
            portfolio.
          </p>
        </div>

        {/* Quick select buttons */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={selectAll}
            className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-medium text-slate-300 transition-colors"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={selectNone}
            className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-medium text-slate-300 transition-colors"
          >
            Select none
          </button>
        </div>

        {/* Asset class panels - Cash & Stocks on top, Bonds & Crypto below */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Object.entries(ASSET_CLASS_LABELS) as [AssetClass, string][]).map(
            ([assetClass, label]) => {
              const items = groupedByClass[assetClass];
              const accent = ASSET_CLASS_ACCENT[assetClass];
              const border = ASSET_CLASS_BORDER[assetClass];
              const headerBg = ASSET_CLASS_HEADER[assetClass];

              const isCash = assetClass === "cash";

              return (
                <section
                  key={assetClass}
                  className={`rounded-xl border bg-slate-900 overflow-hidden ${!isCash ? "min-h-[200px]" : ""} ${border}`}
                >
                  <div
                    className={`border-b ${headerBg} border-slate-800/50 ${isCash ? "px-3 py-2" : "px-4 py-3"}`}
                  >
                    <h2
                      className={`text-xs font-semibold uppercase tracking-widest ${accent}`}
                    >
                      {label}
                    </h2>
                    {!isCash && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {items.length} asset{items.length !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                  <div
                    className={`${isCash ? "px-2 py-1.5" : "p-3 overflow-y-auto max-h-[320px]"}`}
                  >
                    {items.length === 0 ? (
                      <p
                        className={`text-sm text-slate-500 text-center ${isCash ? "py-2" : "py-4"}`}
                      >
                        No assets
                      </p>
                    ) : (
                      <ul className={isCash ? "space-y-0.5" : "space-y-1"}>
                        {items.map((asset) => (
                          <li key={asset.assetId}>
                            <div
                              className={`flex items-center rounded-lg transition-colors ${
                                isCash
                                  ? "gap-2 px-2 py-1.5"
                                  : "gap-3 px-2.5 py-2"
                              } ${
                                selected.has(asset.assetId)
                                  ? "hover:bg-slate-800/50"
                                  : "opacity-40 hover:bg-slate-800/30"
                              }`}
                            >
                              <label
                                className={`flex items-center cursor-pointer flex-1 min-w-0 ${isCash ? "gap-2" : "gap-2.5"}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={selected.has(asset.assetId)}
                                  onChange={() => toggleAsset(asset.assetId)}
                                  className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-800 accent-emerald-400 cursor-pointer shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-slate-200 text-sm truncate">
                                    {asset.name}
                                  </p>
                                  {asset.ticker && (
                                    <p className="text-xs text-slate-500 truncate">
                                      {asset.ticker}
                                    </p>
                                  )}
                                </div>
                              </label>
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-xs text-slate-500 font-medium">
                                  $
                                </span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={inputValues[asset.assetId] ?? ""}
                                  onChange={(e) =>
                                    updateValue(asset.assetId, e.target.value)
                                  }
                                  onBlur={() => reformatOnBlur(asset.assetId)}
                                  placeholder="0"
                                  aria-label={`${asset.name} value in USD`}
                                  className="w-32 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-right font-medium text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-colors"
                                />
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              );
            },
          )}
        </div>

        {/* Summary + CTA */}
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            <span className="text-slate-300 font-medium">{selected.size}</span>
            {" of "}
            <span className="text-slate-300 font-medium">{assets.length}</span>
            {" assets selected"}
            {selected.size > 0 && totalSelected > 0 && (
              <>
                <span className="mx-2 text-slate-700">•</span>
                <span className="text-emerald-400 font-medium">
                  {formatCurrency(totalSelected)}
                </span>
              </>
            )}
          </p>

          <button
            type="button"
            disabled={selected.size === 0}
            onClick={() => {
              const pairs = [...selected].map(
                (id) => `${encodeURIComponent(id)}:${values[id] ?? 0}`,
              );
              router.push(`/dashboard?h=${pairs.join(",")}`);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 px-5 py-2.5 text-sm font-semibold text-slate-900 disabled:cursor-not-allowed transition-colors shadow-lg shadow-emerald-500/20 disabled:shadow-none"
          >
            View Dashboard
            <span className="text-sm">→</span>
          </button>
        </div>
      </main>
    </div>
  );
}
