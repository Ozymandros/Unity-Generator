"""Tests for Unity MCP orchestration helpers (Godot parity)."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest

from app.agents.modality_mcp_tool_policy import (
    filter_tool_names,
    is_tool_allowed,
    normalize_modality_key,
    should_apply_modality_filter,
)
from app.agents.unity_auto_invoke import auto_invoke_csharp_blocks, extract_csharp_blocks
from app.agents.unity_tool_argument_injection import inject_unity_tool_arguments


def test_normalize_modality_key():
    assert normalize_modality_key(" Unity-Lighting ") == "unity-lighting"
    assert normalize_modality_key("") is None


def test_modality_filter_lighting():
    assert should_apply_modality_filter("unity-lighting") is True
    assert is_tool_allowed("unity-lighting", "unity_light_create") is True
    assert is_tool_allowed("unity-lighting", "unity_camera_create") is False
    assert is_tool_allowed("unity-lighting", "ping") is True


def test_modality_filter_wizard_unrestricted():
    assert should_apply_modality_filter("wizard") is False
    names = {"unity_light_create", "unity_camera_create", "ping"}
    assert filter_tool_names("wizard", names) == names


def test_inject_project_path_and_file_name():
    args = inject_unity_tool_arguments(
        "unity_save_script",
        {"content": "class Player {}"},
        project_path="C:/Projects/MyGame",
    )
    assert args["projectPath"] == "C:/Projects/MyGame"
    assert args["fileName"] == "Assets/Scripts/Player.cs"


def test_extract_csharp_blocks():
    text = "```csharp\nclass Hero : MonoBehaviour {}\n```"
    blocks = extract_csharp_blocks(text)
    assert len(blocks) == 1
    assert blocks[0][1] == "Hero"


@pytest.mark.asyncio
async def test_auto_invoke_skips_when_tools_called():
    plugin = MagicMock()
    saved = await auto_invoke_csharp_blocks(
        plugin,
        "```csharp\nclass A {}\n```",
        project_path="/p",
        tools_already_called=True,
    )
    assert saved == []
    plugin.invoke_tool.assert_not_called()


@pytest.mark.asyncio
async def test_auto_invoke_saves_script():
    plugin = AsyncMock()
    saved = await auto_invoke_csharp_blocks(
        plugin,
        "```csharp\nclass SaveMe {}\n```",
        project_path="/p",
        tools_already_called=False,
    )
    assert saved == ["Assets/Scripts/SaveMe.cs"]
    plugin.invoke_tool.assert_awaited_once()
    call_args = plugin.invoke_tool.await_args
    assert call_args[0][0] == "unity_save_script"
    assert call_args[0][1]["projectPath"] == "/p"
