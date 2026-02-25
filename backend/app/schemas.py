from __future__ import annotations

from datetime import date
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


class CustomPortfolioRequest(BaseModel):
    holdings: List[CustomHolding]
