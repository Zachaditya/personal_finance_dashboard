from pathlib import Path

import pandas as pd


def _get_data_dir() -> Path:
    """Return the path to the data directory (backend/data)."""
    return Path(__file__).resolve().parent.parent / "data"


def load_assets_csv(csv_path: str | Path = "assets_close_returns.csv") -> pd.DataFrame:
    """
    Load the assets Close and return data from CSV.
    Returns a DataFrame with Date index and columns like VTI_Close, VTI_return, etc.
    """
    path = Path(csv_path)
    if not path.is_absolute():
        path = _get_data_dir() / path
    df = pd.read_csv(path, index_col=0, parse_dates=True)
    return df


def get_closes(df: pd.DataFrame | None = None) -> pd.DataFrame:
    """Return only the Close columns from the assets CSV."""
    if df is None:
        df = load_assets_csv()
    close_cols = [c for c in df.columns if c.endswith("_Close")]
    return df[close_cols].copy()


def get_returns(df: pd.DataFrame | None = None) -> pd.DataFrame:
    """Return only the return columns from the assets CSV."""
    if df is None:
        df = load_assets_csv()
    return_cols = [c for c in df.columns if c.endswith("_return")]
    return df[return_cols].copy()


def get_sp500_returns(df: pd.DataFrame | None = None) -> pd.Series | None:
    """Return S&P 500 daily returns series, or None if not in CSV."""
    if df is None:
        df = load_assets_csv()
    for col in ("GSPC_return", "SP500_return"):
        if col in df.columns:
            return df[col].copy()
    return None


def get_btc_returns(df: pd.DataFrame | None = None) -> pd.Series | None:
    """Return Bitcoin daily returns series, or None if not in CSV."""
    if df is None:
        df = load_assets_csv()
    for col in ("BTC_return", "BTC-USD_return"):
        if col in df.columns:
            return df[col].copy()
    return None


def get_asset_data(asset_id: str, df: pd.DataFrame | None = None) -> pd.DataFrame:
    """Return Close and return columns for a single asset."""
    if df is None:
        df = load_assets_csv()
    cols = [f"{asset_id}_Close", f"{asset_id}_return"]
    if not all(c in df.columns for c in cols):
        available = [c.replace("_Close", "") for c in df.columns if c.endswith("_Close")]
        raise KeyError(f"Asset '{asset_id}' not found in CSV. Available: {available}")
    return df[cols].copy()
