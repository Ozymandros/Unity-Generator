from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.agents.unity_mcp_plugin import create_unity_mcp_plugin, unity_mcp_plugin_available_for_writing


@pytest.mark.asyncio
async def test_unity_mcp_pluginwrapper_create_initialize_and_cleanup() -> None:
    """Ensure wrapper creates plugin via local package and performs lifecycle calls."""
    mock_plugin = MagicMock()
    mock_plugin.initialize = AsyncMock()
    mock_plugin.cleanup = AsyncMock()

    with patch("app.agents.unity_mcp_plugin.UnityMCPPlugin.create", return_value=mock_plugin) as mock_create:
        async with create_unity_mcp_plugin() as plugin:
            assert plugin is mock_plugin
        mock_create.assert_called_once()
        mock_plugin.initialize.assert_awaited_once()
        mock_plugin.cleanup.assert_awaited_once()


@pytest.mark.asyncio
async def test_unity_mcp_pluginwrapper_error_propagates() -> None:
    """Ensure initialization errors are not swallowed by wrapper context manager."""
    mock_plugin = MagicMock()
    mock_plugin.initialize = AsyncMock(side_effect=RuntimeError("boom"))
    mock_plugin.cleanup = AsyncMock()

    with patch("app.agents.unity_mcp_plugin.UnityMCPPlugin.create", return_value=mock_plugin):
        with pytest.raises(RuntimeError, match="boom"):
            async with create_unity_mcp_plugin():
                pass
    mock_plugin.cleanup.assert_not_awaited()


def test_unity_mcp_plugin_available_for_writing_false_on_failure() -> None:
    """Availability helper must return False when plugin creation fails."""
    with patch("app.agents.unity_mcp_plugin.create_unity_mcp_plugin", side_effect=RuntimeError("down")):
        assert unity_mcp_plugin_available_for_writing() is False
