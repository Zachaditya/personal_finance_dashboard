"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FinancialContext, OnboardingData } from "../../lib/types";
import { AdvisorChat } from "./AdvisorChat";
import { CardRecommendations } from "./CardRecommendations";

type Tab = "chat" | "cards";

function ContextStatusBadge({ context }: { context: FinancialContext }) {
  if (context.onboarding) {
    return (
      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gold-400/10 px-3 py-1 text-xs font-medium text-gold-400 ring-1 ring-gold-400/20">
        <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
        Financial profile loaded
      </div>
    );
  }
  return (
    <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-400 ring-1 ring-yellow-500/20">
      <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
      No profile yet —{" "}
      <Link href="/" className="underline underline-offset-2 hover:text-yellow-300 transition-colors">
        complete onboarding
      </Link>{" "}
      for personalized advice
    </div>
  );
}

export function AdvisorShell() {
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [financialContext, setFinancialContext] = useState<FinancialContext>({
    onboarding: null,
    portfolio: null,
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem("onboarding");
      if (raw) {
        const parsed = JSON.parse(raw) as OnboardingData;
        setFinancialContext((prev) => ({ ...prev, onboarding: parsed }));
      }
    } catch { /* ignore */ }
  }, []);

  return (
    <div className="min-h-screen bg-navy-950">
      <main className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-ink-1 tracking-tight">
            AI Financial Advisor
          </h1>
          <p className="mt-1 text-sm text-ink-3">
            Personalized recommendations powered by your financial profile.
          </p>
          <ContextStatusBadge context={financialContext} />
        </header>

        {/* Tab switcher */}
        <div className="flex gap-1 mb-6 rounded-xl bg-navy-800 border border-[#e5e7eb] p-1 w-fit">
          {(
            [
              { key: "chat", label: "AI Chat" },
              { key: "cards", label: "Card Recommendations" },
            ] as { key: Tab; label: string }[]
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === key
                  ? "bg-gold-400/10 text-gold-400 ring-1 ring-gold-400/20"
                  : "text-ink-3 hover:text-ink-2"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "chat" && <AdvisorChat context={financialContext} />}
        {activeTab === "cards" && <CardRecommendations context={financialContext} />}
      </main>
    </div>
  );
}
