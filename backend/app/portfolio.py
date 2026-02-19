import json
from pathlib import Path
from typing import Union

import numpy as np

from .finance import get_returns
from .schemas import PortfolioPriceHistory, PricePoint, UserProfile


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


def load_user_profile(user_id: str = "user_001") -> UserProfile:
    """
    Load a user profile from JSON data.
    Looks for {user_id}.json in data/; falls back to test_user.json if not found.
    """
    filepath = _get_data_dir() / f"{user_id}.json"
    if not filepath.exists():
        filepath = _get_data_dir() / "test_user.json"

    data = load_json_file(filepath)

    portfolio = data.get("portfolio", {})
    totals = portfolio.get("totals", {})

    # Derive netWorthUSD from totals (or compute from holdings if you prefer)
    data["netWorthUSD"] = float(totals.get("totalValueUSD", 0.0))

    # Safe defaults
    data.setdefault("baseCurrency", "USD")
    data.setdefault("name", data.get("userId", "User"))

    return UserProfile.model_validate(data)


def get_portfolio_price_history(user_id: str) -> PortfolioPriceHistory:
    """Return portfolio value over time for charting."""
    profile = load_user_profile(user_id)
    total_value = profile.portfolio.totals.totalValueUSD

    returns_df = get_returns()

    # Build weight map: asset_id -> weight (skip CASH_USD, no CSV column)
    weights: dict[str, float] = {}
    for h in profile.portfolio.holdings:
        col = f"{h.assetId}_return"
        if col in returns_df.columns:
            weights[col] = h.valueUSD / total_value

    # Weighted daily portfolio return
    aligned = returns_df[list(weights.keys())].fillna(0.0)
    weight_arr = np.array([weights[c] for c in aligned.columns])
    daily_returns = aligned.values @ weight_arr

    # Cumulative growth factor, scaled so the last value equals current portfolio value
    cum_growth = np.cumprod(1 + daily_returns)
    cum_values = total_value / cum_growth[-1] * cum_growth

    data = [
        PricePoint(date=str(d.date()), valueUSD=round(float(v), 2))
        for d, v in zip(aligned.index, cum_values)
    ]
    return PortfolioPriceHistory(data=data)
