"""Inject projectPath/fileName into Unity MCP tool arguments when the model omits them."""

from __future__ import annotations

import re
import time
from pathlib import Path
from typing import Any

_CSHARP_CLASS_RE = re.compile(r"\bclass\s+([A-Za-z_][A-Za-z0-9_]*)")

# Tools that must never receive injected projectPath (they use other parameters only).
_NO_PROJECT_PATH_TOOLS = frozenset(
    {
        "unity_get_capabilities",
        "unity_get_server_info",
        "unity_validate_csharp",
        "unity_query_documentation",
        "unity_query_engine_documentation",
    }
)

# Tools that require projectPath (camelCase MCP contract).
_PROJECT_PATH_TOOLS = frozenset(
    name
    for name in (
        "unity_create_scene",
        "unity_create_detailed_scene",
        "unity_add_gameobject",
        "unity_create_material",
        "unity_save_script",
        "unity_save_text",
        "unity_save_texture",
        "unity_save_audio",
        "unity_create_ui_canvas",
        "unity_create_ui_layout",
        "unity_create_physics_setup",
        "unity_light_create",
        "unity_light_update",
        "unity_camera_create",
        "unity_camera_update",
        "unity_create_basic_animator",
        "unity_create_advanced_animator",
        "unity_create_timeline",
        "unity_lint_project",
        "unity_validate_import",
        "unity_get_project_info",
    )
)

_FILE_NAME_TOOLS = frozenset(
    name
    for name in (
        "unity_create_scene",
        "unity_create_detailed_scene",
        "unity_add_gameobject",
        "unity_create_material",
        "unity_save_script",
        "unity_save_text",
        "unity_save_texture",
        "unity_save_audio",
        "unity_create_ui_canvas",
        "unity_create_ui_layout",
        "unity_create_physics_setup",
        "unity_light_create",
        "unity_light_update",
        "unity_camera_create",
        "unity_camera_update",
        "unity_create_basic_animator",
        "unity_create_advanced_animator",
        "unity_create_timeline",
    )
)


def _default_file_name(tool_name: str, arguments: dict[str, Any]) -> str | None:
    """Derive a project-relative fileName when the model omitted it."""
    ts = int(time.time())
    content = str(arguments.get("content") or "")
    if tool_name == "unity_save_script" or tool_name == "unity_create_script":
        match = _CSHARP_CLASS_RE.search(content)
        class_name = match.group(1) if match else f"GeneratedScript_{ts}"
        return f"Assets/Scripts/{class_name}.cs"
    if tool_name in ("unity_save_text",):
        return f"Assets/Text/generated_text_{ts}.txt"
    if tool_name in ("unity_save_texture",):
        return f"Assets/Textures/image_{ts}.png"
    if tool_name in ("unity_save_audio",):
        return f"Assets/Audio/audio_{ts}.wav"
    if "scene" in tool_name:
        scene = str(arguments.get("sceneName") or arguments.get("fileName") or f"Scene_{ts}")
        if not scene.endswith(".unity"):
            scene = f"{scene}.unity"
        return f"Assets/Scenes/{Path(scene).name}"
    if "material" in tool_name:
        return f"Assets/Materials/Material_{ts}.mat"
    if "ui_canvas" in tool_name:
        return f"Assets/UI/Canvas_{ts}.prefab"
    if "ui_layout" in tool_name:
        return f"Assets/UI/Layout_{ts}.json"
    if "physics_setup" in tool_name:
        return f"Assets/Physics/PhysicsSetup_{ts}.json"
    if "light_create" in tool_name or "light_update" in tool_name:
        return f"Assets/Scenes/Lights/Light_{ts}.unity"
    if "camera_create" in tool_name or "camera_update" in tool_name:
        return f"Assets/Scenes/Cameras/Camera_{ts}.unity"
    if "animator" in tool_name:
        return f"Assets/Animations/Animator_{ts}.controller"
    if "timeline" in tool_name:
        return f"Assets/Timelines/Timeline_{ts}.playable"
    return None


def _should_inject_project_path(tool_name: str) -> bool:
    """Return True when ``projectPath`` may be injected for this tool."""
    if not tool_name or tool_name == "ping":
        return False
    if tool_name in _NO_PROJECT_PATH_TOOLS:
        return False
    return tool_name in _PROJECT_PATH_TOOLS or tool_name.startswith("unity_")


def inject_unity_tool_arguments(
    tool_name: str,
    arguments: dict[str, Any] | None,
    *,
    project_path: str | None,
    default_file_name: str | None = None,
) -> dict[str, Any]:
    """
    Fill missing ``projectPath`` / ``fileName`` on Unity MCP tool calls.

    Args:
        tool_name: MCP tool name being invoked.
        arguments: Raw arguments from the model or caller.
        project_path: Active Unity project root directory.
        default_file_name: Optional override for fileName inference.

    Returns:
        Arguments dict with injected fields when applicable.

    Example:
        >>> inject_unity_tool_arguments(
        ...     "unity_save_script",
        ...     {"content": "class Player {}"},
        ...     project_path="/proj",
        ... )["projectPath"]
        '/proj'
    """
    if not isinstance(arguments, dict):
        args: dict[str, Any] = {}
    else:
        args = dict(arguments)

    if project_path and str(project_path).strip():
        normalized = Path(project_path.strip()).as_posix()
        if _should_inject_project_path(tool_name) and not args.get("projectPath"):
            args["projectPath"] = normalized

    if tool_name in _FILE_NAME_TOOLS or tool_name.startswith("unity_save_"):
        if not args.get("fileName"):
            inferred = default_file_name or _default_file_name(tool_name, args)
            if inferred:
                args["fileName"] = inferred.replace("\\", "/")

    return args
