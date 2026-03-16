"""Tests for /generate/unity-ui endpoint."""

from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas import AgentResult

client = TestClient(app)


def _mock_run_unity_ui(content: str = "// Generated UI code", files: list | None = None):
    """Helper that returns a coroutine mock for run_unity_ui."""
    result = AgentResult(
        content=content,
        provider="openai",
        model="gpt-4o-mini",
        raw={"content": content, "files": files or [], "metadata": {"steps": []}},
    )
    mock = AsyncMock(return_value=result)
    return mock


# ---------------------------------------------------------------------------
# Success cases
# ---------------------------------------------------------------------------

def test_generate_unity_ui_success():
    """POST /generate/unity-ui returns success with generated content."""
    with patch("app.routers.generation.agent_manager") as mock_am, \
         patch("app.routers.generation.get_pref", return_value="openai"), \
         patch("app.routers.generation._project_path_from_request", return_value=None):

        mock_am.run_unity_ui = _mock_run_unity_ui("public class HealthBar : MonoBehaviour {}")

        response = client.post(
            "/generate/unity-ui",
            json={
                "prompt": "Create a health bar",
                "provider": "openai",
                "ui_system": "ugui",
                "element_type": "health_bar",
                "options": {"model": "gpt-4o-mini"},
            },
        )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "HealthBar" in data["data"]["content"]


def test_generate_unity_ui_uitoolkit():
    """Endpoint accepts ui_system='uitoolkit' and passes it through."""
    with patch("app.routers.generation.agent_manager") as mock_am, \
         patch("app.routers.generation.get_pref", return_value="openai"), \
         patch("app.routers.generation._project_path_from_request", return_value=None):

        mock_am.run_unity_ui = _mock_run_unity_ui("<UXML>...</UXML>")

        response = client.post(
            "/generate/unity-ui",
            json={
                "prompt": "Create a settings menu",
                "provider": "openai",
                "ui_system": "uitoolkit",
                "options": {"model": "gpt-4o-mini"},
            },
        )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    mock_am.run_unity_ui.assert_awaited_once()
    call_kwargs = mock_am.run_unity_ui.call_args.kwargs
    assert call_kwargs["ui_system"] == "uitoolkit"


def test_generate_unity_ui_all_options():
    """All optional fields are forwarded to run_unity_ui."""
    with patch("app.routers.generation.agent_manager") as mock_am, \
         patch("app.routers.generation.get_pref", return_value="openai"), \
         patch("app.routers.generation._project_path_from_request", return_value=None):

        mock_am.run_unity_ui = _mock_run_unity_ui()

        response = client.post(
            "/generate/unity-ui",
            json={
                "prompt": "Create a dialogue box",
                "provider": "openai",
                "ui_system": "ugui",
                "element_type": "dialogue_box",
                "output_format": "both",
                "anchor_preset": "center",
                "color_theme": "dark blue, gold",
                "include_animations": True,
                "options": {"model": "gpt-4o-mini", "temperature": 0.5},
            },
        )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True

    call_kwargs = mock_am.run_unity_ui.call_args.kwargs
    assert call_kwargs["element_type"] == "dialogue_box"
    assert call_kwargs["output_format"] == "both"
    assert call_kwargs["anchor_preset"] == "center"
    assert call_kwargs["color_theme"] == "dark blue, gold"
    assert call_kwargs["include_animations"] is True


def test_generate_unity_ui_uses_pref_provider():
    """Falls back to preferred_llm_provider when no provider in request."""
    with patch("app.routers.generation.agent_manager") as mock_am, \
         patch("app.routers.generation.get_pref", return_value="deepseek"), \
         patch("app.routers.generation._project_path_from_request", return_value=None):

        mock_am.run_unity_ui = _mock_run_unity_ui()

        response = client.post(
            "/generate/unity-ui",
            json={"prompt": "Create a button", "options": {"model": "deepseek-coder"}},
        )

    assert response.status_code == 200
    call_kwargs = mock_am.run_unity_ui.call_args.kwargs
    assert call_kwargs["provider"] == "deepseek"


# ---------------------------------------------------------------------------
# Validation / error cases
# ---------------------------------------------------------------------------

def test_generate_unity_ui_empty_prompt():
    """Empty prompt returns success=False without calling the agent."""
    with patch("app.routers.generation.agent_manager") as mock_am:
        mock_am.run_unity_ui = _mock_run_unity_ui()

        response = client.post("/generate/unity-ui", json={"prompt": "   "})

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert "empty" in data["error"].lower()
    mock_am.run_unity_ui.assert_not_called()


def test_generate_unity_ui_no_provider():
    """Returns error when no provider in request and no pref stored."""
    with patch("app.routers.generation.get_pref", return_value=None):
        response = client.post(
            "/generate/unity-ui",
            json={"prompt": "Create a health bar"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert "provider" in data["error"].lower()


def test_generate_unity_ui_agent_exception():
    """Unhandled agent exception returns success=False with error message."""
    with patch("app.routers.generation.agent_manager") as mock_am, \
         patch("app.routers.generation.get_pref", return_value="openai"), \
         patch("app.routers.generation._project_path_from_request", return_value=None):

        mock_am.run_unity_ui = AsyncMock(side_effect=RuntimeError("LLM timeout"))

        response = client.post(
            "/generate/unity-ui",
            json={"prompt": "Create a HUD", "provider": "openai"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert "LLM timeout" in data["error"]


def test_generate_unity_ui_value_error():
    """ValueError from agent returns success=False."""
    with patch("app.routers.generation.agent_manager") as mock_am, \
         patch("app.routers.generation.get_pref", return_value="openai"), \
         patch("app.routers.generation._project_path_from_request", return_value=None):

        mock_am.run_unity_ui = AsyncMock(side_effect=ValueError("prompt must be non-empty"))

        response = client.post(
            "/generate/unity-ui",
            json={"prompt": "x", "provider": "openai"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert "prompt must be non-empty" in data["error"]


# ---------------------------------------------------------------------------
# AgentManager._build_unity_ui_system_prompt unit tests
# ---------------------------------------------------------------------------

class TestBuildUnityUISystemPrompt:
    """Unit tests for AgentManager._build_unity_ui_system_prompt."""

    @pytest.fixture
    def manager(self):
        from app.services.agent_manager import AgentManager
        return AgentManager()

    def test_ugui_prompt_contains_canvas_guidance(self, manager):
        """uGUI prompt mentions Canvas and RectTransform."""
        prompt = manager._build_unity_ui_system_prompt(
            ui_system="ugui",
            element_type="health_bar",
            output_format="script",
            anchor_preset=None,
            color_theme=None,
            include_animations=False,
        )
        assert "uGUI" in prompt
        assert "Canvas" in prompt
        assert "RectTransform" in prompt
        assert "health bar" in prompt

    def test_uitoolkit_prompt_contains_uxml_guidance(self, manager):
        """UI Toolkit prompt mentions UXML and USS."""
        prompt = manager._build_unity_ui_system_prompt(
            ui_system="uitoolkit",
            element_type="button",
            output_format="script",
            anchor_preset=None,
            color_theme=None,
            include_animations=False,
        )
        assert "UI Toolkit" in prompt
        assert "UXML" in prompt
        assert "USS" in prompt

    def test_output_format_prefab_yaml(self, manager):
        """prefab_yaml output format is mentioned in the prompt."""
        prompt = manager._build_unity_ui_system_prompt(
            ui_system="ugui",
            element_type=None,
            output_format="prefab_yaml",
            anchor_preset=None,
            color_theme=None,
            include_animations=False,
        )
        assert "Prefab YAML" in prompt

    def test_output_format_both(self, manager):
        """'both' output format mentions script AND prefab."""
        prompt = manager._build_unity_ui_system_prompt(
            ui_system="ugui",
            element_type=None,
            output_format="both",
            anchor_preset=None,
            color_theme=None,
            include_animations=False,
        )
        assert "both" in prompt.lower() or ("script" in prompt.lower() and "prefab" in prompt.lower())

    def test_anchor_preset_injected(self, manager):
        """Anchor preset hint appears in the prompt."""
        prompt = manager._build_unity_ui_system_prompt(
            ui_system="ugui",
            element_type=None,
            output_format="script",
            anchor_preset="full_screen",
            color_theme=None,
            include_animations=False,
        )
        assert "Stretch" in prompt or "stretch" in prompt or "full_screen" in prompt

    def test_color_theme_injected(self, manager):
        """Colour theme hint appears in the prompt."""
        prompt = manager._build_unity_ui_system_prompt(
            ui_system="ugui",
            element_type=None,
            output_format="script",
            anchor_preset=None,
            color_theme="dark blue, gold accents",
            include_animations=False,
        )
        assert "dark blue, gold accents" in prompt

    def test_animations_flag(self, manager):
        """include_animations=True adds animation guidance."""
        prompt = manager._build_unity_ui_system_prompt(
            ui_system="ugui",
            element_type=None,
            output_format="script",
            anchor_preset=None,
            color_theme=None,
            include_animations=True,
        )
        assert "animation" in prompt.lower() or "DOTween" in prompt

    def test_no_element_type(self, manager):
        """Prompt is still valid when element_type is None."""
        prompt = manager._build_unity_ui_system_prompt(
            ui_system="ugui",
            element_type=None,
            output_format="script",
            anchor_preset=None,
            color_theme=None,
            include_animations=False,
        )
        assert "uGUI" in prompt
        assert len(prompt) > 50
