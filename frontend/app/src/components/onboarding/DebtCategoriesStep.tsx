"use client";

import { useState } from "react";

type DebtCategoriesStepProps = {
  onSubmit: (breakdown: { category: string; balanceUSD: number }[]) => void;
  onBack: () => void;
};

const DEBT_CATEGORIES = [
  {
    id: "student",
    label: "Student Loans",
    description: "Federal or private student loan balances",
    accent: "text-blue-400",
    border: "border-blue-500/20",
    header: "bg-blue-500/8 border-blue-500/15",
  },
  {
    id: "home",
    label: "Home Loans (Mortgage)",
    description: "Remaining mortgage balance on your home",
    accent: "text-emerald-400",
    border: "border-emerald-500/20",
    header: "bg-emerald-500/8 border-emerald-500/15",
  },
  {
    id: "auto",
    label: "Auto Loans",
    description: "Outstanding balance on vehicle financing",
    accent: "text-orange-400",
    border: "border-orange-500/20",
    header: "bg-orange-500/8 border-orange-500/15",
  },
  {
    id: "credit",
    label: "Credit Cards",
    description: "Total balance across all credit cards",
    accent: "text-violet-400",
    border: "border-violet-500/20",
    header: "bg-violet-500/8 border-violet-500/15",
  },
] as const;

type CategoryId = (typeof DEBT_CATEGORIES)[number]["id"];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function DebtCategoriesStep({ onSubmit, onBack }: DebtCategoriesStepProps) {
  const [selected, setSelected] = useState<Set<CategoryId>>(new Set());
  const [values, setValues] = useState<Record<CategoryId, number>>({
    student: 0,
    home: 0,
    auto: 0,
    credit: 0,
  });
  const [inputValues, setInputValues] = useState<Record<CategoryId, string>>({
    student: "",
    home: "",
    auto: "",
    credit: "",
  });

  const toggleCategory = (id: CategoryId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const updateValue = (id: CategoryId, raw: string) => {
    setInputValues((prev) => ({ ...prev, [id]: raw }));
    const cleaned = raw.replace(/[^0-9.-]/g, "");
    const num = cleaned === "" ? 0 : parseFloat(cleaned);
    setValues((prev) => ({ ...prev, [id]: isNaN(num) ? 0 : num }));
  };

  const reformatOnBlur = (id: CategoryId) => {
    const num = values[id] ?? 0;
    setInputValues((prev) => ({
      ...prev,
      [id]: num === 0 ? "" : num.toLocaleString("en-US"),
    }));
  };

  const selectAll = () => setSelected(new Set(DEBT_CATEGORIES.map((c) => c.id)));
  const selectNone = () => setSelected(new Set());

  const totalBalance = [...selected].reduce((sum, id) => sum + (values[id] ?? 0), 0);

  const handleSubmit = () => {
    const breakdown = [...selected].map((id) => ({
      category: DEBT_CATEGORIES.find((c) => c.id === id)!.label,
      balanceUSD: values[id] ?? 0,
    }));
    onSubmit(breakdown);
  };

  const canContinue = selected.size > 0 && totalBalance > 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-ink-1 tracking-tight mb-1">
            Break down your debt
          </h2>
          <p className="text-sm text-ink-3">
            Select the types of debt you carry and enter each balance.
          </p>
        </div>
        <div className="flex gap-2 shrink-0 pt-1">
          <button
            type="button"
            onClick={selectAll}
            className="rounded-lg bg-navy-800 hover:bg-navy-700 px-3 py-1.5 text-xs font-medium text-ink-2 transition-colors"
          >
            All
          </button>
          <button
            type="button"
            onClick={selectNone}
            className="rounded-lg bg-navy-800 hover:bg-navy-700 px-3 py-1.5 text-xs font-medium text-ink-2 transition-colors"
          >
            None
          </button>
        </div>
      </div>

      {/* Debt category list */}
      <ul className="space-y-2">
        {DEBT_CATEGORIES.map((cat) => {
          const isSelected = selected.has(cat.id);
          return (
            <li key={cat.id}>
              <div
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 bg-navy-800/50 transition-colors ${cat.border} ${
                  isSelected ? "" : "opacity-60"
                }`}
              >
                <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleCategory(cat.id)}
                    className="h-3.5 w-3.5 rounded border-[#d1d5db] bg-white accent-gold-400 cursor-pointer shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${isSelected ? "text-ink-1" : "text-ink-3"}`}>
                      {cat.label}
                    </p>
                    <p className="text-xs text-ink-4 truncate">{cat.description}</p>
                  </div>
                </label>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-xs text-ink-4 font-medium">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={inputValues[cat.id]}
                    onChange={(e) => updateValue(cat.id, e.target.value)}
                    onBlur={() => reformatOnBlur(cat.id)}
                    onFocus={() => {
                      if (!selected.has(cat.id)) toggleCategory(cat.id);
                    }}
                    placeholder="0"
                    aria-label={`${cat.label} balance in USD`}
                    className="w-32 rounded-lg border border-[#e5e7eb] bg-navy-800 px-3 py-1.5 text-sm text-right font-mono font-medium text-ink-1 placeholder-ink-4 focus:border-gold-400 focus:outline-none focus:ring-1 focus:ring-gold-400/30 transition-colors"
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Footer */}
      <div className="pt-2 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-ink-4">
            {selected.size > 0 ? (
              <>
                <span className="text-ink-2 font-medium">{selected.size}</span>
                {` categor${selected.size === 1 ? "y" : "ies"} selected`}
                {totalBalance > 0 && (
                  <>
                    <span className="mx-2 text-ink-4/50">•</span>
                    <span className="text-gold-400 font-mono font-medium">
                      {formatCurrency(totalBalance)}
                    </span>
                  </>
                )}
              </>
            ) : (
              <span className="text-ink-4">No categories selected</span>
            )}
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onBack}
              className="rounded-lg bg-navy-800 hover:bg-navy-700 px-5 py-2.5 text-sm font-medium text-ink-2 transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canContinue}
              className="inline-flex items-center gap-2 rounded-lg bg-gold-400 hover:bg-gold-300 disabled:bg-navy-800 disabled:text-ink-4 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed transition-colors"
            >
              Continue
              <span>→</span>
            </button>
          </div>
        </div>

        <p className="text-center">
          <button
            type="button"
            onClick={() => onSubmit([])}
            className="text-xs text-ink-4 hover:text-ink-3 underline underline-offset-2 transition-colors"
          >
            Skip — use total from previous step
          </button>
        </p>
      </div>
    </div>
  );
}
