import json
import os
from pathlib import Path
from typing import List, Dict

from dotenv import load_dotenv
from openai import OpenAI

from app.schemas import FinancialContext, RankedCard, CardCategory, ApprovalLikelihood

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
MODEL_ID = "gpt-4o-mini"


def _load_cards() -> list:
    path = Path(__file__).resolve().parent.parent.parent / "data" / "credit_cards.json"
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _build_card_prompt(context: FinancialContext, cards: list) -> str:
    user_parts = []
    if context.onboarding:
        o = context.onboarding
        user_parts.append(f"Credit score: {o.creditScore}")
        user_parts.append(f"Annual income: ${o.income:,.0f}")
        user_parts.append(f"Total debt: ${o.totalDebt:,.0f}")
        user_parts.append(f"Savings: ${o.savings:,.0f}")
        if o.debtBreakdown:
            breakdown = ", ".join(f"{d.category}: ${d.balanceUSD:,.0f}" for d in o.debtBreakdown)
            user_parts.append(f"Debt breakdown: {breakdown}")
    if context.portfolio:
        p = context.portfolio
        user_parts.append(f"Net worth: ${p.netWorthUSD:,.0f}")

    user_context = "\n".join(user_parts) if user_parts else "No financial context available."
    cards_json = json.dumps(cards, indent=2)

    return f"""USER PROFILE:
{user_context}

AVAILABLE CREDIT CARDS:
{cards_json}

For each card, determine:
1. matchScore (0-100): How well this card fits the user's financial profile, credit score, and likely spending patterns
2. approvalLikelihood:
   - "excellent" if creditScore >= creditScoreRequired + 50
   - "good" if creditScore >= creditScoreRequired + 20
   - "fair" if creditScore >= creditScoreRequired
   - "low" if creditScore < creditScoreRequired
3. aiReasoning: 1-2 sentences explaining why this card is or isn't a good fit for this specific user
4. highlights: exactly 3 most relevant highlights for this user (pick from the card's existing highlights list)

Return JSON with this structure:
{{"cards": [
  {{
    "id": "<card id>",
    "matchScore": <0-100>,
    "approvalLikelihood": "excellent|good|fair|low",
    "aiReasoning": "<1-2 sentences>",
    "highlights": ["<highlight 1>", "<highlight 2>", "<highlight 3>"]
  }}
]}}

Order cards by matchScore descending. Include all {len(cards)} cards."""


def rank_cards(context: FinancialContext) -> List[RankedCard]:
    """Rank all credit cards for a user using GPT-4o-mini. Returns sorted list by matchScore."""
    cards = _load_cards()
    prompt = _build_card_prompt(context, cards)

    response = client.chat.completions.create(
        model=MODEL_ID,
        messages=[
            {"role": "system", "content": "You are a financial advisor recommending credit cards. Always return valid JSON."},
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
    )

    raw = json.loads(response.choices[0].message.content)
    card_lookup = {c["id"]: c for c in cards}

    result = []
    for item in raw.get("cards", []):
        card_id = item.get("id")
        if card_id not in card_lookup:
            continue
        static = card_lookup[card_id]
        try:
            result.append(RankedCard(
                id=card_id,
                name=static["name"],
                issuer=static["issuer"],
                annualFee=static["annualFee"],
                rewardsSummary=static["rewardsSummary"],
                categories=[CardCategory(c) for c in static["categories"]],
                approvalLikelihood=ApprovalLikelihood(item["approvalLikelihood"]),
                matchScore=int(item["matchScore"]),
                aiReasoning=item["aiReasoning"],
                highlights=item["highlights"][:3],
                creditScoreRequired=static["creditScoreRequired"],
            ))
        except (KeyError, ValueError):
            continue

    return result
