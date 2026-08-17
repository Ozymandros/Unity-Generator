"""Modality-scoped Unity MCP tool filtering (Godot ModalityMcpToolPolicy parity)."""

from __future__ import annotations

# Shared diagnostic tools always allowed when filtering is active.
_SHARED_DIAGNOSTIC_MARKERS = (
    "ping",
    "health",
    "server_info",
    "serverinfo",
    "capabilit",
    "unity_get_capabilities",
    "unity_get_server_info",
    "unity_get_project_info",
    "unity_lint_project",
    "list_tool",
    "tools_list",
)

# Namespace plugins from unity-mcp-plugin add_unity_mcp_skills.
_MODALITY_NAMESPACE_MAP: dict[str, frozenset[str]] = {
    "unity-lighting": frozenset({"server", "light", "asset", "validation"}),
    "unity-camera": frozenset({"server", "camera", "asset", "validation"}),
    "unity-materials": frozenset({"server", "asset", "validation"}),
    "unity-animation": frozenset({"server", "animation", "asset", "validation"}),
    "unity-scene-graph": frozenset({"server", "scene", "component", "validation"}),
    "unity-nav": frozenset({"server", "nav", "validation"}),
    "unity-input": frozenset({"server", "input", "validation"}),
    "unity-vfx": frozenset({"server", "vfx", "asset", "validation"}),
    "unity-packages": frozenset({"server", "packages", "validation"}),
    "unity-ui": frozenset({"server", "ui", "asset", "validation"}),
    "unity-physics": frozenset({"server", "physics", "validation"}),
    "scenes": frozenset({"server", "scene", "asset", "project", "validation"}),
    "unity-project": frozenset({"server", "project", "packages", "validation"}),
    "wizard": frozenset(),  # empty => all namespaces
}

_MODALITY_TOOL_TOKEN_MAP: dict[str, frozenset[str]] = {
    "unity-lighting": frozenset({"unity_light", "light"}),
    "unity-camera": frozenset({"unity_camera", "camera"}),
    "unity-materials": frozenset(
        {
            "unity_create_material",
            "unity_update_material",
            "unity_assign_material",
            "unity_save_texture",
            "material",
        }
    ),
    "unity-animation": frozenset(
        {"unity_create_basic_animator", "unity_create_advanced_animator", "unity_create_timeline", "animator", "timeline"}
    ),
    "unity-scene-graph": frozenset({"unity_scene_", "unity_component_", "scene", "component"}),
    "unity-nav": frozenset({"unity_configure_navmesh", "unity_create_waypoint", "navmesh", "waypoint"}),
    "unity-input": frozenset({"unity_create_input", "input_actions", "input"}),
    "unity-vfx": frozenset({"unity_create_vfx", "vfx"}),
    "unity-packages": frozenset({"unity_install_packages", "unity_add_packages", "unity_search_packages", "package"}),
    "unity-ui": frozenset({"unity_create_ui", "ui"}),
    "unity-physics": frozenset({"unity_create_physics", "unity_physics", "physics"}),
    "scenes": frozenset({"unity_create_scene", "unity_create_detailed", "unity_add_gameobject", "unity_scene", "scene"}),
    "unity-project": frozenset({"unity_scaffold", "unity_get_project", "unity_install_packages", "project"}),
}


def normalize_modality_key(modality_key: str | None) -> str | None:
    """
    Normalize a modality key for policy lookup.

    Args:
        modality_key: Raw modality string from request options.

    Returns:
        Lowercase trimmed key, or None when empty.

    Example:
        >>> normalize_modality_key(" Unity-Lighting ")
        'unity-lighting'
    """
    if not modality_key or not str(modality_key).strip():
        return None
    return str(modality_key).strip().lower()


def should_apply_modality_filter(modality_key: str | None) -> bool:
    """Return True when the modality maps to a narrowed MCP tool surface."""
    key = normalize_modality_key(modality_key)
    if not key or key == "wizard":
        return False
    return key in _MODALITY_TOOL_TOKEN_MAP or key in _MODALITY_NAMESPACE_MAP


def allowed_namespace_plugins(modality_key: str | None) -> frozenset[str] | None:
    """
    Return allowed SK namespace plugin names, or None for unrestricted registration.

    Args:
        modality_key: Panel/modality identifier.

    Returns:
        Frozenset of namespace names, or None when all namespaces are allowed.
    """
    key = normalize_modality_key(modality_key)
    if not key or key == "wizard":
        return None
    namespaces = _MODALITY_NAMESPACE_MAP.get(key)
    if namespaces is None:
        return None
    if not namespaces:
        return None
    return namespaces


def is_tool_allowed(modality_key: str | None, tool_name: str) -> bool:
    """
    Return whether an MCP tool name is allowed for the given modality.

    Args:
        modality_key: Panel/modality identifier.
        tool_name: MCP tool or SK function name.

    Returns:
        True if the tool should remain registered/invokable.

    Example:
        >>> is_tool_allowed("unity-lighting", "unity_light_create")
        True
    """
    key = normalize_modality_key(modality_key)
    if not key or key == "wizard":
        return True

    blob = tool_name.lower()
    if any(marker in blob for marker in _SHARED_DIAGNOSTIC_MARKERS):
        return True

    tokens = _MODALITY_TOOL_TOKEN_MAP.get(key)
    if not tokens:
        return True
    return any(token in blob for token in tokens)


def filter_tool_names(modality_key: str | None, tool_names: set[str]) -> set[str]:
    """
    Filter a set of MCP tool names to those allowed for a modality.

    Args:
        modality_key: Panel/modality identifier.
        tool_names: Candidate MCP tool names.

    Returns:
        Subset of names permitted for the modality (always includes diagnostics).
    """
    if not should_apply_modality_filter(modality_key):
        return set(tool_names)
    return {name for name in tool_names if is_tool_allowed(modality_key, name)}
