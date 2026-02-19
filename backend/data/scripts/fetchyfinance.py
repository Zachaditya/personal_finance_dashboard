import json
from pathlib import Path

import pandas as pd
import yfinance as yf


def _get_data_dir() -> Path:
    """Return the path to the data directory (backend/data)."""
    return Path(__file__).resolve().parent.parent / "data"


# yfinance ticker mapping for assets that need different symbols
_YF_TICKER_MAP = {
    "BRK.B": "BRK-B",
    "BTC": "BTC-USD",
    "ETH": "ETH-USD",
}


def _get_yf_ticker(asset_id: str, ticker: str | None) -> str | None:
    """Return the yfinance ticker for an asset, or None if not fetchable (e.g. cash)."""
    if ticker:
        return _YF_TICKER_MAP.get(asset_id, ticker)
    if asset_id == "CASH_USD":
        return None  # Cash has no price series
    return None


def _fetch_asset_series(asset_id: str, ticker: str | None, period: str) -> pd.DataFrame | None:
    """Fetch Close and returns for one asset. Returns None for cash/non-fetchable assets."""
    yf_ticker = _get_yf_ticker(asset_id, ticker)
    if not yf_ticker:
        return None
    data = yf.Ticker(yf_ticker).history(period=period)
    if data.empty:
        return None
    data.index = pd.to_datetime(data.index).tz_localize(None)
    data = data[["Close"]].copy()
    data["return"] = data["Close"].pct_change()
    data = data.dropna()
    data.columns = [f"{asset_id}_Close", f"{asset_id}_return"]
    return data


def create_assets_csv(
    json_path: str | Path = "test_user.json",
    output_path: str | Path | None = None,
    period: str = "1y",
) -> Path:
    """
    Create a CSV file with Close and return columns for all assets in the JSON portfolio.
    Saves to backend/data/ by default. Skips CASH_USD (no price data).
    """
    path = Path(json_path)
    if not path.is_absolute():
        path = _get_data_dir() / path
    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    holdings = data["portfolio"]["holdings"]
    dfs: list[pd.DataFrame] = []

    for h in holdings:
        asset_id = h["assetId"]
        ticker = h.get("ticker")
        df = _fetch_asset_series(asset_id, ticker, period)
        if df is not None:
            dfs.append(df)

    if not dfs:
        raise ValueError("No fetchable assets found in portfolio")

    combined = pd.concat(dfs, axis=1)
    combined = combined.sort_index()

    if output_path is None:
        output_path = _get_data_dir() / "assets_close_returns.csv"
    out = Path(output_path)
    if not out.is_absolute():
        out = _get_data_dir() / out

    combined.to_csv(out)
    return out