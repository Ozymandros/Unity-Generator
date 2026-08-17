from __future__ import annotations

import os
import shlex


def parse_mcp_args(raw_args: str | None) -> list[str]:
    """
    Parse a UNITY_MCP_ARGS value into subprocess arguments.

    Args:
        raw_args: Raw environment variable value. May be empty, None, or contain
            shell-style quoting for arguments with spaces.

    Returns:
        Parsed argument list suitable for MCP stdio process launch.

    Raises:
        ValueError: If raw_args contains invalid shell-style quoting.

    Example:
        >>> parse_mcp_args('--project "C:/My Project"')
        ['--project', 'C:/My Project']
    """
    if raw_args is None or not raw_args.strip():
        return []
    return shlex.split(raw_args)


def get_mcp_stdio_config() -> tuple[str, list[str]]:
    """
    Resolve Unity MCP stdio command and arguments from environment variables.

    Returns:
        Tuple of (command, args) shared by agent plugin and finalize MCP client.

    Example:
        >>> cmd, args = get_mcp_stdio_config()
        >>> isinstance(cmd, str)
        True
    """
    command = os.environ.get("UNITY_MCP_COMMAND", "unity-mcp").strip() or "unity-mcp"
    args = parse_mcp_args(os.environ.get("UNITY_MCP_ARGS"))
    return command, args
