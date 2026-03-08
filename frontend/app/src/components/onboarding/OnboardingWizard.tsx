"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { postOnboardingSubmit } from "../../lib/api";
import { IncomeStep } from "./IncomeStep";
import { SavingsStep } from "./SavingsStep";
import { CreditScoreStep } from "./CreditScoreStep";
import { DebtStep } from "./DebtStep";
import { DebtCategoriesStep } from "./DebtCategoriesStep";
import { AssetsStep } from "./AssetsStep";
import { HasPortfolioStep } from "./HasPortfolioStep";

export type OnboardingFormData = {
  income: number;
  savings: number;
  creditScore: number;
  totalDebt: number;
  debtBreakdown: { category: string; balanceUSD: number }[];
};

const QUIZ_STEPS = ["Income", "Savings", "Credit Score", "Debt", "Debt Breakdown", "Portfolio?", "Assets"] as const;
const TOTAL_STEPS = QUIZ_STEPS.length;

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(-1);
  const [formData, setFormData] = useState<OnboardingFormData>({
    income: 0,
    savings: 0,
    creditScore: 0,
    totalDebt: 0,
    debtBreakdown: [],
  });

  useEffect(() => {
    try {
      if (localStorage.getItem("onboarding")) {
        router.replace("/health");
      }
    } catch { /* ignore */ }
  }, [router]);

  const goNext = () => setStep((s) => (s < TOTAL_STEPS - 1 ? s + 1 : s));
  const goBack = () => setStep((s) => (s > 0 ? s - 1 : s));

  const handleDebtBreakdown = (breakdown: { category: string; balanceUSD: number }[]) => {
    const computedTotal = breakdown.reduce((sum, item) => sum + item.balanceUSD, 0);
    setFormData((d) => ({
      ...d,
      debtBreakdown: breakdown,
      totalDebt: breakdown.length > 0 ? computedTotal : d.totalDebt,
    }));
    goNext();
  };

  const handleNoPortfolio = () => handleFinish([]);
  const handleYesPortfolio = () => goNext();

  const handleFinish = async (holdings: { assetId: string; valueUSD: number }[]) => {
    const filteredHoldings = holdings.filter((h) => h.valueUSD > 0);
    try {
      const result = await postOnboardingSubmit({ ...formData, holdings: filteredHoldings });
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("onboarding", JSON.stringify(formData));
          localStorage.setItem("onboardingResult", JSON.stringify(result));
        } catch { /* ignore */ }
      }
    } catch {
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("onboarding", JSON.stringify(formData));
        } catch { /* ignore */ }
      }
    }
    const pairs = filteredHoldings.map((h) => `${encodeURIComponent(h.assetId)}:${h.valueUSD}`);
    const hParam = pairs.join(",");
    if (typeof window !== "undefined" && hParam) {
      try { localStorage.setItem("lastHoldings", hParam); } catch { /* ignore */ }
    }
    router.push(`/pdashboard?h=${hParam}`);
  };

  // Welcome screen
  if (step === -1) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-navy-950">
        <div className="w-full max-w-lg text-center space-y-8">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-gold-400/10 ring-1 ring-gold-400/20 flex items-center justify-center">
            <span className="text-gold-400 text-3xl leading-none">◈</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-semibold text-ink-1 tracking-tight">
              Let&apos;s build your<br />financial picture
            </h1>
            <p className="text-ink-3 text-base leading-relaxed max-w-sm mx-auto">
              Answer a few quick questions about your finances, then tell us what you hold.
              We&apos;ll build your personal dashboard in seconds.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {QUIZ_STEPS.map((label, i) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full bg-navy-800 px-3 py-1.5 text-xs font-medium text-ink-3 ring-1 ring-[#e5e7eb]"
              >
                <span className="text-gold-400 font-bold">{i + 1}</span>
                {label}
              </span>
            ))}
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setStep(0)}
              className="inline-flex items-center gap-2 rounded-xl bg-gold-400 hover:bg-gold-300 px-8 py-3.5 text-base font-semibold text-white transition-colors shadow-lg shadow-gold-400/20"
            >
              Get started
              <span>→</span>
            </button>
            <p className="text-xs text-ink-4">Takes about 2 minutes</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-navy-950">
      <div className={`w-full ${step === 6 ? "max-w-2xl" : "max-w-md"} space-y-6`}>

        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gold-400/10 text-gold-400 text-xs font-bold ring-1 ring-gold-400/20">
              {step + 1}
            </span>
            <span className="text-xs font-medium text-ink-4 uppercase tracking-widest">
              Question {step + 1} of {TOTAL_STEPS}
            </span>
          </div>
          <div className="h-0.5 w-full rounded-full bg-navy-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gold-400 transition-all duration-500 ease-out"
              style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-lg">
          {step === 0 && (
            <IncomeStep
              value={formData.income}
              onChange={(v) => setFormData((d) => ({ ...d, income: v }))}
              onNext={goNext}
            />
          )}
          {step === 1 && (
            <SavingsStep
              value={formData.savings}
              onChange={(v) => setFormData((d) => ({ ...d, savings: v }))}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {step === 2 && (
            <CreditScoreStep
              value={formData.creditScore}
              onChange={(v) => setFormData((d) => ({ ...d, creditScore: v }))}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {step === 3 && (
            <DebtStep
              value={formData.totalDebt}
              onChange={(v) => setFormData((d) => ({ ...d, totalDebt: v }))}
              onSubmit={goNext}
              onBack={goBack}
            />
          )}
          {step === 4 && (
            <DebtCategoriesStep
              onSubmit={handleDebtBreakdown}
              onBack={goBack}
            />
          )}
          {step === 5 && (
            <HasPortfolioStep
              onYes={handleYesPortfolio}
              onNo={handleNoPortfolio}
              onBack={goBack}
            />
          )}
          {step === 6 && (
            <AssetsStep
              onSubmit={handleFinish}
              onBack={goBack}
            />
          )}
        </div>

      </div>
    </div>
  );
}
