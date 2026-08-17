from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch
from contextlib import asynccontextmanager

import pytest

from app.agents.unity_mcp_plugin import (
    _check_unity_mcp_live,
    _build_unity_mcp_options,
    clear_unity_mcp_live_cache,
    create_unity_mcp_plugin,
    persist_media_import,
    register_unity_mcp_on_kernel,
    unity_mcp_plugin_available_for_writing,
)


@pytest.mark.asyncio
async def test_unity_mcp_pluginwrapper_create_initialize_and_cleanup() -> None:
    """Ensure wrapper creates plugin via official MCP SDK client and performs lifecycle calls."""
    mock_plugin = MagicMock()
    mock_plugin.initialize = AsyncMock()
    mock_plugin.cleanup = AsyncMock()
    mock_client = MagicMock()

    with patch("app.agents.unity_mcp_plugin.OfficialMcpSdkClient", return_value=mock_client), patch(
        "app.agents.unity_mcp_plugin.UnityMCPPlugin", return_value=mock_plugin
    ) as mock_plugin_cls:
        async with create_unity_mcp_plugin() as plugin:
            assert plugin is mock_plugin
        mock_plugin_cls.assert_called_once()
        mock_plugin.initialize.assert_awaited_once()
        mock_plugin.cleanup.assert_awaited_once()


@pytest.mark.asyncio
async def test_unity_mcp_pluginwrapper_error_propagates() -> None:
    """Ensure initialization errors clean up plugin resources and propagate."""
    mock_plugin = MagicMock()
    mock_plugin.initialize = AsyncMock(side_effect=RuntimeError("boom"))
    mock_plugin.cleanup = AsyncMock()

    with patch("app.agents.unity_mcp_plugin.OfficialMcpSdkClient"), patch(
        "app.agents.unity_mcp_plugin.UnityMCPPlugin", return_value=mock_plugin
    ):
        with pytest.raises(RuntimeError, match="boom"):
            async with create_unity_mcp_plugin():
                pass
    mock_plugin.cleanup.assert_awaited_once()


def test_unity_mcp_plugin_available_for_writing_false_on_failure() -> None:
    """Availability helper must return False when plugin creation fails."""
    clear_unity_mcp_live_cache()
    with patch("app.agents.unity_mcp_plugin.create_unity_mcp_plugin", side_effect=RuntimeError("down")):
        assert unity_mcp_plugin_available_for_writing() is False


def test_build_unity_mcp_options_forwards_supported_args() -> None:
    """UNITY_MCP_ARGS is forwarded when the installed plugin exposes an args option."""

    class FakeOptions:
        def __init__(
            self,
            executable_path: str,
            connection_timeout_seconds: int,
            request_timeout_seconds: int,
            enable_message_logging: bool,
            args: list[str] | None = None,
        ) -> None:
            self.executable_path = executable_path
            self.args = args

    with patch("app.agents.unity_mcp_plugin.UnityMcpOptions", FakeOptions):
        options = _build_unity_mcp_options("unity-mcp", "--foo bar")

    assert options.executable_path == "unity-mcp"
    assert options.args == ["--foo", "bar"]


def test_build_unity_mcp_options_forwards_quoted_args() -> None:
    """Quoted UNITY_MCP_ARGS tokens are preserved when forwarded to plugin args."""

    class FakeOptions:
        def __init__(
            self,
            executable_path: str,
            connection_timeout_seconds: int,
            request_timeout_seconds: int,
            enable_message_logging: bool,
            args: list[str] | None = None,
        ) -> None:
            self.executable_path = executable_path
            self.args = args

    with patch("app.agents.unity_mcp_plugin.UnityMcpOptions", FakeOptions):
        options = _build_unity_mcp_options(
            "unity-mcp",
            '--project "C:/Unity Projects/Demo" --flag',
        )

    assert options.args == ["--project", "C:/Unity Projects/Demo", "--flag"]


@pytest.mark.asyncio
async def test_check_unity_mcp_live_false_without_ping_or_health_probe() -> None:
    """A successfully initialized plugin is not considered live without a probe."""

    class NoProbe:
        pass

    @asynccontextmanager
    async def fake_plugin_context():
        yield NoProbe()

    with patch("app.agents.unity_mcp_plugin.create_unity_mcp_plugin", fake_plugin_context):
        assert await _check_unity_mcp_live() is False


@pytest.mark.asyncio
async def test_check_unity_mcp_live_true_after_ping() -> None:
    """The live check returns true only after invoking ping successfully."""

    plugin = MagicMock()
    plugin.invoke_tool = AsyncMock(return_value="pong")

    @asynccontextmanager
    async def fake_plugin_context():
        yield plugin

    with patch("app.agents.unity_mcp_plugin.create_unity_mcp_plugin", fake_plugin_context):
        assert await _check_unity_mcp_live() is True
        plugin.invoke_tool.assert_awaited_once_with("ping", {})


@pytest.mark.asyncio
async def test_register_unity_mcp_on_kernel_adds_router_plugin() -> None:
    """Typed skill registration still keeps the UnityMCP router plugin."""
    from semantic_kernel import Kernel

    kernel = MagicMock(spec=Kernel)
    plugin = MagicMock()
    register_unity_mcp_on_kernel(kernel, plugin)
    kernel.add_plugin.assert_called_with(plugin, plugin_name="UnityMCP")


def test_register_unity_mcp_on_kernel_registers_typed_namespaces() -> None:
    """Typed skill registration covers every Unity MCP plugin namespace."""
    from unity_mcp import UNITY_MCP_SKILL_NAMESPACES

    expected = [
        "server",
        "project",
        "scene",
        "asset",
        "packages",
        "validation",
        "ecosystem",
        "camera",
        "light",
        "physics",
        "ui",
        "nav",
        "input",
        "animation",
        "vfx",
        "component",
        "editor_bridge",
    ]
    assert list(UNITY_MCP_SKILL_NAMESPACES) == expected

    kernel = MagicMock()
    plugin = MagicMock()
    register_unity_mcp_on_kernel(kernel, plugin)
    names = [call.kwargs.get("plugin_name") for call in kernel.add_plugin.call_args_list]
    for namespace in expected:
        assert namespace in names
    assert names[-1] == "UnityMCP"


@pytest.mark.asyncio
async def test_persist_media_import_calls_unity_save_texture() -> None:
    """media_import base64 is sent to unity_save_texture, not left as prompt metadata."""
    plugin = MagicMock()
    plugin.invoke_tool = AsyncMock(return_value="Texture saved")
    result = await persist_media_import(
        plugin,
        "/proj",
        {
            "name": "hero.png",
            "type": "image/png",
            "data": "data:image/png;base64,abc123",
        },
    )
    assert result == "Texture saved"
    plugin.invoke_tool.assert_awaited_once_with(
        "unity_save_texture",
        {
            "projectPath": "/proj",
            "fileName": "Assets/Textures/hero.png",
            "base64Data": "abc123",
        },
    )


@pytest.mark.asyncio
async def test_persist_media_import_calls_unity_save_audio() -> None:
    """Audio media_import payloads reach unity_save_audio with stripped base64."""
    plugin = MagicMock()
    plugin.invoke_tool = AsyncMock(return_value="Audio saved")
    result = await persist_media_import(
        plugin,
        "/proj",
        {
            "name": "jump.wav",
            "type": "audio/wav",
            "base64": "data:audio/wav;base64,abc123",
        },
    )
    assert result == "Audio saved"
    plugin.invoke_tool.assert_awaited_once_with(
        "unity_save_audio",
        {
            "projectPath": "/proj",
            "fileName": "Assets/Audio/jump.wav",
            "base64Data": "abc123",
        },
    )
