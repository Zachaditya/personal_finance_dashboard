"""Tests for app.finance module."""

import pandas as pd
import pytest

from app.finance import (
    get_asset_data,
    get_btc_returns,
    get_closes,
    get_returns,
    get_sp500_returns,
)


def test_get_closes_returns_only_close_columns(sample_finance_df):
    """get_closes returns only *_Close columns from a given DataFrame."""
    result = get_closes(sample_finance_df)
    assert "VTI_Close" in result.columns
    assert "BND_Close" in result.columns
    assert "VTI_return" not in result.columns
    assert "GSPC_return" not in result.columns
    assert len(result.columns) == 2


def test_get_returns_returns_only_return_columns(sample_finance_df):
    """get_returns returns only *_return columns from a given DataFrame."""
    result = get_returns(sample_finance_df)
    assert "VTI_return" in result.columns
    assert "BND_return" in result.columns
    assert "GSPC_return" in result.columns
    assert "BTC_return" in result.columns
    assert "VTI_Close" not in result.columns
    assert len(result.columns) == 4


def test_get_sp500_returns_returns_gspc_when_present(sample_finance_df):
    """get_sp500_returns returns GSPC_return or SP500_return when present."""
    result = get_sp500_returns(sample_finance_df)
    assert result is not None
    assert len(result) == 3
    assert result.iloc[0] == pytest.approx(0.005)


def test_get_sp500_returns_prefers_gspc_over_sp500():
    """get_sp500_returns prefers GSPC_return over SP500_return."""
    df = pd.DataFrame(
        {"GSPC_return": [0.01], "SP500_return": [0.02]},
        index=pd.DatetimeIndex(["2020-01-01"]),
    )
    result = get_sp500_returns(df)
    assert result is not None
    assert result.iloc[0] == pytest.approx(0.01)


def test_get_sp500_returns_uses_sp500_when_gspc_missing():
    """get_sp500_returns uses SP500_return when GSPC_return not present."""
    df = pd.DataFrame(
        {"VTI_Close": [100], "VTI_return": [0.01], "SP500_return": [0.02]},
        index=pd.DatetimeIndex(["2020-01-01"]),
    )
    result = get_sp500_returns(df)
    assert result is not None
    assert result.iloc[0] == pytest.approx(0.02)


def test_get_sp500_returns_none_when_neither_present():
    """get_sp500_returns returns None when neither GSPC nor SP500 in columns."""
    df = pd.DataFrame(
        {"VTI_Close": [100], "VTI_return": [0.01]},
        index=pd.DatetimeIndex(["2020-01-01"]),
    )
    result = get_sp500_returns(df)
    assert result is None


def test_get_btc_returns_returns_btc_when_present(sample_finance_df):
    """get_btc_returns returns BTC_return or BTC-USD_return when present."""
    result = get_btc_returns(sample_finance_df)
    assert result is not None
    assert len(result) == 3
    assert result.iloc[0] == pytest.approx(0.02)


def test_get_btc_returns_none_when_not_present():
    """get_btc_returns returns None when no BTC column in DataFrame."""
    df = pd.DataFrame(
        {"VTI_Close": [100], "VTI_return": [0.01]},
        index=pd.DatetimeIndex(["2020-01-01"]),
    )
    result = get_btc_returns(df)
    assert result is None


def test_get_asset_data_returns_correct_columns(sample_finance_df):
    """get_asset_data returns Close and return columns for a known asset."""
    result = get_asset_data("VTI", sample_finance_df)
    assert "VTI_Close" in result.columns
    assert "VTI_return" in result.columns
    assert len(result.columns) == 2
    assert len(result) == 3


def test_get_asset_data_raises_key_error_for_unknown_asset(sample_finance_df):
    """get_asset_data raises KeyError for unknown asset."""
    with pytest.raises(KeyError) as exc_info:
        get_asset_data("UNKNOWN", sample_finance_df)
    assert "UNKNOWN" in str(exc_info.value)
    assert "not found" in str(exc_info.value).lower()
