"""Tests for services.portfolio module."""

import numpy as np
import pandas as pd
import pytest

from app.schemas import CustomHolding, CustomPortfolioRequest, OnboardingSubmitRequest
from services.portfolio import (
    _compute_benchmark,
    build_custom_profile,
    process_onboarding_submission,
)


def test_compute_benchmark_returns_correct_price_points():
    """_compute_benchmark returns PricePoints with correct values for given returns."""
    index = pd.DatetimeIndex(["2020-01-01", "2020-01-02"])
    # returns [0, 0.1]: cum_growth=[1, 1.1], values=100*[1,1.1]/1=[100, 110]
    returns = np.array([0.0, 0.1])
    result = _compute_benchmark(100.0, index, returns)
    assert len(result) == 2
    assert result[0].date == "2020-01-01"
    assert result[0].valueUSD == 100.0
    assert result[1].date == "2020-01-02"
    assert result[1].valueUSD == 110.0


def test_compute_benchmark_with_zero_returns():
    """_compute_benchmark with zero returns keeps value constant."""
    index = pd.DatetimeIndex(["2020-01-01", "2020-01-02"])
    returns = np.array([0.0, 0.0])
    result = _compute_benchmark(50.0, index, returns)
    assert len(result) == 2
    assert result[0].valueUSD == 50.0
    assert result[1].valueUSD == 50.0


def test_build_custom_profile_empty_holdings():
    """build_custom_profile with empty holdings returns netWorthUSD=0, allocation zeros."""
    request = CustomPortfolioRequest(holdings=[])
    profile = build_custom_profile(request)
    assert profile.netWorthUSD == 0.0
    assert profile.portfolio.allocationApprox.cash == 0.0
    assert profile.portfolio.allocationApprox.stocks == 0.0
    assert profile.portfolio.allocationApprox.bonds == 0.0
    assert profile.portfolio.allocationApprox.crypto == 0.0


def test_build_custom_profile_single_holding():
    """build_custom_profile with single VTI holding returns correct netWorth and allocation."""
    request = CustomPortfolioRequest(holdings=[CustomHolding(assetId="VTI", valueUSD=50000)])
    profile = build_custom_profile(request)
    assert profile.netWorthUSD == 50000.0
    assert profile.portfolio.allocationApprox.stocks == 1.0
    assert profile.portfolio.allocationApprox.cash == 0.0
    assert len(profile.portfolio.holdings) == 1
    assert profile.portfolio.holdings[0].assetId == "VTI"
    assert profile.portfolio.holdings[0].valueUSD == 50000


def test_build_custom_profile_two_holdings_allocation_sums_to_one():
    """build_custom_profile with two holdings returns allocation that sums to 1.0."""
    request = CustomPortfolioRequest(
        holdings=[
            CustomHolding(assetId="VTI", valueUSD=70000),
            CustomHolding(assetId="BND", valueUSD=30000),
        ]
    )
    profile = build_custom_profile(request)
    assert profile.netWorthUSD == 100000.0
    alloc = profile.portfolio.allocationApprox
    total_alloc = alloc.stocks + alloc.bonds + alloc.cash + alloc.crypto
    assert total_alloc == pytest.approx(1.0)
    assert alloc.stocks == pytest.approx(0.7)
    assert alloc.bonds == pytest.approx(0.3)


def test_process_onboarding_submission_computes_ratios():
    """process_onboarding_submission computes netWorth, debtToIncome, savingsRate correctly."""
    request = OnboardingSubmitRequest(
        income=100000.0,
        savings=20000.0,
        creditScore=700,
        totalDebt=10000.0,
        holdings=[],
    )
    result = process_onboarding_submission(request)
    assert result["netWorthUSD"] == 10000.0  # 0 portfolio + 20k savings - 10k debt
    assert result["debtToIncomeRatio"] == pytest.approx(0.1)
    assert result["savingsRate"] == pytest.approx(0.2)
    assert "profile" in result


def test_process_onboarding_submission_with_portfolio():
    """process_onboarding_submission includes portfolio value in net worth."""
    request = OnboardingSubmitRequest(
        income=100000.0,
        savings=10000.0,
        creditScore=700,
        totalDebt=5000.0,
        holdings=[CustomHolding(assetId="VTI", valueUSD=50000)],
    )
    result = process_onboarding_submission(request)
    # netWorth = portfolio (50k) + savings (10k) - debt (5k) = 55k
    assert result["netWorthUSD"] == 55000.0
    assert result["debtToIncomeRatio"] == pytest.approx(0.05)
    assert result["savingsRate"] == pytest.approx(0.1)
