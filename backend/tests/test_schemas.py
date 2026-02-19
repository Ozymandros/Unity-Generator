"""Tests for schemas module."""

from datetime import datetime

from app.schemas import (
    ApiKeysRequest,
    GenerationRequest,
    GenerationResponse,
    PrefRequest,
    UnityProjectRequest,
    error_response,
    ok_response,
)


def test_generation_request_minimal() -> None:
    """Test GenerationRequest with only required fields."""
    req = GenerationRequest(prompt="test")
    assert req.prompt == "test"
    assert req.provider is None
    assert req.options == {}


def test_generation_request_full() -> None:
    """Test GenerationRequest with all fields."""
    req = GenerationRequest(prompt="test", provider="openai", options={"model": "gpt-4o"})
    assert req.prompt == "test"
    assert req.provider == "openai"
    # options is a dict, not a CodeOptions object
    assert req.options["model"] == "gpt-4o"


def test_api_keys_request() -> None:
    """Test ApiKeysRequest model."""
    req = ApiKeysRequest(keys={"openai_api_key": "sk-test"})
    assert req.keys == {"openai_api_key": "sk-test"}


def test_pref_request() -> None:
    """Test PrefRequest model."""
    req = PrefRequest(key="test_key", value="test_value")
    assert req.key == "test_key"
    assert req.value == "test_value"


def test_unity_project_request_minimal() -> None:
    """Test UnityProjectRequest with defaults."""
    req = UnityProjectRequest()
    assert req.project_name == "UnityProject"
    assert req.code_prompt is None
    assert req.provider_overrides == {}


def test_unity_project_request_full() -> None:
    """Test UnityProjectRequest with all fields."""
    req = UnityProjectRequest(
        project_name="MyProject",
        code_prompt="Create player",
        text_prompt="Write dialogue",
        image_prompt="Hero portrait",
        audio_prompt="Battle cry",
        provider_overrides={"code": "openai"},
        options={"code": {"model": "gpt-4o"}},
    )
    assert req.project_name == "MyProject"
    assert req.code_prompt == "Create player"


def test_ok_response_structure() -> None:
    """Test ok_response returns correct structure."""
    from app.schemas import AgentResult

    result = AgentResult(content="test", provider="test")
    response = ok_response(result)

    assert response.success is True
    assert response.error is None
    # ok_response converts AgentResult to dict
    assert response.data == {"content": "test", "provider": "test", "metadata": {}}
    assert response.date is not None
    # Verify date is valid ISO format
    datetime.fromisoformat(response.date.replace("Z", "+00:00"))


def test_error_response_structure() -> None:
    """Test error_response returns correct structure."""
    response = error_response("Something went wrong")

    assert response.success is False
    assert response.error == "Something went wrong"
    assert response.data is None
    assert response.date is not None


def test_generation_response_model() -> None:
    """Test GenerationResponse can be instantiated."""
    from app.schemas import AgentResult

    result = AgentResult(content="test", provider="test")
    # GenerationResponse expects dict data, not AgentResult
    response = GenerationResponse(
        success=True, date="2024-01-01T00:00:00Z", error=None, data=result.model_dump(exclude_none=True)
    )
    assert response.success is True
    assert response.data == {"content": "test", "provider": "test", "metadata": {}}
