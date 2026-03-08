import json
from pathlib import Path

from dotenv import load_dotenv
import os
from pydantic import BaseModel, Field
from openai import OpenAI
from typing import List, Optional, Dict, Any

load_dotenv()

# ---------------------------OPENAI KEY AND MODELS---------------------------------
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY)

# ---------------------------MODEL IDS---------------------------------
MODEL_ID = "gpt-4o-mini"

# ---------------------------USER DATA---------------------------------
def _get_data_dir() -> Path:
    """Return the path to the data directory (backend/data)."""
    return Path(__file__).resolve().parent.parent.parent / "data"


def get_user_onboarding_responses() -> dict | None:
    """Read and return onboarding quiz responses from user_onboarding.json, or None if missing."""
    path = _get_data_dir() / "user_onboarding.json"
    if not path.exists():
        return None
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def generate_response(messages: List[Dict[str, str]]) -> str:
    response = client.chat.completions.create(
        model=MODEL_ID,
        messages=messages,
        response_format={"type": "json_object"},
    )
    return response.choices[0].message.content


SYSTEM_PROMPT = """
You are a financial advisor evaluating a user's financial health.

CONTEXT:
You are given a user's financial profile, including their income, savings, credit score, total debt, and portfolio holdings (optional). You will compute a portfolio score, provide 3 insights, and 3 action items.

PRIMARY OBJECTIVES:
- Compute a portfolioScore (integer 0-1000) based on the user's overall financial health.
- Provide exactly 3 concise insights as a list of strings (observations about their current state).
- Provide exactly 3 specific action items as a list of strings (concrete next steps to improve).

PORTFOLIO SCORE CRITERIA:
- Higher credit score → higher score contribution
- Lower debt-to-income ratio → higher score contribution
- Higher savings rate → higher score contribution
- Diversified portfolio holdings → higher score contribution
- Score 0-400: poor, 401-650: fair, 651-800: good, 801-1000: excellent

INSIGHTS (exactly 3):
- Comment on debt-to-income ratio and whether it's healthy
- Note savings rate relative to income
- Highlight portfolio concentration, diversification, or lack of holdings

ACTION ITEMS (exactly 3):
- Specific, actionable steps the user can take to improve their financial position
- Each should be one clear sentence (e.g., "Pay down high-interest debt first" or "Aim to save 20% of income monthly")

PORTFOLIO INSIGHTS (exactly 3):
- Comment on the user's portfolio holdings, diversification, and concentration
- Comment on any relevant news/trends to some of the user's holdings
- Suggest portfolio adjustments or allocation improvements based on their holdings

RESPONSE FORMAT:
Return valid JSON with exactly these keys:
{
  "portfolioScore": <integer 0-1000>,
  "insights": [<string>, <string>, <string>],
  "actionItems": [<string>, <string>, <string>],
  "portfolioInsights": [<string>, <string>, <string>]
}
"""


def build_messages(user_data: dict) -> List[Dict[str, str]]:
    """Build the messages for the OpenAI API from a flat user_data dict."""
    holdings = user_data.get("holdings", [])
    if holdings:
        holdings_str = ", ".join(
            f"{h['assetId']}: ${h['valueUSD']:,.0f}" for h in holdings
        )
    else:
        holdings_str = "None"

    income = user_data.get("income", 0)
    savings = user_data.get("savings", 0)
    total_debt = user_data.get("totalDebt", 0)
    credit_score = user_data.get("creditScore", 0)

    debt_breakdown = user_data.get("debtBreakdown", [])
    if debt_breakdown:
        breakdown_str = ", ".join(
            f"{item['category']}: ${item['balanceUSD']:,.0f}" for item in debt_breakdown
        )
    else:
        breakdown_str = "not provided"

    context = (
        f"Income: ${income:,.0f}, "
        f"Savings: ${savings:,.0f}, "
        f"Credit Score: {credit_score}, "
        f"Total Debt: ${total_debt:,.0f} (Breakdown — {breakdown_str}), "
        f"Portfolio Holdings: {holdings_str}"
    )

    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": context},
    ]


def analyze_health(user_data: dict) -> dict:
    """Call OpenAI and return portfolioScore, insights, and actionItems parsed from JSON response."""
    messages = build_messages(user_data)
    raw = generate_response(messages)
    try:
        parsed = json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        parsed = {}

    insights = [str(s) for s in parsed.get("insights", [])][:3]
    action_items = [str(s) for s in parsed.get("actionItems", [])][:3]
    portfolio_insights = [str(s) for s in parsed.get("portfolioInsights", [])][:3]

    return {
        "portfolioScore": max(0, min(1000, int(parsed.get("portfolioScore", 500)))),
        "insights": insights,
        "actionItems": action_items,
        "portfolioInsights": portfolio_insights,
    }
