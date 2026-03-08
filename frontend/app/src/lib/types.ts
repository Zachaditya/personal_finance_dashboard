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

export type financialProfile = {
  name: string;
  age: number;
  income: number;
  expenses: number;
  savings: number;
  investments: number;
  retirement: number;
  retirementAge: number;
  retirementIncome: number;
}

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

export type DebtCategory = "Student Loans" | "Home Loans (Mortgage)" | "Auto Loans" | "Credit Cards";

export type DebtBreakdownItem = {
  category: DebtCategory;
  balanceUSD: number;
};

export type OnboardingSubmitRequest = {
  income: number;
  savings: number;
  creditScore: number;
  totalDebt: number;
  holdings: { assetId: string; valueUSD: number }[];
  debtBreakdown?: { category: string; balanceUSD: number }[];
};

export type OnboardingSubmitResponse = {
  profile: UserProfile;
  portfolioScore: number;
  netWorthUSD: number;
  insights: string[];
  actionItems: string[];
  portfolioInsights: string[];
};

// Advisor feature types
export type ChatMessage = { role: "user" | "assistant"; content: string };

export type FinancialContextOnboarding = {
  income: number;
  savings: number;
  creditScore: number;
  totalDebt: number;
  debtBreakdown?: { category: string; balanceUSD: number }[];
};

export type FinancialContextHolding = {
  name: string;
  assetClass: string;
  valueUSD: number;
};

export type FinancialContextPortfolio = {
  netWorthUSD: number;
  holdings: FinancialContextHolding[];
  allocationApprox: { cash: number; stocks: number; bonds: number; crypto: number };
};

export type FinancialContext = {
  onboarding?: FinancialContextOnboarding;
  portfolio?: FinancialContextPortfolio;
};

export type CardCategory =
  | "travel"
  | "cashback"
  | "dining"
  | "gas"
  | "groceries"
  | "business"
  | "student"
  | "balance-transfer";

export type ApprovalLikelihood = "excellent" | "good" | "fair" | "low";

export type RankedCard = {
  id: string;
  name: string;
  issuer: string;
  annualFee: number;
  rewardsSummary: string;
  categories: CardCategory[];
  approvalLikelihood: ApprovalLikelihood;
  matchScore: number;
  aiReasoning: string;
  highlights: string[];
  creditScoreRequired: number;
};

export type ChatRequest = {
  message: string;
  history: ChatMessage[];
  context: FinancialContext;
};

export type ChatResponse = { reply: string };

export type CardRecommendationRequest = { context: FinancialContext };

export type CardRecommendationResponse = { cards: RankedCard[] };
