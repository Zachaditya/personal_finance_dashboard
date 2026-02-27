import type { UserProfile, PortfolioPriceHistory } from "./types";

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

const RISK_FREE_RATE = 0.04;
const TRADING_DAYS_PER_YEAR = 252;

export type Sentiment = "positive" | "neutral" | "slightly-negative" | "very-negative";

export type RatioSection = {
  id: string;
  title: string;
  description?: string;
  ratios: { label: string; value: string; description?: string; sentiment?: Sentiment }[];
};

function returnSentiment(r: number): Sentiment {
  if (r >= 0.10) return "positive";
  if (r >= 0) return "neutral";
  if (r >= -0.05) return "slightly-negative";
  return "very-negative";
}

function sharpeFamily(n: number): Sentiment {
  if (n >= 1.5) return "positive";
  if (n >= 0.5) return "neutral";
  if (n >= 0) return "slightly-negative";
  return "very-negative";
}

function drawdownSentiment(dd: number): Sentiment {
  // dd is negative (e.g. -0.15)
  if (dd > -0.10) return "positive";
  if (dd > -0.20) return "neutral";
  if (dd > -0.35) return "slightly-negative";
  return "very-negative";
}

function calmarSentiment(c: number): Sentiment {
  if (c >= 0.75) return "positive";
  if (c >= 0.3) return "neutral";
  if (c >= 0) return "slightly-negative";
  return "very-negative";
}

function downsideDevSentiment(d: number): Sentiment {
  if (d <= 0.10) return "positive";
  if (d <= 0.20) return "neutral";
  if (d <= 0.35) return "slightly-negative";
  return "very-negative";
}

function ulcerSentiment(u: number): Sentiment {
  if (u <= 5) return "positive";
  if (u <= 15) return "neutral";
  if (u <= 25) return "slightly-negative";
  return "very-negative";
}

function durationSentiment(days: number): Sentiment {
  if (days <= 15) return "positive";
  if (days <= 30) return "neutral";
  if (days <= 45) return "slightly-negative";
  return "very-negative";
}

function betaSentiment(b: number): Sentiment {
  const abs = Math.abs(b);
  if (abs <= 1.0) return "neutral";
  if (abs <= 1.5) return "slightly-negative";
  return "very-negative";
}

function alphaSentiment(a: number): Sentiment {
  if (a >= 0.02) return "positive";
  if (a >= 0) return "neutral";
  if (a >= -0.02) return "slightly-negative";
  return "very-negative";
}

function infoRatioSentiment(ir: number): Sentiment {
  if (ir >= 0.5) return "positive";
  if (ir >= 0) return "neutral";
  if (ir >= -0.5) return "slightly-negative";
  return "very-negative";
}

function varSentiment(v: number): Sentiment {
  // v is negative daily return
  if (v > -0.01) return "positive";
  if (v > -0.02) return "neutral";
  if (v > -0.04) return "slightly-negative";
  return "very-negative";
}

function cvarSentiment(v: number): Sentiment {
  if (v > -0.02) return "positive";
  if (v > -0.04) return "neutral";
  if (v > -0.07) return "slightly-negative";
  return "very-negative";
}

function skewnessSentiment(s: number): Sentiment {
  if (s >= 0.5) return "positive";
  if (s >= -0.5) return "neutral";
  if (s >= -1) return "slightly-negative";
  return "very-negative";
}

function kurtosisSentiment(k: number): Sentiment {
  if (k <= 1) return "positive";
  if (k <= 3) return "neutral";
  if (k <= 5) return "slightly-negative";
  return "very-negative";
}

function hhiSentiment(h: number): Sentiment {
  if (h <= 0.10) return "positive";
  if (h <= 0.18) return "neutral";
  if (h <= 0.25) return "slightly-negative";
  return "very-negative";
}

function effectiveNSentiment(n: number): Sentiment {
  if (n >= 10) return "positive";
  if (n >= 5) return "neutral";
  if (n >= 3) return "slightly-negative";
  return "very-negative";
}

function topHoldingPctSentiment(p: number): Sentiment {
  if (p <= 0.20) return "positive";
  if (p <= 0.35) return "neutral";
  if (p <= 0.50) return "slightly-negative";
  return "very-negative";
}

function top5PctSentiment(p: number): Sentiment {
  if (p <= 0.50) return "positive";
  if (p <= 0.70) return "neutral";
  if (p <= 0.85) return "slightly-negative";
  return "very-negative";
}

function top10PctSentiment(p: number): Sentiment {
  if (p <= 0.70) return "positive";
  if (p <= 0.85) return "neutral";
  if (p <= 0.95) return "slightly-negative";
  return "very-negative";
}

function volSentiment(v: number): Sentiment {
  if (v <= 0.10) return "positive";
  if (v <= 0.20) return "neutral";
  if (v <= 0.35) return "slightly-negative";
  return "very-negative";
}

function liquiditySentiment(l: number): Sentiment {
  if (l >= 0.30) return "positive";
  if (l >= 0.15) return "neutral";
  if (l >= 0.05) return "slightly-negative";
  return "very-negative";
}

export function computeRatioSections(
  profile: UserProfile,
  priceHistory: PortfolioPriceHistory
): RatioSection[] {
  const { portfolio } = profile;
  const { holdings } = portfolio;
  const total = portfolio.totals.totalValueUSD;
  const data = priceHistory.data;
  const sp500 = priceHistory.sp500 ?? [];

  const sections: RatioSection[] = [];

  // --- Return quality ---
  const returnQuality: { label: string; value: string; description?: string; sentiment?: Sentiment }[] = [];
  if (data.length >= 2) {
    const values = data.map((p) => p.valueUSD);
    const n = data.length;
    const cagr = Math.pow(values[n - 1] / values[0], TRADING_DAYS_PER_YEAR / n) - 1;
    returnQuality.push({
      label: "CAGR / Annualized return",
      value: formatPercent(cagr),
      description: "How fast did it grow per year?",
      sentiment: returnSentiment(cagr),
    });
  } else {
    returnQuality.push({ label: "CAGR / Annualized return", value: "—", description: "How fast did it grow per year?" });
  }
  returnQuality.push({
    label: "TWR vs IRR",
    value: "—",
    description: "Time-weighted vs Money-weighted return (needs deposit/withdrawal data)",
  });
  if (data.length >= TRADING_DAYS_PER_YEAR) {
    const values = data.map((p) => p.valueUSD);
    const roll1y = values.length >= TRADING_DAYS_PER_YEAR
      ? Math.pow(values[values.length - 1] / values[values.length - 1 - TRADING_DAYS_PER_YEAR], 1) - 1
      : null;
    const roll3y = values.length >= 3 * TRADING_DAYS_PER_YEAR
      ? Math.pow(values[values.length - 1] / values[values.length - 1 - 3 * TRADING_DAYS_PER_YEAR], 1 / 3) - 1
      : null;
    const roll5y = values.length >= 5 * TRADING_DAYS_PER_YEAR
      ? Math.pow(values[values.length - 1] / values[values.length - 1 - 5 * TRADING_DAYS_PER_YEAR], 1 / 5) - 1
      : null;
    returnQuality.push({ label: "Rolling 1Y return", value: roll1y != null ? formatPercent(roll1y) : "—", description: "Stability across different start dates", sentiment: roll1y != null ? returnSentiment(roll1y) : undefined });
    returnQuality.push({ label: "Rolling 3Y return", value: roll3y != null ? formatPercent(roll3y) : "—", description: "Stability across different start dates", sentiment: roll3y != null ? returnSentiment(roll3y) : undefined });
    returnQuality.push({ label: "Rolling 5Y return", value: roll5y != null ? formatPercent(roll5y) : "—", description: "Stability across different start dates", sentiment: roll5y != null ? returnSentiment(roll5y) : undefined });
  } else {
    returnQuality.push({ label: "Rolling 1Y return", value: "—", description: "Need ≥1 year of data" });
    returnQuality.push({ label: "Rolling 3Y return", value: "—", description: "Need ≥3 years of data" });
    returnQuality.push({ label: "Rolling 5Y return", value: "—", description: "Need ≥5 years of data" });
  }
  sections.push({ id: "return-quality", title: "Return quality", description: "How fast did it grow per year? Time-weighted vs money-weighted. Rolling returns.", ratios: returnQuality });

  // --- Risk that Sharpe misses ---
  const riskRatios: { label: string; value: string; description?: string; sentiment?: Sentiment }[] = [];
  if (data.length >= 2) {
    const values = data.map((p) => p.valueUSD);
    const dailyReturns = values.slice(1).map((v, i) => (v - values[i]) / values[i]);
    const mean = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
    const variance = dailyReturns.reduce((s, r) => s + (r - mean) ** 2, 0) / Math.max(1, dailyReturns.length - 1);
    const annualizedVol = Math.sqrt(variance) * Math.sqrt(TRADING_DAYS_PER_YEAR);

    const downsideReturns = dailyReturns.filter((r) => r < 0);
    const downsideVariance = downsideReturns.length > 0
      ? downsideReturns.reduce((s, r) => s + r * r, 0) / downsideReturns.length
      : 0;
    const downsideDev = Math.sqrt(downsideVariance) * Math.sqrt(TRADING_DAYS_PER_YEAR);
    const sortino = downsideDev > 0 ? (Math.pow(values[values.length - 1] / values[0], TRADING_DAYS_PER_YEAR / values.length) - 1 - RISK_FREE_RATE) / downsideDev : 0;

    let peak = values[0];
    let maxDD = 0;
    for (let i = 0; i < values.length; i++) {
      peak = Math.max(peak, values[i]);
      const dd = values[i] / peak - 1;
      maxDD = Math.min(maxDD, dd);
    }
    const cagr = Math.pow(values[values.length - 1] / values[0], TRADING_DAYS_PER_YEAR / values.length) - 1;
    const calmar = maxDD !== 0 ? cagr / Math.abs(maxDD) : 0;

    let ulcerSum = 0;
    peak = values[0];
    for (let i = 0; i < values.length; i++) {
      peak = Math.max(peak, values[i]);
      const ddPct = ((values[i] / peak - 1) * 100) ** 2;
      ulcerSum += ddPct;
    }
    const ulcerIndex = Math.sqrt(ulcerSum / values.length);

    let maxDrawdownDuration = 0;
    let inDrawdown = false;
    let drawdownStart = 0;
    peak = values[0];
    for (let i = 0; i < values.length; i++) {
      peak = Math.max(peak, values[i]);
      if (values[i] < peak) {
        if (!inDrawdown) {
          inDrawdown = true;
          drawdownStart = i;
        }
        maxDrawdownDuration = Math.max(maxDrawdownDuration, i - drawdownStart);
      } else {
        inDrawdown = false;
      }
    }

    riskRatios.push({ label: "Sortino ratio", value: sortino.toFixed(2), description: "Like Sharpe, but only penalizes downside volatility", sentiment: sharpeFamily(sortino) });
    riskRatios.push({ label: "Downside deviation", value: formatPercent(downsideDev), description: "Risk of bad outcomes, not all wiggles", sentiment: downsideDevSentiment(downsideDev) });
    riskRatios.push({ label: "Calmar ratio", value: calmar.toFixed(2), description: "Annualized return ÷ max drawdown (pain vs gain)", sentiment: calmarSentiment(calmar) });
    riskRatios.push({ label: "Max drawdown", value: formatPercent(maxDD), sentiment: drawdownSentiment(maxDD) });
    riskRatios.push({ label: "Ulcer index", value: ulcerIndex.toFixed(2), description: "How deep underwater", sentiment: ulcerSentiment(ulcerIndex) });
    riskRatios.push({ label: "Max drawdown duration (days)", value: String(maxDrawdownDuration), description: "How long underwater", sentiment: durationSentiment(maxDrawdownDuration) });
  } else {
    riskRatios.push({ label: "Sortino ratio", value: "—", description: "Like Sharpe, but only penalizes downside volatility" });
    riskRatios.push({ label: "Downside deviation", value: "—", description: "Risk of bad outcomes" });
    riskRatios.push({ label: "Calmar ratio", value: "—", description: "Annualized return ÷ max drawdown" });
    riskRatios.push({ label: "Max drawdown", value: "—" });
    riskRatios.push({ label: "Ulcer index", value: "—", description: "How deep underwater" });
    riskRatios.push({ label: "Max drawdown duration (days)", value: "—", description: "How long underwater" });
  }
  sections.push({ id: "risk-sharpe-misses", title: "Risk that Sharpe misses", description: "Sortino, downside deviation, Calmar, ulcer index", ratios: riskRatios });

  // --- Market sensitivity & benchmark skill ---
  const marketRatios: { label: string; value: string; description?: string; sentiment?: Sentiment }[] = [];
  if (data.length >= 2 && sp500.length > 0) {
    const spMap = new Map(sp500.map((p) => [p.date, p.valueUSD]));
    const aligned: { port: number; sp: number }[] = [];
    for (let i = 0; i < data.length; i++) {
      const spVal = spMap.get(data[i].date);
      if (spVal != null) {
        aligned.push({ port: data[i].valueUSD, sp: spVal });
      }
    }
    if (aligned.length >= 2) {
      const portReturns = aligned.slice(1).map((_, i) => (aligned[i + 1].port - aligned[i].port) / aligned[i].port);
      const spReturns = aligned.slice(1).map((_, i) => (aligned[i + 1].sp - aligned[i].sp) / aligned[i].sp);
      const pr = portReturns;
      const sr = spReturns;
      const minLen = pr.length;
      const portMean = pr.reduce((a, b) => a + b, 0) / minLen;
      const spMean = sr.reduce((a, b) => a + b, 0) / minLen;
      const cov = pr.reduce((s, p, i) => s + (p - portMean) * (sr[i] - spMean), 0) / minLen;
      const varSp = sr.reduce((s, r) => s + (r - spMean) ** 2, 0) / minLen;
      const beta = varSp > 0 ? cov / varSp : 0;
      const alpha = (portMean - RISK_FREE_RATE / TRADING_DAYS_PER_YEAR) - beta * (spMean - RISK_FREE_RATE / TRADING_DAYS_PER_YEAR);
      const annualizedAlpha = alpha * TRADING_DAYS_PER_YEAR;
      const trackingErr = Math.sqrt(pr.reduce((s, p, i) => s + (p - sr[i]) ** 2, 0) / minLen) * Math.sqrt(TRADING_DAYS_PER_YEAR);
      const activeReturn = (portMean - spMean) * TRADING_DAYS_PER_YEAR;
      const infoRatio = trackingErr > 0 ? activeReturn / trackingErr : 0;
      const varPort = pr.reduce((s, r) => s + (r - portMean) ** 2, 0) / minLen;
      const r2 = varSp > 0 && varPort > 0 ? (cov ** 2) / (varPort * varSp) : 0;

      marketRatios.push({ label: "Beta (vs S&P 500)", value: beta.toFixed(2), description: "How market-like the portfolio is", sentiment: betaSentiment(beta) });
      marketRatios.push({ label: "Alpha (vs benchmark)", value: formatPercent(annualizedAlpha), description: "Excess return after accounting for beta", sentiment: alphaSentiment(annualizedAlpha) });
      marketRatios.push({ label: "Tracking error", value: formatPercent(trackingErr), description: "How much you deviate from the benchmark", sentiment: "neutral" });
      marketRatios.push({ label: "Information ratio", value: infoRatio.toFixed(2), description: "Active return ÷ tracking error", sentiment: infoRatioSentiment(infoRatio) });
      marketRatios.push({ label: "R²", value: (r2 * 100).toFixed(1) + "%", description: "How much movement is explained by benchmark", sentiment: "neutral" });
    } else {
      marketRatios.push({ label: "Beta (vs S&P 500)", value: "—", description: "Need aligned benchmark data" });
      marketRatios.push({ label: "Alpha (vs benchmark)", value: "—", description: "Excess return after beta" });
      marketRatios.push({ label: "Tracking error", value: "—", description: "Deviation from benchmark" });
      marketRatios.push({ label: "Information ratio", value: "—", description: "Skill per unit of active risk" });
      marketRatios.push({ label: "R²", value: "—", description: "Movement explained by benchmark" });
    }
  } else {
    marketRatios.push({ label: "Beta (vs S&P 500)", value: "—", description: "How market-like the portfolio is" });
    marketRatios.push({ label: "Alpha (vs benchmark)", value: "—", description: "Excess return after beta" });
    marketRatios.push({ label: "Tracking error", value: "—", description: "Deviation from benchmark" });
    marketRatios.push({ label: "Information ratio", value: "—", description: "Skill per unit of active risk" });
    marketRatios.push({ label: "R²", value: "—", description: "Movement explained by benchmark" });
  }
  sections.push({ id: "market-sensitivity", title: "Market sensitivity & benchmark skill", description: "Beta, alpha, tracking error, information ratio, R²", ratios: marketRatios });

  // --- Tail risk ---
  const tailRatios: { label: string; value: string; description?: string; sentiment?: Sentiment }[] = [];
  if (data.length >= 2) {
    const values = data.map((p) => p.valueUSD);
    const dailyReturns = values.slice(1).map((v, i) => (v - values[i]) / values[i]);
    const sorted = [...dailyReturns].sort((a, b) => a - b);
    const var95Idx = Math.floor(sorted.length * 0.05);
    const var99Idx = Math.floor(sorted.length * 0.01);
    const var95 = sorted[var95Idx] ?? 0;
    const var99 = sorted[var99Idx] ?? 0;
    const worst5Pct = sorted.slice(0, Math.ceil(sorted.length * 0.05));
    const cvar = worst5Pct.length > 0 ? worst5Pct.reduce((a, b) => a + b, 0) / worst5Pct.length : 0;

    const mean = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
    const n = dailyReturns.length;
    const m2 = dailyReturns.reduce((s, r) => s + (r - mean) ** 2, 0) / n;
    const m3 = dailyReturns.reduce((s, r) => s + (r - mean) ** 3, 0) / n;
    const m4 = dailyReturns.reduce((s, r) => s + (r - mean) ** 4, 0) / n;
    const skewness = m2 > 0 ? m3 / Math.pow(m2, 1.5) : 0;
    const kurtosis = m2 > 0 ? m4 / (m2 * m2) - 3 : 0;

    tailRatios.push({ label: "VaR (95%)", value: formatPercent(var95), description: "Expected worst loss, most of the time", sentiment: varSentiment(var95) });
    tailRatios.push({ label: "VaR (99%)", value: formatPercent(var99), description: "Expected worst loss, most of the time", sentiment: varSentiment(var99) });
    tailRatios.push({ label: "CVaR / Expected Shortfall", value: formatPercent(cvar), description: "Average loss in worst tail", sentiment: cvarSentiment(cvar) });
    tailRatios.push({ label: "Skewness", value: skewness.toFixed(2), description: "Left tails / asymmetry", sentiment: skewnessSentiment(skewness) });
    tailRatios.push({ label: "Kurtosis", value: kurtosis.toFixed(2), description: "Fat tails", sentiment: kurtosisSentiment(kurtosis) });
  } else {
    tailRatios.push({ label: "VaR (95%)", value: "—", description: "Expected worst loss" });
    tailRatios.push({ label: "VaR (99%)", value: "—", description: "Expected worst loss" });
    tailRatios.push({ label: "CVaR / Expected Shortfall", value: "—", description: "Average loss in worst tail" });
    tailRatios.push({ label: "Skewness", value: "—", description: "Left tails" });
    tailRatios.push({ label: "Kurtosis", value: "—", description: "Fat tails" });
  }
  sections.push({ id: "tail-risk", title: "Tail risk", description: "VaR, CVaR, skewness, kurtosis", ratios: tailRatios });

  const byClass = { stocks: 0, bonds: 0, cash: 0, crypto: 0 };
  for (const h of holdings) {
    byClass[h.assetClass] += h.valueUSD;
  }

  // --- Concentration & diversification ---
  const concRatios: { label: string; value: string; description?: string; sentiment?: Sentiment }[] = [];
  if (total > 0 && holdings.length > 0) {
    const weights = holdings.map((h) => h.valueUSD / total);
    const hhi = weights.reduce((s, w) => s + w * w, 0);
    const effectiveN = hhi > 0 ? 1 / hhi : 0;
    const sorted = [...holdings].sort((a, b) => b.valueUSD - a.valueUSD);
    const top5 = sorted.slice(0, 5).reduce((s, h) => s + h.valueUSD, 0);
    const top10 = sorted.slice(0, 10).reduce((s, h) => s + h.valueUSD, 0);
    const maxHolding = sorted[0]?.valueUSD ?? 0;

    concRatios.push({ label: "HHI (concentration)", value: hhi.toFixed(4), description: "Herfindahl-Hirschman Index", sentiment: hhiSentiment(hhi) });
    concRatios.push({ label: "Effective # of holdings", value: effectiveN.toFixed(1), description: "Concentration score", sentiment: effectiveNSentiment(effectiveN) });
    concRatios.push({ label: "Top holding %", value: formatPercent(maxHolding / total), sentiment: topHoldingPctSentiment(maxHolding / total) });
    concRatios.push({ label: "Top 5 holding %", value: formatPercent(top5 / total), sentiment: top5PctSentiment(top5 / total) });
    concRatios.push({ label: "Top 10 holding %", value: formatPercent(top10 / total), sentiment: top10PctSentiment(top10 / total) });
    concRatios.push({ label: "Sector / country concentration", value: "—", description: "Requires asset classification" });
    concRatios.push({ label: "Avg pairwise correlation", value: "—", description: "Requires individual asset returns" });
  } else {
    concRatios.push({ label: "HHI", value: "—", description: "Concentration index" });
    concRatios.push({ label: "Effective # of holdings", value: "—", description: "Concentration score" });
    concRatios.push({ label: "Top holding %", value: "—" });
    concRatios.push({ label: "Top 5 holding %", value: "—" });
    concRatios.push({ label: "Top 10 holding %", value: "—" });
    concRatios.push({ label: "Sector / country concentration", value: "—", description: "Requires classification" });
    concRatios.push({ label: "Avg pairwise correlation", value: "—", description: "Requires asset returns" });
  }
  sections.push({ id: "concentration", title: "Concentration & diversification", description: "HHI, effective holdings, top 5/10, sector concentration", ratios: concRatios });

  // --- Allocation (existing Equity/Bond/Cash/Crypto) ---
  const allocRatios: { label: string; value: string; description?: string; sentiment?: Sentiment }[] = [];
  if (total > 0) {
    allocRatios.push({ label: "Equity %", value: formatPercent(byClass.stocks / total) });
    allocRatios.push({ label: "Bond %", value: formatPercent(byClass.bonds / total) });
    allocRatios.push({ label: "Cash %", value: formatPercent(byClass.cash / total) });
    if (byClass.crypto > 0) {
      allocRatios.push({ label: "Crypto %", value: formatPercent(byClass.crypto / total) });
    }
  }
  sections.push({ id: "allocation", title: "Asset allocation", ratios: allocRatios });

  // --- Risk (existing Volatility, Sharpe) ---
  const volRatios: { label: string; value: string; description?: string; sentiment?: Sentiment }[] = [];
  if (data.length >= 2) {
    const values = data.map((p) => p.valueUSD);
    const dailyReturns = values.slice(1).map((v, i) => (v - values[i]) / values[i]);
    const mean = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
    const variance = dailyReturns.reduce((s, r) => s + (r - mean) ** 2, 0) / Math.max(1, dailyReturns.length - 1);
    const annualizedVol = Math.sqrt(variance) * Math.sqrt(TRADING_DAYS_PER_YEAR);
    const n = data.length;
    const cagr = Math.pow(values[n - 1] / values[0], TRADING_DAYS_PER_YEAR / n) - 1;
    const sharpe = annualizedVol > 0 ? (cagr - RISK_FREE_RATE) / annualizedVol : 0;
    volRatios.push({ label: "Volatility (ann.)", value: formatPercent(annualizedVol), sentiment: volSentiment(annualizedVol) });
    volRatios.push({ label: "Sharpe ratio", value: sharpe.toFixed(2), sentiment: sharpeFamily(sharpe) });
  } else {
    volRatios.push({ label: "Volatility (ann.)", value: "—" });
    volRatios.push({ label: "Sharpe ratio", value: "—" });
  }
  sections.push({ id: "volatility", title: "Volatility & Sharpe", ratios: volRatios });

  // --- Practical metrics ---
  const practicalRatios: { label: string; value: string; description?: string; sentiment?: Sentiment }[] = [];
  if (total > 0) {
    const liquidityEst = (byClass.cash + byClass.bonds * 0.8) / total;
    practicalRatios.push({ label: "Liquidity score (est.)", value: formatPercent(liquidityEst), description: "% in assets you can sell same-day", sentiment: liquiditySentiment(liquidityEst) });
  }
  practicalRatios.push({ label: "Turnover", value: "—", description: "Requires trade history" });
  practicalRatios.push({ label: "Fee drag", value: "—", description: "Weighted expense ratio + trading costs" });
  practicalRatios.push({ label: "Tax drag (est.)", value: "—", description: "Requires lot tracking" });
  sections.push({ id: "practical", title: "Practical metrics", description: "Liquidity, turnover, fees, tax drag", ratios: practicalRatios });

  return sections
    .map((s) => ({ ...s, ratios: s.ratios.filter((r) => r.value !== "—") }))
    .filter((s) => s.ratios.length > 0);
}
