export type AssetClass = "cash" | "stocks" | "bonds" | "crypto";

export type Asset = {
  assetId: string;
  name: string;
  assetClass: AssetClass;
  ticker?: string | null;
};

export type Holding = {
  assetId: string;
  name: string;
  assetClass: AssetClass;
  ticker?: string | null;
  valueUSD: number;
};

export type Portfolio = {
  name: string;
  notes: string;
  holdings: Holding[];
  totals: { totalValueUSD: number };
  allocationApprox: { cash: number; stocks: number; bonds: number; crypto: number };
};

export type UserProfile = {
  userId: string;
  name: string;
  asOf: string;
  baseCurrency: string;
  netWorthUSD: number;
  portfolio: Portfolio;
};

export type PricePoint = {
  date: string;
  valueUSD: number;
};

export type PortfolioPriceHistory = {
  data: PricePoint[];
  sp500?: PricePoint[]; // Simulated S&P 500 investment (same initial value)
  bitcoin?: PricePoint[]; // Simulated Bitcoin investment (same initial value)
};
