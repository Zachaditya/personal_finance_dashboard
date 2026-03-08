"use client";

import { useEffect, useRef, useState } from "react";
import { postAdvisorCards } from "../../lib/api";
import type { FinancialContext, RankedCard } from "../../lib/types";
import { CardTile } from "./CardTile";

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 space-y-4 animate-pulse shadow-sm">
      <div className="flex justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-3 w-16 rounded bg-navy-800" />
          <div className="h-4 w-40 rounded bg-navy-800" />
          <div className="h-5 w-28 rounded-full bg-navy-800" />
        </div>
        <div className="h-14 w-14 rounded-full bg-navy-800 shrink-0" />
      </div>
      <div className="h-3 w-full rounded bg-navy-800" />
      <div className="h-3 w-3/4 rounded bg-navy-800" />
      <div className="flex gap-2">
        <div className="h-5 w-16 rounded-full bg-navy-800" />
        <div className="h-5 w-20 rounded-full bg-navy-800" />
      </div>
    </div>
  );
}

type Props = {
  context: FinancialContext;
};

export function CardRecommendations({ context }: Props) {
  const [cards, setCards] = useState<RankedCard[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    setLoading(true);
    postAdvisorCards({ context })
      .then((res) => setCards(res.cards))
      .catch(() => setError("Failed to load card recommendations. Please try again."))
      .finally(() => setLoading(false));
  }, [context]);

  if (loading) {
    return (
      <div className="space-y-4">
        <p className="text-xs text-ink-3 uppercase tracking-wider font-medium">
          Analyzing your profile…
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (!cards || cards.length === 0) return null;

  return (
    <div className="space-y-4">
      <p className="text-xs text-ink-3 uppercase tracking-wider font-medium">
        Top {cards.length} cards matched to your profile
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {cards.map((card) => (
          <CardTile key={card.id} card={card} />
        ))}
      </div>
      <p className="text-xs text-ink-4 pt-2">
        Card recommendations are AI-generated based on your financial profile and are for informational purposes only.
        Always review terms before applying.
      </p>
    </div>
  );
}
