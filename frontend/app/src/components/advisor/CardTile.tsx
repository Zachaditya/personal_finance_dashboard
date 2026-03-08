"use client";

import { useState } from "react";
import type { RankedCard, CardCategory, ApprovalLikelihood } from "../../lib/types";

const APPROVAL_STYLES: Record<ApprovalLikelihood, string> = {
  excellent: "text-gold-400 bg-gold-400/10 ring-1 ring-gold-400/25",
  good: "text-blue-400 bg-blue-500/10 ring-1 ring-blue-500/20",
  fair: "text-yellow-400 bg-yellow-500/10 ring-1 ring-yellow-500/20",
  low: "text-red-400 bg-red-500/10 ring-1 ring-red-500/20",
};

const APPROVAL_LABELS: Record<ApprovalLikelihood, string> = {
  excellent: "Excellent Match",
  good: "Good Match",
  fair: "Fair Match",
  low: "Low Approval Odds",
};

const CATEGORY_STYLES: Record<CardCategory, string> = {
  travel: "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20",
  cashback: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
  dining: "bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20",
  gas: "bg-yellow-500/10 text-yellow-400 ring-1 ring-yellow-500/20",
  groceries: "bg-lime-500/10 text-lime-400 ring-1 ring-lime-500/20",
  business: "bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20",
  student: "bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20",
  "balance-transfer": "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20",
};

type Props = {
  card: RankedCard;
};

export function CardTile({ card }: Props) {
  const [expanded, setExpanded] = useState(false);
  const deg = Math.round(card.matchScore * 3.6);

  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 flex flex-col gap-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-ink-4 font-medium mb-0.5">{card.issuer}</p>
          <h3 className="text-sm font-semibold text-ink-1 leading-snug">{card.name}</h3>
          <span
            className={`mt-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${APPROVAL_STYLES[card.approvalLikelihood]}`}
          >
            {APPROVAL_LABELS[card.approvalLikelihood]}
          </span>
        </div>

        {/* Match score donut */}
        <div className="shrink-0 relative h-14 w-14">
          <div
            className="h-14 w-14 rounded-full"
            style={{
              background: `conic-gradient(#00b070 ${deg}deg, #e5e7eb 0deg)`,
            }}
          />
          <div className="absolute inset-[5px] rounded-full bg-navy-900 flex items-center justify-center">
            <span className="font-mono text-xs font-bold text-ink-1">{card.matchScore}</span>
          </div>
        </div>
      </div>

      {/* Rewards summary */}
      <p className="text-xs text-ink-3 leading-relaxed">{card.rewardsSummary}</p>

      {/* Categories + annual fee */}
      <div className="flex flex-wrap items-center gap-1.5">
        {card.categories.map((cat) => (
          <span
            key={cat}
            className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${CATEGORY_STYLES[cat]}`}
          >
            {cat === "balance-transfer" ? "Balance Transfer" : cat}
          </span>
        ))}
        <span
          className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            card.annualFee === 0
              ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
              : "bg-navy-800 text-ink-3 ring-1 ring-[#e5e7eb]"
          }`}
        >
          {card.annualFee === 0 ? "No Annual Fee" : `$${card.annualFee}/yr`}
        </span>
      </div>

      {/* Highlights */}
      <ul className="space-y-1">
        {card.highlights.slice(0, 3).map((h, i) => (
          <li key={i} className="flex gap-2 text-xs text-ink-3">
            <span className="text-gold-400 mt-px shrink-0">·</span>
            <span>{h}</span>
          </li>
        ))}
      </ul>

      {/* Why this card */}
      <div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-medium text-gold-400 hover:text-gold-300 transition-colors"
        >
          <span>{expanded ? "▾" : "▸"}</span>
          Why this card for you?
        </button>
        {expanded && (
          <p className="mt-2 text-xs text-ink-3 leading-relaxed italic border-l-2 border-gold-400/25 pl-3">
            {card.aiReasoning}
          </p>
        )}
      </div>
    </div>
  );
}
