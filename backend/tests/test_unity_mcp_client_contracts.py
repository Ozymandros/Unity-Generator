from app.core.mcp_config import parse_mcp_args
from app.services.unity_mcp_client import (
    McpUnitySetupBackend,
    _normalize_tool_response,
    mcp_available,
    mcp_configured,
)


def test_mcp_configured_when_sdk_and_command_present(monkeypatch) -> None:
    """MCP is configured when SDK is importable and a stdio command exists."""
    monkeypatch.delenv("UNITY_MCP_SERVER_URL", raising=False)
    monkeypatch.setenv("UNITY_MCP_COMMAND", "unity-mcp")
    assert mcp_configured() is True


def test_mcp_mode_uses_configured_without_use_mcp_env(monkeypatch) -> None:
    """Explicit mcp finalize mode does not require UNITY_USE_MCP=1."""
    monkeypatch.delenv("UNITY_USE_MCP", raising=False)
    monkeypatch.setenv("UNITY_MCP_COMMAND", "unity-mcp")
    assert mcp_available() is False
    assert mcp_configured() is True


def test_mcp_available_respects_explicit_disable(monkeypatch) -> None:
    """UNITY_USE_MCP=0 forces batch-only finalize paths."""
    monkeypatch.setenv("UNITY_USE_MCP", "0")
    monkeypatch.setenv("UNITY_MCP_COMMAND", "unity-mcp")
    assert mcp_available() is False


def test_normalize_tool_response_preserves_standard_envelope_fields() -> None:
    response = _normalize_tool_response(
        """
        {
          "success": true,
          "message": "Created",
          "data": {"path": "Assets/Scenes/Main.unity"},
          "errors": [],
          "warnings": [{"code": "Compat.Warning"}],
          "suggestedRemediation": "Run import validation",
          "path": "Assets/Scenes/Main.unity",
          "native_path": "Assets/Scenes/Main.playable"
        }
        """,
        "unity_create_timeline",
    )

    assert response["success"] is True
    assert response["data"]["path"] == "Assets/Scenes/Main.unity"
    assert response["warnings"][0]["code"] == "Compat.Warning"
    assert response["suggested_remediation"] == "Run import validation"
    assert response["native_path"] == "Assets/Scenes/Main.playable"


def test_parse_mcp_args_preserves_quoted_arguments() -> None:
    assert parse_mcp_args('--project "C:/Unity Projects/Demo" --flag') == [
        "--project",
        "C:/Unity Projects/Demo",
        "--flag",
    ]


def test_normalize_capabilities_manifest_marks_success() -> None:
    response = _normalize_tool_response(
        '{"server":{"backend":"file","editorAvailable":false},"capabilities":[],"notes":[]}',
        "unity_get_capabilities",
    )
    assert response["success"] is True
    assert response["server"]["editorAvailable"] is False


def test_finalize_tolerates_missing_capabilities_tool_on_mcp_320(tmp_path, monkeypatch) -> None:
    """Unity MCP Server 3.2.0 lacks unity_get_capabilities; finalize should still succeed."""
    from pathlib import Path
    from unittest.mock import patch

    calls: list[str] = []

    def fake_call(tool_name: str, arguments, timeout_seconds=None):
        calls.append(tool_name)
        if tool_name == "unity_get_capabilities":
            return {"success": False, "message": "Unknown tool: 'unity_get_capabilities'"}
        if tool_name == "unity_get_server_info":
            return {"success": False, "message": "Unknown tool: 'unity_get_server_info'"}
        if tool_name == "unity_lint_project":
            return {"success": False, "message": "Unknown tool: 'unity_lint_project'"}
        if tool_name == "unity_validate_import":
            return {
                "success": True,
                "error_count": 0,
                "warning_count": 0,
                "errors": [],
                "message": "Stub file-only validation",
            }
        raise AssertionError(f"unexpected tool {tool_name}")

    monkeypatch.setattr("app.services.unity_mcp_client.mcp_configured", lambda: True)
    with patch("app.services.unity_mcp_client._call_tool", side_effect=fake_call):
        backend = McpUnitySetupBackend()
        result = backend.run_setup(Path(tmp_path), generate_scene=False, install_packages=False, setup_urp=False)

    assert result.success is True
    assert "unity_get_capabilities" in calls
    assert "unity_validate_import" not in calls
    assert any("Capabilities probe unavailable" in log or "skipped" in log for log in result.logs)


def test_validate_import_skipped_without_editor(tmp_path, monkeypatch) -> None:
    """Finalize must not fail the job when Editor-gated validation is unavailable."""
    from pathlib import Path
    from unittest.mock import patch

    calls: list[str] = []

    def fake_call(tool_name: str, arguments, timeout_seconds=None):
        calls.append(tool_name)
        if tool_name == "unity_get_capabilities":
            return {
                "success": True,
                "server": {"backend": "file", "editorAvailable": False},
                "capabilities": [],
            }
        if tool_name == "unity_lint_project":
            return {"success": True, "message": "lint ok"}
        raise AssertionError(f"unexpected tool {tool_name}")

    monkeypatch.setattr("app.services.unity_mcp_client.mcp_configured", lambda: True)
    with patch("app.services.unity_mcp_client._call_tool", side_effect=fake_call):
        backend = McpUnitySetupBackend()
        result = backend.run_setup(Path(tmp_path), generate_scene=False, install_packages=False, setup_urp=False)

    assert result.success is True
    assert "unity_get_capabilities" in calls
    assert "unity_lint_project" in calls
    assert "unity_validate_import" not in calls
    assert any("Editor unavailable" in log for log in result.logs)
