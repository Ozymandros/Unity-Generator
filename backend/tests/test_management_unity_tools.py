"""Tests for management discovery unity_tool_names."""

from __future__ import annotations

from unittest.mock import patch

from app.routers.management import get_all_config


def test_get_all_config_includes_unity_tool_names():
    with patch("app.agents.unity_mcp_plugin.get_unity_tool_names", return_value=["ping", "unity_light_create"]):
        payload = get_all_config()
    assert "unity_tool_names" in payload
    assert "ping" in payload["unity_tool_names"]
