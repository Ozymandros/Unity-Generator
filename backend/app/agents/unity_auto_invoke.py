"""Auto-apply C# code blocks via unity_save_script when the model skips tool calls."""

from __future__ import annotations

import logging
import re
import time
from pathlib import Path
from typing import Any

LOGGER = logging.getLogger(__name__)

_CODE_BLOCK_RE = re.compile(
    r"```[ \t]*(?:csharp|cs|c#)?\r?\n([\s\S]*?)(?:\r?\n)?[ \t]*```",
    re.IGNORECASE,
)
_CLASS_NAME_RE = re.compile(r"\bclass\s+([A-Za-z_][A-Za-z0-9_]*)")
_SCENE_NAME_PATTERNS = (
    re.compile(r"(?:scene|level)\s+(?:named|called)\s+['\"]?([A-Za-z_][\w ]*)['\"]?", re.I),
    re.compile(r"([A-Za-z_][\w]*)\.unity\b", re.I),
)
_SCENE_CREATION_MARKERS = (
    "unity_create_scene",
    "unity_create_detailed_scene",
    "unity_create_default_scene",
    "unity_create_prototype_recipe",
    "unity_create_core_recipe",
)


def extract_csharp_blocks(text: str) -> list[tuple[str, str | None]]:
    """
    Extract C# fenced code blocks from assistant text.

    Args:
        text: LLM response content.

    Returns:
        List of (code, class_name_or_none) tuples.

    Example:
        >>> extract_csharp_blocks('```csharp\\nclass A {}\\n```')[0][1]
        'A'
    """
    if not isinstance(text, str) or not text.strip():
        return []
    blocks: list[tuple[str, str | None]] = []
    for match in _CODE_BLOCK_RE.finditer(text):
        code = match.group(1).strip()
        if not code or "class " not in code and "MonoBehaviour" not in code:
            continue
        class_match = _CLASS_NAME_RE.search(code)
        blocks.append((code, class_match.group(1) if class_match else None))
    return blocks


def _normalize_tool_name(tool_name: str) -> str:
    """Strip Semantic Kernel plugin prefixes from a tool name."""
    if not isinstance(tool_name, str):
        return ""
    blob = tool_name.strip().lower().replace("-", "_")
    if blob.startswith("unitymcpdiscovered_"):
        return blob.removeprefix("unitymcpdiscovered_")
    for prefix in ("project_", "scene_", "asset_", "validation_", "server_"):
        if blob.startswith(prefix):
            return blob[len(prefix) :]
    return blob


def scene_creation_tool_was_called(tools_invoked: set[str]) -> bool:
    """
    Return True when any invoked tool creates a Unity scene file.

    Args:
        tools_invoked: Raw tool names recorded during an agent turn.

    Returns:
        True if a scene-creation MCP tool was invoked.

    Example:
        >>> scene_creation_tool_was_called({"project-unity_create_scene"})
        True
    """
    if not tools_invoked:
        return False
    for tool_name in tools_invoked:
        normalized = _normalize_tool_name(tool_name)
        if any(marker in normalized for marker in _SCENE_CREATION_MARKERS):
            return True
    return False


def infer_scene_file_name(prompt: str, response_text: str = "") -> str:
    """
    Infer a project-relative scene path from the user prompt or response.

    Args:
        prompt: Original user instruction.
        response_text: Optional assistant response to scan for explicit names.

    Returns:
        Path such as ``Assets/Scenes/MyScene.unity``.

    Example:
        >>> infer_scene_file_name("Create a scene called Arena")
        'Assets/Scenes/Arena.unity'
    """
    combined = f"{prompt}\n{response_text}"
    for pattern in _SCENE_NAME_PATTERNS:
        match = pattern.search(combined)
        if match:
            raw_name = re.sub(r"\s+", "", match.group(1).strip())
            if raw_name:
                base = Path(raw_name).stem
                return f"Assets/Scenes/{base}.unity"

    words = re.findall(r"[A-Za-z]{3,}", prompt)[:4]
    if words:
        base = "".join(word[:1].upper() + word[1:] for word in words)
        return f"Assets/Scenes/{base}.unity"

    ts = int(time.time())
    return f"Assets/Scenes/GeneratedScene_{ts}.unity"


async def ensure_scene_file_if_missing(
    plugin: Any,
    *,
    project_path: str | None,
    tools_invoked: set[str],
    prompt: str,
    response_text: str = "",
) -> str | None:
    """
    Create a baseline scene file when the model saved scripts but skipped scene tools.

    Args:
        plugin: Initialized Unity MCP plugin with ``invoke_tool``.
        project_path: Unity project root. Required for scene creation.
        tools_invoked: Tool names invoked during the agent turn.
        prompt: Original user instruction (used to infer scene file name).
        response_text: Assistant response (optional name hints).

    Returns:
        Created project-relative scene path, or None when skipped or failed.

    Example:
        >>> # doctest: +SKIP
        >>> await ensure_scene_file_if_missing(
        ...     plugin,
        ...     project_path="/proj",
        ...     tools_invoked={"project-unity_create_script"},
        ...     prompt="Create a platformer scene",
        ... )
        'Assets/Scenes/CreateAPlatformerScene.unity'
    """
    if scene_creation_tool_was_called(tools_invoked):
        return None
    if not project_path or not str(project_path).strip():
        return None
    if plugin is None or not hasattr(plugin, "invoke_tool"):
        return None

    file_name = infer_scene_file_name(prompt, response_text)
    try:
        from .unity_tool_argument_injection import inject_unity_tool_arguments

        args = inject_unity_tool_arguments(
            "unity_create_scene",
            {"fileName": file_name},
            project_path=project_path,
        )
        await plugin.invoke_tool("unity_create_scene", args)
        LOGGER.info("Auto-invoked unity_create_scene for %s (model skipped scene tools)", file_name)
        return file_name.replace("\\", "/")
    except Exception as exc:
        LOGGER.warning("Auto-invoke unity_create_scene failed for %s: %s", file_name, exc)
        return None


async def auto_invoke_csharp_blocks(
    plugin: Any,
    response_text: str,
    *,
    project_path: str | None,
    tools_already_called: bool = False,
) -> list[str]:
    """
    Persist C# blocks through ``unity_save_script`` when no tools were invoked.

    Args:
        plugin: Initialized Unity MCP plugin with ``invoke_tool``.
        response_text: Assistant response text to scan.
        project_path: Unity project root. Required for saves.
        tools_already_called: When True, skip auto-invoke (model used tools).

    Returns:
        List of saved project-relative file paths.

    Example:
        >>> # doctest: +SKIP
        >>> await auto_invoke_csharp_blocks(plugin, "```csharp\\nclass A {}\\n```", project_path="/p")
        ['Assets/Scripts/A.cs']
    """
    if tools_already_called:
        return []
    if not project_path or not str(project_path).strip():
        return []
    if plugin is None or not hasattr(plugin, "invoke_tool"):
        return []

    saved: list[str] = []
    used_names: set[str] = set()
    ts = int(time.time())

    for index, (code, class_name) in enumerate(extract_csharp_blocks(response_text)):
        base = class_name or f"GeneratedScript_{ts}_{index}"
        file_name = f"Assets/Scripts/{base}.cs"
        suffix = 1
        while file_name in used_names:
            file_name = f"Assets/Scripts/{base}_{suffix}.cs"
            suffix += 1
        used_names.add(file_name)

        try:
            from .unity_tool_argument_injection import inject_unity_tool_arguments

            args = inject_unity_tool_arguments(
                "unity_save_script",
                {"content": code, "fileName": file_name},
                project_path=project_path,
            )
            await plugin.invoke_tool("unity_save_script", args)
            saved.append(file_name)
            LOGGER.info("Auto-invoked unity_save_script for %s", file_name)
        except Exception as exc:
            LOGGER.warning("Auto-invoke unity_save_script failed for %s: %s", file_name, exc)

    return saved
