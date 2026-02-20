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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAssets()
      .then((list) => {
        setAssets(list);
        setSelected(new Set(list.map((a) => a.assetId)));
        setValues(Object.fromEntries(list.map((a) => [a.assetId, 0])));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const updateValue = (assetId: string, raw: string) => {
    const cleaned = raw.replace(/[^0-9.-]/g, "");
    const num = cleaned === "" ? 0 : parseFloat(cleaned);
    setValues((prev) => ({ ...prev, [assetId]: num }));
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
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <p className="text-zinc-500">Loading assets…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <p className="text-red-600">Failed to load assets: {error}</p>
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

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-semibold text-zinc-900 mb-2">
          Select your assets
        </h1>
        <p className="text-zinc-500 mb-8">
          Choose which assets to include in your portfolio view.
        </p>

        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={selectAll}
            className="rounded-lg bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-300 transition-colors"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={selectNone}
            className="rounded-lg bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-300 transition-colors"
          >
            Select none
          </button>
        </div>

        <section className="rounded-xl bg-white shadow-sm border border-zinc-200 overflow-hidden">
          <div className="divide-y divide-zinc-200">
            {(Object.entries(ASSET_CLASS_LABELS) as [AssetClass, string][]).map(
              ([assetClass, label]) => {
                const items = groupedByClass[assetClass];
                if (!items.length) return null;

                return (
                  <div key={assetClass} className="p-4">
                    <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-3">
                      {label}
                    </h2>
                    <ul className="space-y-2">
                      {items.map((asset) => (
                        <li key={asset.assetId}>
                          <div
                            className={`flex items-center gap-4 hover:bg-zinc-50 -mx-2 px-2 py-2 rounded-lg transition-colors ${
                              selected.has(asset.assetId) ? "" : "opacity-60"
                            }`}
                          >
                            <label className="flex items-center gap-4 cursor-pointer flex-1 min-w-0">
                              <input
                                type="checkbox"
                                checked={selected.has(asset.assetId)}
                                onChange={() => toggleAsset(asset.assetId)}
                                className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-zinc-900">
                                  {asset.name}
                                </p>
                                {asset.ticker && (
                                  <p className="text-sm text-zinc-500">
                                    {asset.ticker}
                                  </p>
                                )}
                              </div>
                            </label>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-sm text-zinc-500">$</span>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={values[asset.assetId] ?? 0}
                                onChange={(e) =>
                                  updateValue(asset.assetId, e.target.value)
                                }
                                placeholder="0"
                                aria-label={`${asset.name} value in USD`}
                                className="w-24 rounded-md border border-zinc-300 px-2 py-1.5 text-sm text-right font-medium text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                              />
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              },
            )}
          </div>
        </section>

        <h2 className="mt-6 text-sm text-zinc-500">
          {selected.size} of {assets.length} assets selected
          {selected.size > 0 && (
            <>
              {" • "}
              Total:{" "}
              {formatCurrency(
                [...selected].reduce((sum, id) => sum + (values[id] ?? 0), 0),
              )}
            </>
          )}
        </h2>

        <div className="mt-8">
          <button
            type="button"
            disabled={selected.size === 0}
            onClick={() => {
              const pairs = [...selected].map(
                (id) => `${encodeURIComponent(id)}:${values[id] ?? 0}`,
              );
              router.push(`/dashboard?h=${pairs.join(",")}`);
            }}
            className="inline-flex items-center rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            View Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}
