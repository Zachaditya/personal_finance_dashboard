export type AssetClass = "cash" | "stocks" | "bonds" | "crypto";

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
};
