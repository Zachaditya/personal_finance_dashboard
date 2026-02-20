import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import pandas as pd
import yfinance as yf


def _get_data_dir() -> Path:
    """Return the path to the data directory (backend/data)."""
    # Script lives at backend/data/scripts/fetchyfinance.py, so parent.parent = backend/data
    return Path(__file__).resolve().parent.parent


# S&P 500 ticker (added as benchmark)
SP500_TICKER = "^GSPC"

# yfinance ticker mapping for assets that need different symbols
_YF_TICKER_MAP = {
    "BRK.B": "BRK-B",
    "BTC": "BTC-USD",
    "ETH": "ETH-USD",
    "SOL": "SOL-USD",
    "LINK": "LINK-USD",
}



def _get_yf_ticker(asset_id: str, ticker: str | None) -> str | None:
    """Return the yfinance ticker for an asset, or None if not fetchable (e.g. cash)."""
    if ticker:
        return _YF_TICKER_MAP.get(asset_id, ticker)
    if asset_id == "CASH_USD":
        return None  # Cash has no price series
    return None


def _fetch_sp500_series(period: str) -> pd.DataFrame | None:
    """Fetch S&P 500 (^GSPC) Close and returns. Returns None if fetch fails."""
    data = yf.Ticker(SP500_TICKER).history(period=period)
    if data.empty:
        return None
    data.index = pd.to_datetime(data.index).tz_localize(None)
    data = data[["Close"]].copy()
    data["return"] = data["Close"].pct_change()
    data = data.dropna()
    data.columns = ["GSPC_Close", "GSPC_return"]
    return data


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


def _get_existing_asset_ids(csv_path: Path) -> set[str]:
    """Read the CSV header and return the set of asset IDs already present."""
    if not csv_path.exists():
        return set()
    df = pd.read_csv(csv_path, nrows=0)
    # Columns are like "VTI_Close", "VTI_return", "GSPC_Close", etc.
    return {c.rsplit("_", 1)[0] for c in df.columns if c != "Date"}


def _fetch_one(asset_id: str, ticker: str | None, period: str) -> tuple[str, pd.DataFrame] | None:
    """Fetch one asset; returns (asset_id, df) or None."""
    df = _fetch_asset_series(asset_id, ticker, period)
    return (asset_id, df) if df is not None else None


def create_assets_csv(
    json_path: str | Path = "assets.json",
    output_path: str | Path | None = None,
    period: str = "1y",
    append: bool = False,
    max_workers: int = 6,
) -> Path:
    """
    Create a CSV file with Close and return columns for all assets in assets.json.
    Saves to backend/data/ by default. Skips CASH_USD (no price data).

    If append=True, reads the existing CSV and only fetches tickers that are missing,
    then merges the new columns into the existing data.
    max_workers: number of parallel fetch threads (default 6).
    """
    if output_path is None:
        output_path = _get_data_dir() / "assets_close_returns.csv"
    out = Path(output_path)
    if not out.is_absolute():
        out = _get_data_dir() / out

    existing_ids = _get_existing_asset_ids(out) if append else set()
    if existing_ids:
        print(f"Already in CSV: {sorted(existing_ids)}")

    path = Path(json_path)
    if not path.is_absolute():
        path = _get_data_dir() / path
    with open(path, encoding="utf-8") as f:
        assets = json.load(f)

    # Build list of (asset_id, ticker) to fetch from the flat asset list
    to_fetch: list[tuple[str, str | None]] = []
    for asset in assets:
        aid = asset["assetId"]
        if aid not in existing_ids:
            to_fetch.append((aid, asset.get("ticker")))

    # Add S&P 500 (^GSPC) as benchmark if not already present
    if "GSPC" not in existing_ids:
        to_fetch.append(("GSPC", None))

    dfs: list[pd.DataFrame] = []

    def _do_fetch(item: tuple[str, str | None]) -> tuple[str, pd.DataFrame] | None:
        aid, ticker = item
        if aid == "GSPC":
            sp_df = _fetch_sp500_series(period)
            return ("GSPC", sp_df) if sp_df is not None else None
        return _fetch_one(aid, ticker, period)

    print(f"Fetching {len(to_fetch)} ticker(s) in parallel...")
    with ThreadPoolExecutor(max_workers=max_workers) as ex:
        futures = {ex.submit(_do_fetch, item): item for item in to_fetch}
        for future in as_completed(futures):
            result = future.result()
            if result is not None:
                aid, df = result
                dfs.append(df)
                print(f"  ✓ {aid}")

    if not dfs and not append:
        raise ValueError("No fetchable assets found in assets.json")

    if not dfs:
        print("No new tickers to fetch — CSV is already up to date.")
        return out

    new_data = pd.concat(dfs, axis=1)
    new_data = new_data.sort_index()

    # Merge with existing CSV if appending
    if append and existing_ids:
        existing_df = pd.read_csv(out, index_col="Date", parse_dates=True)
        combined = pd.concat([existing_df, new_data], axis=1)
    else:
        combined = new_data

    # Fill gaps from weekends/holidays: ffill Close, 0 for returns on non-trading days
    close_cols = [c for c in combined.columns if c.endswith("_Close")]
    ret_cols = [c for c in combined.columns if c.endswith("_return")]
    combined[close_cols] = combined[close_cols].ffill()
    combined[ret_cols] = combined[ret_cols].fillna(0)
    combined = combined.dropna(how="any")

    combined.to_csv(out)
    print(f"Saved {len(dfs)} new ticker(s) to {out}")
    return out


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Fetch asset data and create assets_close_returns.csv")
    parser.add_argument("--period", default="1y", help="Data period (e.g. 1y, 5y, max)")
    parser.add_argument("--json", default="assets.json", help="Assets JSON path")
    parser.add_argument("--append", action="store_true",
                        help="Only fetch new tickers and append to existing CSV")
    parser.add_argument("--workers", type=int, default=6,
                        help="Parallel fetch threads (default: 6)")
    args = parser.parse_args()

    out = create_assets_csv(
        json_path=args.json,
        period=args.period,
        append=args.append,
        max_workers=args.workers,
    )
    print(f"Done → {out}")