"""Shared pytest fixtures for backend tests."""

import pandas as pd
import pytest


@pytest.fixture
def sample_finance_df():
    """Sample DataFrame for finance module tests (no file I/O)."""
    return pd.DataFrame(
        {
            "VTI_Close": [100.0, 101.0, 102.0],
            "VTI_return": [0.01, 0.0099, 0.0],
            "BND_Close": [80.0, 80.5, 81.0],
            "BND_return": [0.00625, 0.0062, 0.0],
            "GSPC_return": [0.005, 0.002, -0.001],
            "BTC_return": [0.02, -0.01, 0.015],
        },
        index=pd.DatetimeIndex(["2020-01-01", "2020-01-02", "2020-01-03"]),
    )
