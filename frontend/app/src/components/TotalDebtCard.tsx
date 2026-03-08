"use client";

type TotalDebtCardProps = {
  totalDebt: number | null;
  debtBreakdown: { category: string; balanceUSD: number }[];
};

const CATEGORY_COLORS: Record<string, string> = {
  "Student Loans": "#3b82f6",
  "Home Loans (Mortgage)": "#10b981",
  "Auto Loans": "#f97316",
  "Credit Cards": "#8b5cf6",
  "Collections": "#a855f7",
};

const DEFAULT_COLOR = "#9ca3af";

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? DEFAULT_COLOR;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function TotalDebtCard({ totalDebt, debtBreakdown }: TotalDebtCardProps) {
  const hasBreakdown = debtBreakdown.length > 0 && debtBreakdown.some((d) => d.balanceUSD > 0);
  const total = totalDebt ?? 0;
  const items = hasBreakdown
    ? debtBreakdown.filter((d) => d.balanceUSD > 0)
    : total > 0
      ? [{ category: "Total debt", balanceUSD: total }]
      : [];

  return (
    <div className="flex-1 flex flex-col rounded-xl border border-[#e5e7eb] bg-white shadow-sm p-4 min-h-[180px]">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-base font-bold text-ink-1">Total debt balances</h2>
        <span className="font-mono text-xl font-bold text-ink-1 tabular-nums">
          {totalDebt !== null ? formatCurrency(totalDebt) : "—"}
        </span>
      </div>

      {totalDebt !== null && totalDebt > 0 && (
        <>
          {/* Segmented bar */}
          <div className="h-3 w-full rounded-full overflow-hidden flex mb-4">
            {items.length === 0 ? (
              <div className="h-full w-full rounded-full bg-navy-700" />
            ) : (
              items.map((item, i) => {
                const pct = total > 0 ? (item.balanceUSD / total) * 100 : 0;
                const color = getCategoryColor(item.category);
                return (
                  <div
                    key={item.category + i}
                    className="h-full transition-all min-w-[2px]"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: color,
                    }}
                  />
                );
              })
            )}
          </div>

          {/* Category list */}
          <div className="divide-y divide-[#e5e7eb]">
            {items.map((item, i) => {
              const pct = total > 0 ? (item.balanceUSD / total) * 100 : 0;
              const color = getCategoryColor(item.category);
              return (
                <div
                  key={item.category + i}
                  className="flex items-center justify-between py-2.5 first:pt-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm font-medium text-ink-1 truncate">
                      {item.category}
                    </span>
                    <span className="text-xs text-ink-4 shrink-0">
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                  <span className="font-mono text-sm font-semibold text-ink-1 tabular-nums shrink-0 ml-2">
                    {formatCurrency(item.balanceUSD)}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {totalDebt === null && (
        <p className="text-sm text-ink-4">—</p>
      )}
    </div>
  );
}
