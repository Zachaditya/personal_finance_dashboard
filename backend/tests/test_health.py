"""Tests for services.agent.health module."""

import pytest

from services.agent.health import build_messages


def test_build_messages_with_empty_holdings():
    """build_messages with empty holdings includes context and holdings_str='None'."""
    user_data = {
        "income": 50000,
        "savings": 10000,
        "creditScore": 700,
        "totalDebt": 5000,
        "holdings": [],
    }
    messages = build_messages(user_data)
    assert len(messages) == 2
    assert messages[0]["role"] == "system"
    assert messages[1]["role"] == "user"
    content = messages[1]["content"]
    assert "50,000" in content or "50000" in content
    assert "10,000" in content or "10000" in content
    assert "700" in content
    assert "5,000" in content or "5000" in content
    assert "None" in content


def test_build_messages_with_holdings():
    """build_messages with holdings includes assetId and valueUSD in context."""
    user_data = {
        "income": 60000,
        "savings": 15000,
        "creditScore": 720,
        "totalDebt": 8000,
        "holdings": [
            {"assetId": "VTI", "valueUSD": 50000},
            {"assetId": "BND", "valueUSD": 20000},
        ],
    }
    messages = build_messages(user_data)
    assert len(messages) == 2
    content = messages[1]["content"]
    assert "VTI" in content
    assert "50000" in content or "50,000" in content
    assert "BND" in content
    assert "20000" in content or "20,000" in content


def test_build_messages_returns_system_and_user():
    """build_messages returns list with system and user messages."""
    user_data = {"income": 0, "savings": 0, "creditScore": 0, "totalDebt": 0, "holdings": []}
    messages = build_messages(user_data)
    assert isinstance(messages, list)
    assert len(messages) >= 2
    assert messages[0]["role"] == "system"
    assert "system" in messages[0]["content"].lower() or len(messages[0]["content"]) > 0
    assert messages[1]["role"] == "user"
