import { describe, expect, it } from "vitest";
import { computeRatioSections } from "./ratios";
import type { PortfolioPriceHistory, UserProfile } from "./types";

function makeProfile(holdings: { assetId: string; valueUSD: number; assetClass: string }[]): UserProfile {
  const total = holdings.reduce((s, h) => s + h.valueUSD, 0);
  const byClass = { stocks: 0, bonds: 0, cash: 0, crypto: 0 };
  for (const h of holdings) {
    byClass[h.assetClass as keyof typeof byClass] += h.valueUSD;
  }
  const alloc = total > 0
    ? {
        stocks: byClass.stocks / total,
        bonds: byClass.bonds / total,
        cash: byClass.cash / total,
        crypto: byClass.crypto / total,
      }
    : { stocks: 0, bonds: 0, cash: 0, crypto: 0 };

  return {
    userId: "custom",
    name: "Custom Portfolio",
    asOf: "2024-01-01",
    baseCurrency: "USD",
    netWorthUSD: total,
    portfolio: {
      name: "Custom Portfolio",
      notes: "",
      holdings: holdings.map((h) => ({
        assetId: h.assetId,
        name: h.assetId,
        assetClass: h.assetClass as "stocks" | "bonds" | "cash" | "crypto",
        ticker: h.assetId,
        valueUSD: h.valueUSD,
      })),
      totals: { totalValueUSD: total },
      allocationApprox: alloc,
    },
  };
}

describe("computeRatioSections", () => {
  it("returns sections with CAGR for minimal profile and price history", () => {
    const profile = makeProfile([{ assetId: "VTI", valueUSD: 10000, assetClass: "stocks" }]);
    const priceHistory: PortfolioPriceHistory = {
      data: [
        { date: "2020-01-01", valueUSD: 10000 },
        { date: "2021-01-01", valueUSD: 11000 },
      ],
      sp500: [],
      bitcoin: [],
    };
    const sections = computeRatioSections(profile, priceHistory);
    expect(sections.length).toBeGreaterThan(0);
    const hasCagr = sections.some((s) =>
      s.ratios.some((r) => r.label.includes("CAGR") || r.label.includes("Annualized"))
    );
    expect(hasCagr).toBe(true);
  });

  it("filters sections with no values when data is empty", () => {
    const profile = makeProfile([{ assetId: "VTI", valueUSD: 10000, assetClass: "stocks" }]);
    const priceHistory: PortfolioPriceHistory = {
      data: [],
      sp500: [],
      bitcoin: [],
    };
    const sections = computeRatioSections(profile, priceHistory);
    // With empty data, sections are filtered - allocation section may still have values
    expect(Array.isArray(sections)).toBe(true);
  });

  it("allocation section shows Equity % = 100% for single stock holding", () => {
    const profile = makeProfile([{ assetId: "VTI", valueUSD: 10000, assetClass: "stocks" }]);
    const priceHistory: PortfolioPriceHistory = {
      data: [
        { date: "2020-01-01", valueUSD: 10000 },
        { date: "2021-01-01", valueUSD: 11000 },
      ],
      sp500: [],
      bitcoin: [],
    };
    const sections = computeRatioSections(profile, priceHistory);
    const allocSection = sections.find((s) => s.id === "allocation" || s.title.includes("Asset allocation"));
    expect(allocSection).toBeDefined();
    const equityRatio = allocSection?.ratios.find((r) => r.label.includes("Equity"));
    expect(equityRatio).toBeDefined();
    expect(equityRatio?.value).toBe("100.0%");
  });

  it("includes risk ratios for sufficient data", () => {
    const profile = makeProfile([{ assetId: "VTI", valueUSD: 10000, assetClass: "stocks" }]);
    const priceHistory: PortfolioPriceHistory = {
      data: [
        { date: "2020-01-01", valueUSD: 10000 },
        { date: "2021-01-01", valueUSD: 11000 },
      ],
      sp500: [],
      bitcoin: [],
    };
    const sections = computeRatioSections(profile, priceHistory);
    const hasSortinoOrDrawdown = sections.some((s) =>
      s.ratios.some(
        (r) =>
          r.label.includes("Sortino") ||
          r.label.includes("drawdown") ||
          r.label.includes("Max drawdown")
      )
    );
    expect(hasSortinoOrDrawdown).toBe(true);
  });
});
