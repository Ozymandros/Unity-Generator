"""Tests for schemas module."""
from datetime import datetime

import pytest

from typing import cast

from app.schemas import (
    GenerationRequest,
    GenerationResponse,
    ApiKeysRequest,
    PrefRequest,
    UnityProjectRequest,
    ok_response,
    error_response,
    CodeOptions,
)


def test_generation_request_minimal() -> None:
    """Test GenerationRequest with only required fields."""
    req = GenerationRequest(prompt="test")
    assert req.prompt == "test"
    assert req.provider is None
    assert req.options == {}


def test_generation_request_full() -> None:
    """Test GenerationRequest with all fields."""
    req = GenerationRequest(
        prompt="test",
        provider="openai",
        options={"model": "gpt-4o"}
    )
    assert req.prompt == "test"
    assert req.provider == "openai"
    options = cast(CodeOptions, req.options)
    assert options.model == "gpt-4o"
    assert options.temperature == 0.7


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
        options={"code": {"model": "gpt-4o"}}
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
    assert response.data == result
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
    response = GenerationResponse(
        success=True,
        date="2024-01-01T00:00:00Z",
        error=None,
        data=result
    )
    assert response.success is True
    assert response.data == result
