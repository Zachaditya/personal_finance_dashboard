"""
Fetch S&P 500 (^GSPC) historical data from Yahoo Finance.
By default merges into assets_close_returns.csv. Use --output to save to a separate file.
"""

from pathlib import Path

import pandas as pd
import yfinance as yf

SP500_TICKER = "^GSPC"


def _get_data_dir() -> Path:
    """Return the path to the data directory (backend/data)."""
    return Path(__file__).resolve().parent.parent


def _fill_empty_cells(df: pd.DataFrame) -> None:
    """Fill gaps from weekends/holidays: ffill Close, 0 for returns on non-trading days."""
    close_cols = [c for c in df.columns if c.endswith("_Close")]
    ret_cols = [c for c in df.columns if c.endswith("_return")]
    df[close_cols] = df[close_cols].ffill()
    df[ret_cols] = df[ret_cols].fillna(0)
    df.dropna(how="any", inplace=True)


def fetch_sp500(
    period: str = "1y",
    output_path: str | Path | None = None,
    merge_into_assets: bool = True,
) -> Path:
    """
    Fetch S&P 500 data from Yahoo Finance.

    Args:
        period: yfinance period (e.g. "1y", "5y", "max")
        output_path: Output CSV path. If None and merge_into_assets, uses assets_close_returns.csv
        merge_into_assets: If True, merge S&P 500 into assets_close_returns.csv

    Returns:
        Path to the saved CSV file.
    """
    data = yf.Ticker(SP500_TICKER).history(period=period)
    if data.empty:
        raise ValueError(f"No data returned for {SP500_TICKER}")

    data.index = pd.to_datetime(data.index).tz_localize(None)
    data = data[["Close"]].copy()
    data["return"] = data["Close"].pct_change()
    data = data.dropna()
    data.columns = ["SP500_close", "SP500_return"]

    assets_path = _get_data_dir() / "assets_close_returns.csv"

    if merge_into_assets and assets_path.exists():
        # Merge into existing assets CSV
        existing = pd.read_csv(assets_path, index_col=0, parse_dates=True)
        existing = existing.drop(columns=["GSPC_Close", "GSPC_return"], errors="ignore")
        combined = existing.join(data, how="outer").sort_index()
        _fill_empty_cells(combined)
        combined.to_csv(assets_path)
        return assets_path

    if output_path is None:
        output_path = _get_data_dir() / "sp500_close_returns.csv"
    out = Path(output_path)
    if not out.is_absolute():
        out = _get_data_dir() / out

    # Single-asset DataFrame has no gaps, but ensure no NaNs
    data = data.dropna(how="any")
    data.to_csv(out)
    return out


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Fetch S&P 500 data from Yahoo Finance")
    parser.add_argument(
        "--period",
        default="1y",
        help="Data period (e.g. 1y, 5y, max)",
    )
    parser.add_argument(
        "--output",
        "-o",
        default=None,
        help="Output CSV path (default: merge into assets_close_returns.csv)",
    )
    parser.add_argument(
        "--no-merge",
        action="store_true",
        help="Save to separate file instead of merging into assets CSV",
    )
    args = parser.parse_args()

    merge = not args.no_merge and args.output is None
    path = fetch_sp500(
        period=args.period,
        output_path=args.output,
        merge_into_assets=merge,
    )
    print(f"Saved S&P 500 data to {path}")
