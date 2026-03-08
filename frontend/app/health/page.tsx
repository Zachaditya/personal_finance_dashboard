"use client";

import { useEffect, useState } from "react";
import { getUserOnboarding, postCustomPortfolio } from "../src/lib/api";
import type { OnboardingSubmitResponse } from "../src/lib/types";
import { AllocationChart } from "../src/components/AllocationChart";
import { CreditScoreMeter } from "../src/components/CreditScoreMeter";
import { MilestonesSection } from "../src/components/MilestonesSection";
import { TotalDebtCard } from "../src/components/TotalDebtCard";

export default function HealthPage() {
  const [result, setResult] = useState<OnboardingSubmitResponse | null>(null);
  const [profile, setProfile] = useState<
    OnboardingSubmitResponse["profile"] | null
  >(null);
  const [onboarding, setOnboarding] = useState<{
    totalDebt?: number;
    creditScore?: number;
    debtBreakdown?: { category: string; balanceUSD: number }[];
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fallbackToLocalStorage = () => {
      if (cancelled) return;
      try {
        const resultRaw = localStorage.getItem("onboardingResult");
        const onboardingRaw = localStorage.getItem("onboarding");
        const localOnboarding = onboardingRaw ? JSON.parse(onboardingRaw) : null;
        const resultData = resultRaw ? JSON.parse(resultRaw) : null;
        if (resultData && localOnboarding) {
          const netWorthUSD = localOnboarding.savings - localOnboarding.totalDebt;
          setResult({ ...resultData, netWorthUSD });
          setOnboarding({
            totalDebt: localOnboarding.totalDebt,
            creditScore: localOnboarding.creditScore,
            debtBreakdown: localOnboarding.debtBreakdown ?? [],
          });
          if (resultData.profile?.portfolio?.holdings?.length) setProfile(resultData.profile);
        } else if (resultData) {
          setResult(resultData);
          if (localOnboarding) setOnboarding({
            totalDebt: localOnboarding.totalDebt,
            creditScore: localOnboarding.creditScore,
            debtBreakdown: localOnboarding.debtBreakdown ?? [],
          });
          if (resultData.profile?.portfolio?.holdings?.length) setProfile(resultData.profile);
        }
      } catch { /* ignore */ }
    };
    getUserOnboarding()
      .then((res) => {
        if (cancelled) return;
        if (res.onboarding?.result) {
          const r = res.onboarding.result;
          const o = res.onboarding as {
            totalDebt?: number;
            creditScore?: number;
            savings?: number;
            holdings?: { assetId: string; valueUSD: number }[];
            debtBreakdown?: { category: string; balanceUSD: number }[];
          };
          const netWorthUSD = r.netWorthUSD ?? (o.savings ?? 0) - (o.totalDebt ?? 0);
          const holdings = o.holdings ?? [];
          setResult({
            profile: {} as OnboardingSubmitResponse["profile"],
            portfolioScore: r.portfolioScore ?? 500,
            netWorthUSD,
            insights: r.insights ?? [],
            actionItems: r.actionItems ?? [],
            portfolioInsights: r.portfolioInsights ?? [],
          });
          setOnboarding({
            totalDebt: o.totalDebt,
            creditScore: o.creditScore,
            debtBreakdown: o.debtBreakdown ?? [],
          });
          if (holdings.length > 0) {
            postCustomPortfolio(holdings)
              .then((p) => { if (!cancelled) setProfile(p); })
              .catch(() => {});
          }
        } else {
          fallbackToLocalStorage();
        }
      })
      .catch(fallbackToLocalStorage);
    return () => { cancelled = true; };
  }, []);

  const netWorth = result?.netWorthUSD ?? null;
  const portfolioScore = result?.portfolioScore ?? null;
  const totalDebt = onboarding?.totalDebt ?? null;
  const creditScore = onboarding?.creditScore ?? null;
  const debtBreakdown = onboarding?.debtBreakdown ?? [];
  const insights = result?.insights ?? [];
  const actionItems = result?.actionItems ?? [];
  const portfolioInsights = result?.portfolioInsights ?? [];

  const getScoreRating = (score: number) => {
    if (score <= 400) return "Poor";
    if (score <= 650) return "Fair";
    if (score <= 800) return "Good";
    return "Excellent";
  };

  const scorePct = portfolioScore !== null ? (portfolioScore / 1000) * 100 : 0;

  return (
    <div className="flex min-h-screen w-full flex-col bg-navy-950">
      <div className="flex flex-1 flex-col px-3 py-3 md:px-4 md:py-4 lg:px-5 lg:py-4">
        <h1 className="text-2xl md:text-3xl font-semibold text-ink-1">
          Financial Health
        </h1>
        <div className="mt-3 flex gap-3 lg:gap-4">
          {/* Left column */}
          <div className="flex flex-1 flex-col gap-3 min-w-0">

            {/* Score + Net Worth row */}
            <div className="flex items-stretch gap-3">
              <div className="flex-1 flex flex-col rounded-xl border border-[#e5e7eb] bg-white shadow-sm p-4 min-h-[140px]">
                <div className="flex items-baseline justify-between">
                  <h2 className="text-base font-semibold text-ink-3">
                    Health Score
                  </h2>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-3xl md:text-4xl font-bold text-gold-400 tabular-nums">
                      {portfolioScore !== null ? portfolioScore : "—"}
                    </span>
                    {portfolioScore !== null && (
                      <span className="text-sm font-medium text-gold-400">
                        {getScoreRating(portfolioScore)}
                      </span>
                    )}
                  </div>
                </div>
                {portfolioScore !== null && (
                  <div className="mt-4">
                    <div className="relative flex h-3 w-full items-center">
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-navy-700">
                        <div
                          className="h-full rounded-full bg-gold-400 transition-all duration-300"
                          style={{ width: `${scorePct}%` }}
                        />
                      </div>
                      <div
                        className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${scorePct}%` }}
                      >
                        <div className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-gold-400 bg-white">
                          <div className="h-1.5 w-1.5 rounded-full bg-gold-400" />
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-between font-mono text-xs text-ink-4">
                      <span>0</span>
                      <span>200</span>
                      <span>400</span>
                      <span>600</span>
                      <span>800</span>
                      <span>1000</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col rounded-xl border border-[#e5e7eb] bg-white shadow-sm p-4 min-h-[140px]">
                <h2 className="text-base font-semibold text-ink-3">Net Worth</h2>
                <p className="font-mono text-3xl md:text-4xl font-bold text-ink-1 mt-5 tabular-nums">
                  {netWorth !== null
                    ? `$${netWorth.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
                    : "—"}
                </p>
              </div>
            </div>

            {/* Debt + Credit row */}
            <div className="flex items-stretch gap-3">
              <TotalDebtCard totalDebt={totalDebt} debtBreakdown={debtBreakdown} />
              <div className="flex-1 flex flex-col rounded-xl border border-[#e5e7eb] bg-white shadow-sm p-4 min-h-[180px]">
                <h2 className="text-base font-semibold text-ink-3 mb-2">Credit Score</h2>
                <div className="flex-1 flex items-center justify-center min-h-0">
                  <CreditScoreMeter score={creditScore} />
                </div>
              </div>
            </div>

            {/* Allocation chart */}
            <div className="flex-1 min-h-0 flex max-h-[320px]">
              <AllocationChart
                holdings={profile?.portfolio?.holdings ?? []}
                totalValueUSD={profile?.portfolio?.totals?.totalValueUSD ?? 0}
                className="flex-1 min-w-0"
              />
            </div>
          </div>

          {/* Right column: Insights */}
          <div className="flex w-[440px] flex-shrink-0">
            <div className="flex min-h-[320px] w-full flex-col gap-4 rounded-xl border border-[#e5e7eb] bg-white shadow-sm p-4">
              <h2 className="text-base font-semibold text-ink-2">
                Financial Health Insights
              </h2>
              <div className="space-y-4">
                {insights.length > 0 || portfolioInsights.length > 0 ? (
                  <>
                    <div>
                      <p className="text-xs font-medium text-ink-3 uppercase tracking-wider mb-2">
                        Insights
                      </p>
                      <ul className="space-y-2">
                        {insights.map((s, i) => (
                          <li key={i} className="flex gap-2 text-sm leading-relaxed text-ink-2">
                            <span className="text-gold-400 mt-px shrink-0">·</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {portfolioInsights.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-ink-3 uppercase tracking-wider mb-2">
                          Portfolio Insights
                        </p>
                        <ul className="space-y-2">
                          {portfolioInsights.map((s, i) => (
                            <li key={i} className="flex gap-2 text-sm leading-relaxed text-ink-2">
                              <span className="text-gold-400 mt-px shrink-0">·</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-medium text-ink-3 uppercase tracking-wider mb-2">
                        Action Items
                      </p>
                      <ul className="space-y-2">
                        {actionItems.map((s, i) => (
                          <li key={i} className="flex gap-2 text-sm leading-relaxed text-ink-2">
                            <span className="text-gold-400 mt-px shrink-0">→</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-ink-4">—</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Milestones */}
        <div className="mt-4">
          <MilestonesSection netWorth={netWorth ?? 0} />
        </div>
      </div>
    </div>
  );
}
