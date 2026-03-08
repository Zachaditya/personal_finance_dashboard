"use client";

import React from "react";

type HasPortfolioStepProps = {
  onYes: () => void;
  onNo: () => void;
  onBack: () => void;
};

export function HasPortfolioStep({ onYes, onNo, onBack }: HasPortfolioStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="text-xl font-semibold text-ink-1">
          Do you have an investment portfolio?
        </h2>
        <p className="text-sm text-ink-3">
          Stocks, bonds, crypto, or other assets you currently hold.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onYes}
          className="w-full rounded-xl border border-gold-400/30 bg-gold-400/8 hover:bg-gold-400/12 hover:border-gold-400/50 px-5 py-4 text-left transition-colors"
        >
          <span className="block text-base font-semibold text-gold-400">Yes, I do</span>
          <span className="block text-xs text-ink-3 mt-0.5">I&apos;ll enter my current holdings</span>
        </button>

        <button
          type="button"
          onClick={onNo}
          className="w-full rounded-xl border border-[#e5e7eb] bg-navy-800 hover:bg-navy-700 hover:border-[#d1d5db] px-5 py-4 text-left transition-colors"
        >
          <span className="block text-base font-semibold text-ink-2">No, not yet</span>
          <span className="block text-xs text-ink-3 mt-0.5">Skip this step and go to my dashboard</span>
        </button>
      </div>

      <button
        type="button"
        onClick={onBack}
        className="text-xs text-ink-4 hover:text-ink-3 transition-colors"
      >
        ← Back
      </button>
    </div>
  );
}
