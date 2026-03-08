from __future__ import annotations

from datetime import date
from enum import Enum
from typing import Literal, Optional, List
from pydantic import BaseModel, Field


AssetClass = Literal["cash", "stocks", "bonds", "crypto"]


class Asset(BaseModel):
    assetId: str
    name: str
    assetClass: AssetClass
    ticker: Optional[str] = None


class Holding(BaseModel):
    assetId: str
    name: str
    assetClass: AssetClass
    ticker: Optional[str] = None
    valueUSD: float = Field(ge=0)


class Totals(BaseModel):
    totalValueUSD: float = Field(ge=0)


class AllocationApprox(BaseModel):
    cash: float = Field(ge=0, le=1)
    stocks: float = Field(ge=0, le=1)
    bonds: float = Field(ge=0, le=1)
    crypto: float = Field(ge=0, le=1)



class Portfolio(BaseModel):
    name: str
    notes: str = ""
    holdings: List[Holding]
    totals: Totals
    allocationApprox: AllocationApprox


class UserProfile(BaseModel):
    userId: str
    name: str
    asOf: date
    baseCurrency: str = "USD"
    netWorthUSD: float
    portfolio: Portfolio


class PricePoint(BaseModel):
    date: str
    valueUSD: float


class PortfolioPriceHistory(BaseModel):
    data: List[PricePoint]
    sp500: Optional[List[PricePoint]] = None  # Simulated S&P 500 investment (same initial value)
    bitcoin: Optional[List[PricePoint]] = None  # Simulated Bitcoin investment (same initial value)


class CustomHolding(BaseModel):
    assetId: str
    valueUSD: float = Field(ge=0)


class DebtBreakdownItem(BaseModel):
    category: str
    balanceUSD: float = Field(ge=0)


class CustomPortfolioRequest(BaseModel):
    holdings: List[CustomHolding]


# --- Advisor feature schemas ---

class FinancialContextOnboarding(BaseModel):
    income: float
    savings: float
    creditScore: int
    totalDebt: float
    debtBreakdown: List[DebtBreakdownItem] = Field(default_factory=list)


class FinancialContextHolding(BaseModel):
    name: str
    assetClass: str
    valueUSD: float


class FinancialContextPortfolio(BaseModel):
    netWorthUSD: float
    holdings: List[FinancialContextHolding]
    allocationApprox: AllocationApprox


class FinancialContext(BaseModel):
    onboarding: Optional[FinancialContextOnboarding] = None
    portfolio: Optional[FinancialContextPortfolio] = None


class ChatMessageSchema(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class AdvisorChatRequest(BaseModel):
    message: str
    history: List[ChatMessageSchema] = Field(default_factory=list)
    context: FinancialContext


class AdvisorChatResponse(BaseModel):
    reply: str


class CardCategory(str, Enum):
    travel = "travel"
    cashback = "cashback"
    dining = "dining"
    gas = "gas"
    groceries = "groceries"
    business = "business"
    student = "student"
    balance_transfer = "balance-transfer"


class ApprovalLikelihood(str, Enum):
    excellent = "excellent"
    good = "good"
    fair = "fair"
    low = "low"


class RankedCard(BaseModel):
    id: str
    name: str
    issuer: str
    annualFee: float
    rewardsSummary: str
    categories: List[CardCategory]
    approvalLikelihood: ApprovalLikelihood
    matchScore: int = Field(ge=0, le=100)
    aiReasoning: str
    highlights: List[str]
    creditScoreRequired: int


class AdvisorCardsRequest(BaseModel):
    context: FinancialContext


class AdvisorCardsResponse(BaseModel):
    cards: List[RankedCard]


class OnboardingSubmitRequest(BaseModel):
    income: float
    savings: float
    creditScore: int
    totalDebt: float
    holdings: List[CustomHolding]
    debtBreakdown: List[DebtBreakdownItem] = Field(default_factory=list)


class OnboardingSubmitResponse(BaseModel):
    profile: UserProfile
    portfolioScore: int
    netWorthUSD: float
    insights: List[str]
    actionItems: List[str]
    portfolioInsights: List[str]
