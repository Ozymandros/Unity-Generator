"""Auto-apply C# code blocks via unity_save_script when the model skips tool calls."""

from __future__ import annotations

import logging
import re
import time
from typing import Any

LOGGER = logging.getLogger(__name__)

_CODE_BLOCK_RE = re.compile(
    r"```[ \t]*(?:csharp|cs|c#)?\r?\n([\s\S]*?)(?:\r?\n)?[ \t]*```",
    re.IGNORECASE,
)
_CLASS_NAME_RE = re.compile(r"\bclass\s+([A-Za-z_][A-Za-z0-9_]*)")


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
