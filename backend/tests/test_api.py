"""API integration tests for FastAPI routes."""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_get_health_returns_ok():
    """GET /health returns {"ok": True}."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"ok": True}


def test_get_assets_returns_list():
    """GET /assets returns a list (may be empty if assets.json missing)."""
    response = client.get("/assets")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_post_portfolio_custom_returns_user_profile():
    """POST /portfolio/custom with holdings returns UserProfile with correct netWorthUSD."""
    response = client.post(
        "/portfolio/custom",
        json={"holdings": [{"assetId": "VTI", "valueUSD": 10000}]},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["netWorthUSD"] == 10000
    assert "portfolio" in data
    assert "holdings" in data["portfolio"]
    assert len(data["portfolio"]["holdings"]) == 1
    assert data["portfolio"]["holdings"][0]["assetId"] == "VTI"
    assert data["portfolio"]["holdings"][0]["valueUSD"] == 10000
