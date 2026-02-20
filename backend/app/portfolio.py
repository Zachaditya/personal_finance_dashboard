import json
from pathlib import Path
from typing import Union

import numpy as np

from .finance import get_returns, get_sp500_returns
from .schemas import (
    AllocationApprox,
    Asset,
    CustomPortfolioRequest,
    Holding,
    Portfolio,
    PortfolioPriceHistory,
    PricePoint,
    Totals,
    UserProfile,
)


def _get_data_dir() -> Path:
    """Return the path to the data directory (apps/api/data)."""
    return Path(__file__).resolve().parent.parent / "data"


def load_json_file(filepath: Union[str, Path]) -> dict:
    """Load and parse a JSON file, returning the raw dict."""
    path = Path(filepath)
    if not path.is_absolute():
        path = _get_data_dir() / path
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def load_assets() -> list[Asset]:
    """Load the flat asset catalog from assets.json."""
    data = load_json_file("assets.json")
    return [Asset.model_validate(a) for a in data]


def _compute_sp500_benchmark(
    initial_value: float, index: "np.ndarray"
) -> list[PricePoint] | None:
    """Simulate S&P 500 investment from same initial value. Returns None if no GSPC/SP500 data."""
    sp500_returns = get_sp500_returns()
    if sp500_returns is None:
        return None
    # Align to portfolio dates
    aligned = sp500_returns.reindex(index).fillna(0.0)
    cum_growth = np.cumprod(1 + aligned.values)
    cum_values = initial_value * cum_growth / cum_growth[0]
    return [
        PricePoint(date=str(d.date()), valueUSD=round(float(v), 2))
        for d, v in zip(aligned.index, cum_values)
    ]




def _load_asset_metadata() -> dict[str, dict]:
    """Build {assetId: {name, assetClass, ticker}} lookup from assets.json."""
    assets = load_json_file("assets.json")
    meta: dict[str, dict] = {}
    for a in assets:
        meta[a["assetId"]] = {
            "name": a["name"],
            "assetClass": a["assetClass"],
            "ticker": a.get("ticker"),
        }
    return meta


def build_custom_profile(request: CustomPortfolioRequest) -> UserProfile:
    """Build a UserProfile from user-supplied holdings."""
    meta = _load_asset_metadata()
    holdings: list[Holding] = []
    total = 0.0

    for ch in request.holdings:
        info = meta.get(ch.assetId, {
            "name": ch.assetId,
            "assetClass": "stocks",
            "ticker": ch.assetId,
        })
        holdings.append(Holding(
            assetId=ch.assetId,
            name=info["name"],
            assetClass=info["assetClass"],
            ticker=info.get("ticker"),
            valueUSD=ch.valueUSD,
        ))
        total += ch.valueUSD

    # Compute allocation percentages
    alloc = {"cash": 0.0, "stocks": 0.0, "bonds": 0.0, "crypto": 0.0}
    if total > 0:
        for h in holdings:
            alloc[h.assetClass] += h.valueUSD / total

    return UserProfile(
        userId="custom",
        name="Custom Portfolio",
        asOf=__import__("datetime").date.today(),
        baseCurrency="USD",
        netWorthUSD=total,
        portfolio=Portfolio(
            name="Custom Portfolio",
            holdings=holdings,
            totals=Totals(totalValueUSD=total),
            allocationApprox=AllocationApprox(**alloc),
        ),
    )


def get_custom_price_history(request: CustomPortfolioRequest) -> PortfolioPriceHistory:
    """Return portfolio price history for custom holdings."""
    profile = build_custom_profile(request)
    total_value = profile.portfolio.totals.totalValueUSD

    if total_value == 0:
        return PortfolioPriceHistory(data=[])

    returns_df = get_returns()

    weights: dict[str, float] = {}
    for h in profile.portfolio.holdings:
        col = f"{h.assetId}_return"
        if col in returns_df.columns:
            weights[col] = h.valueUSD / total_value

    if not weights:
        return PortfolioPriceHistory(data=[])

    aligned = returns_df[list(weights.keys())].fillna(0.0)
    weight_arr = np.array([weights[c] for c in aligned.columns])
    daily_returns = aligned.values @ weight_arr

    cum_growth = np.cumprod(1 + daily_returns)
    cum_values = total_value / cum_growth[-1] * cum_growth

    data = [
        PricePoint(date=str(d.date()), valueUSD=round(float(v), 2))
        for d, v in zip(aligned.index, cum_values)
    ]
    sp500 = _compute_sp500_benchmark(total_value, aligned.index)
    return PortfolioPriceHistory(data=data, sp500=sp500)
