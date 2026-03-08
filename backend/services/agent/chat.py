import os
from typing import List, Dict

from dotenv import load_dotenv
from openai import OpenAI

from app.schemas import AdvisorChatRequest, FinancialContext

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
MODEL_ID = "gpt-4o-mini"


def _build_system_prompt(context: FinancialContext) -> str:
    lines = [
        "You are a personal financial advisor. Help users understand their financial health, make better decisions, and improve their situation.",
        "Be concise, friendly, and specific to the user's situation. Stay focused on personal finance topics.",
        "",
        "USER FINANCIAL CONTEXT:",
    ]

    if context.onboarding:
        o = context.onboarding
        lines.append(f"- Annual income: ${o.income:,.0f}")
        lines.append(f"- Savings: ${o.savings:,.0f}")
        lines.append(f"- Credit score: {o.creditScore}")
        lines.append(f"- Total debt: ${o.totalDebt:,.0f}")
        if o.debtBreakdown:
            breakdown = ", ".join(
                f"{d.category}: ${d.balanceUSD:,.0f}" for d in o.debtBreakdown
            )
            lines.append(f"- Debt breakdown: {breakdown}")

    if context.portfolio:
        p = context.portfolio
        lines.append(f"- Net worth: ${p.netWorthUSD:,.0f}")
        a = p.allocationApprox
        lines.append(
            f"- Portfolio allocation: {a.cash*100:.0f}% cash, {a.stocks*100:.0f}% stocks, "
            f"{a.bonds*100:.0f}% bonds, {a.crypto*100:.0f}% crypto"
        )
        if p.holdings:
            holdings_str = ", ".join(
                f"{h.name} (${h.valueUSD:,.0f})" for h in p.holdings
            )
            lines.append(f"- Holdings: {holdings_str}")

    if not context.onboarding and not context.portfolio:
        lines.append("No financial context available. Encourage the user to complete their financial profile.")

    lines += [
        "",
        "If a question is unrelated to personal finance, politely redirect the conversation.",
    ]

    return "\n".join(lines)


def advisor_chat(request: AdvisorChatRequest) -> str:
    """Multi-turn financial advisor chat. Returns assistant reply as plain text."""
    system_prompt = _build_system_prompt(request.context)

    messages: List[Dict[str, str]] = [{"role": "system", "content": system_prompt}]

    for msg in request.history:
        messages.append({"role": msg.role, "content": msg.content})

    messages.append({"role": "user", "content": request.message})

    response = client.chat.completions.create(
        model=MODEL_ID,
        messages=messages,
    )

    return response.choices[0].message.content
