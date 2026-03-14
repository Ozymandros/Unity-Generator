
"""
Tests for the UnityAgent and the ``_build_sk_service`` helper.

Covers provider-specific service construction (OpenAI, DeepSeek,
OpenRouter, Groq, Azure), unsupported-provider error, and
missing argument validation.
"""


from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.agents.unity_agent import UnityAgent

# ======================================================================
# UnityAgent integration tests
# ======================================================================


@pytest.mark.asyncio
async def test_unity_agent_openai():
    """OpenAI provider constructs the correct SK service via registry."""
    agent = UnityAgent()

    with patch("app.agents.unity_agent.Kernel") as MockKernel, \
         patch("app.agents.unity_agent.provider_registry") as MockRegistry, \
         patch("app.agents.unity_agent.unity_mcp_plugin_available_for_writing", return_value=True), \
         patch("app.agents.unity_agent.create_unity_mcp_plugin") as MockFactory:

        # Mock Kernel
        mock_kernel_instance = MockKernel.return_value
        mock_kernel_instance.invoke_prompt = AsyncMock(return_value="Success")

        # Mock Registry
        mock_caps = MagicMock()
        mock_caps.api_key_name = "openai"
        mock_caps.supports_tool_use = True
        MockRegistry.get.return_value = mock_caps
        MockRegistry.create_chat_service.return_value = MagicMock()

        # Mock Plugin Factory Context Manager
        mock_plugin_instance = MagicMock()
        mock_context_manager = AsyncMock()
        mock_context_manager.__aenter__.return_value = mock_plugin_instance
        mock_context_manager.__aexit__.return_value = None
        MockFactory.return_value = mock_context_manager

        await agent.run(
            prompt="test",
            provider="openai",
            options={"model": "gpt-4"},
            api_keys={"openai": "sk-test"},
        )

        MockRegistry.get.assert_called_with("openai")
        MockRegistry.create_chat_service.assert_called_with(
            "openai", "sk-test", model_id="gpt-4", endpoint=None, service_id="default"
        )
        mock_kernel_instance.add_service.assert_called()
        MockFactory.assert_called_once()
        mock_kernel_instance.add_plugin.assert_called_with(mock_plugin_instance, plugin_name="UnityMCP")

        # When use_tools is True, prompt must contain tool-use instruction
        call_kwargs = mock_kernel_instance.invoke_prompt.call_args[1]
        full_prompt = call_kwargs.get("prompt", "")
        assert "try to use available tools" in full_prompt
        assert "create or modify content" in full_prompt


@pytest.mark.asyncio
async def test_unity_agent_deepseek():
    """DeepSeek provider constructs the correct SK service via registry."""
    agent = UnityAgent()

    with patch("app.agents.unity_agent.Kernel") as MockKernel, \
         patch("app.agents.unity_agent.provider_registry") as MockRegistry, \
         patch("app.agents.unity_agent.unity_mcp_plugin_available_for_writing", return_value=True), \
         patch("app.agents.unity_agent.create_unity_mcp_plugin") as MockFactory:

        # Mock Kernel
        mock_kernel_instance = MockKernel.return_value
        mock_kernel_instance.invoke_prompt = AsyncMock(return_value="Success")

        # Mock Registry
        mock_caps = MagicMock()
        mock_caps.api_key_name = "deepseek"
        mock_caps.supports_tool_use = True
        MockRegistry.get.return_value = mock_caps
        MockRegistry.create_chat_service.return_value = MagicMock()

        # Mock Plugin Factory Context Manager
        mock_plugin_instance = MagicMock()
        mock_context_manager = AsyncMock()
        mock_context_manager.__aenter__.return_value = mock_plugin_instance
        mock_context_manager.__aexit__.return_value = None
        MockFactory.return_value = mock_context_manager

        await agent.run(
            prompt="test",
            provider="deepseek",
            options={"model": "deepseek-chat"},
            api_keys={"deepseek": "sk-deepseek"}
        )

        MockRegistry.get.assert_called_with("deepseek")
        MockRegistry.create_chat_service.assert_called_with(
            "deepseek", "sk-deepseek", model_id="deepseek-chat", endpoint=None, service_id="default"
        )
        MockFactory.assert_called_once()


@pytest.mark.asyncio
@pytest.mark.skip(reason="aiortc/av has Windows DLL dependency issues - test skipped")
async def test_unity_agent_unsupported_provider():
    """Unsupported providers raise NotImplementedError."""
    agent = UnityAgent()

    with pytest.raises(NotImplementedError, match="not yet implemented"):
        await agent.run(
            prompt="test",
            provider="pika",
            options={"model": "v1"},
            api_keys={}
        )


@pytest.mark.asyncio
async def test_unity_agent_missing_args():
    """Missing provider and model arguments raise ValueError."""
    agent = UnityAgent()

    with pytest.raises(ValueError, match="Provider must be specified"):
        await agent.run(prompt="test", provider=None, options={}, api_keys={})

    with pytest.raises(ValueError, match="Model must be specified"):
        await agent.run(prompt="test", provider="openai", options={}, api_keys={})


@pytest.mark.asyncio
async def test_unity_agent_mcp_connection_failure():
    """When MCP server connection fails, agent handles the exception."""
    agent = UnityAgent()

    with patch("app.agents.unity_agent.Kernel"), \
         patch("app.agents.unity_agent.provider_registry") as MockRegistry, \
         patch("app.agents.unity_agent.unity_mcp_plugin_available_for_writing", return_value=True), \
         patch("app.agents.unity_agent.create_unity_mcp_plugin") as MockFactory:

        # Mock Registry
        mock_caps = MagicMock()
        mock_caps.api_key_name = "openai"
        mock_caps.supports_tool_use = True
        MockRegistry.get.return_value = mock_caps
        MockRegistry.create_chat_service.return_value = MagicMock()

        # Mock Factory to raise exception on enter
        mock_context_manager = AsyncMock()
        mock_context_manager.__aenter__.side_effect = ConnectionError("Failed to connect")
        MockFactory.return_value = mock_context_manager

        await agent.run(
            prompt="test",
            provider="openai",
            options={"model": "gpt-4"},
            api_keys={"openai": "sk-test"},
        )


@pytest.mark.asyncio
async def test_unity_agent_no_tool_use_skips_mcp():
    """When provider does not support tool use (e.g. Ollama), MCP plugin is NOT registered."""
    agent = UnityAgent()

    with patch("app.agents.unity_agent.Kernel") as MockKernel, \
         patch("app.agents.unity_agent.provider_registry") as MockRegistry, \
         patch("app.agents.unity_agent.create_unity_mcp_plugin") as MockFactory:

        # Mock Kernel
        mock_kernel_instance = MockKernel.return_value
        mock_kernel_instance.invoke_prompt = AsyncMock(return_value="Plain LLM response")

        # Mock Registry — Ollama-like provider with NO tool support
        mock_caps = MagicMock()
        mock_caps.api_key_name = "ollama_api_key"
        mock_caps.supports_tool_use = False
        MockRegistry.get.return_value = mock_caps
        MockRegistry.create_chat_service.return_value = MagicMock()

        result = await agent.run(
            prompt="test",
            provider="ollama",
            options={"model": "llama3"},
            api_keys={},
        )

        # MCP plugin factory should NEVER be called
        MockFactory.assert_not_called()
        # Plugin should NOT be registered on the kernel
        mock_kernel_instance.add_plugin.assert_not_called()
        # But the prompt should still be invoked
        mock_kernel_instance.invoke_prompt.assert_called_once()
        assert result["content"] == "Plain LLM response"

        # When use_tools is False, system message must NOT contain tool-use instruction
        call_kwargs = mock_kernel_instance.invoke_prompt.call_args[1]
        full_prompt = call_kwargs.get("prompt", "")
        assert "try to use available tools" not in full_prompt
        assert "create or modify content" not in full_prompt
        assert "reply with plain text only" in full_prompt


@pytest.mark.asyncio
async def test_unity_agent_tool_use_but_mcp_unavailable_skips_plugin():
    """When provider supports tool use but MCP is not available, MCP plugin is NOT registered."""
    agent = UnityAgent()

    with patch("app.agents.unity_agent.Kernel") as MockKernel, \
         patch("app.agents.unity_agent.provider_registry") as MockRegistry, \
         patch("app.agents.unity_agent.unity_mcp_plugin_available_for_writing", return_value=False), \
         patch("app.agents.unity_agent.create_unity_mcp_plugin") as MockFactory:

        mock_kernel_instance = MockKernel.return_value
        mock_kernel_instance.invoke_prompt = AsyncMock(return_value="Plain text fallback")

        mock_caps = MagicMock()
        mock_caps.api_key_name = "openai"
        mock_caps.supports_tool_use = True
        MockRegistry.get.return_value = mock_caps
        MockRegistry.create_chat_service.return_value = MagicMock()

        await agent.run(
            prompt="test",
            provider="openai",
            options={"model": "gpt-4"},
            api_keys={"openai": "sk-test"},
        )

        MockFactory.assert_not_called()
        mock_kernel_instance.add_plugin.assert_not_called()
        mock_kernel_instance.invoke_prompt.assert_called_once()
        call_kwargs = mock_kernel_instance.invoke_prompt.call_args[1]
        assert "reply with plain text only" in call_kwargs.get("prompt", "")


@pytest.mark.asyncio
async def test_unity_agent_appends_enhanced_guidance():
    """
    Verify that run() method appends enhanced capabilities guidance to system message.

    Validates: Requirements 1.1, 9.7

    When UnityAgent.run() is called, the system message should include the
    enhanced capabilities guidance from _build_enhanced_capabilities_guidance().
    """
    agent = UnityAgent()

    with patch("app.agents.unity_agent.Kernel") as MockKernel, \
         patch("app.agents.unity_agent.provider_registry") as MockRegistry, \
         patch("app.agents.unity_agent.unity_mcp_plugin_available_for_writing", return_value=True), \
         patch("app.agents.unity_agent.create_unity_mcp_plugin") as MockFactory:

        # Mock Kernel
        mock_kernel_instance = MockKernel.return_value
        mock_kernel_instance.invoke_prompt = AsyncMock(return_value="Success")

        # Mock Registry
        mock_caps = MagicMock()
        mock_caps.api_key_name = "openai"
        mock_caps.supports_tool_use = True
        MockRegistry.get.return_value = mock_caps
        MockRegistry.create_chat_service.return_value = MagicMock()

        # Mock Plugin Factory Context Manager
        mock_plugin_instance = MagicMock()
        mock_context_manager = AsyncMock()
        mock_context_manager.__aenter__.return_value = mock_plugin_instance
        mock_context_manager.__aexit__.return_value = None
        MockFactory.return_value = mock_context_manager

        await agent.run(
            prompt="Create an FPS prototype",
            provider="openai",
            options={"model": "gpt-4"},
            api_keys={"openai": "sk-test"},
        )

        # Verify invoke_prompt was called
        mock_kernel_instance.invoke_prompt.assert_called_once()

        # Get the full prompt that was passed to invoke_prompt
        call_kwargs = mock_kernel_instance.invoke_prompt.call_args[1]
        full_prompt = call_kwargs.get("prompt", "")

        # Verify enhanced guidance sections are present in the prompt
        required_sections = [
            "SCENE BUILDING:",
            "UI CREATION:",
            "ANIMATION & CUTSCENES:",
            "INPUT & INTERACTION:",
            "PROTOTYPING:",
            "MEDIA IMPORT:",
            "WORKFLOW RECOMMENDATIONS:",
        ]

        for section in required_sections:
            assert section in full_prompt, \
                f"Enhanced guidance section '{section}' not found in system prompt"

        # Verify key tools are mentioned
        key_tools = [
            "unity_create_detailed_scene",
            "unity_create_prototype_recipe",
            "unity_create_basic_animator",
            "unity_create_timeline",
        ]

        for tool in key_tools:
            assert tool in full_prompt, \
                f"Key tool '{tool}' not found in system prompt"

        # Verify workflow recommendations are present
        assert "For animations:" in full_prompt, \
            "Animation workflow recommendation not found"
        assert "For cutscenes:" in full_prompt, \
            "Cutscene workflow recommendation not found"
        assert "For prototypes:" in full_prompt, \
            "Prototype workflow recommendation not found"


@pytest.mark.asyncio
async def test_unity_agent_enhanced_guidance_with_custom_system_prompt():
    """
    Verify enhanced guidance is appended even when custom system_prompt is provided.

    Validates: Requirement 9.7

    When a custom system_prompt is provided, the enhanced capabilities guidance
    should still be appended to ensure the LLM has access to tool information.
    """
    agent = UnityAgent()
    custom_prompt = "You are a specialized Unity assistant for game prototyping."

    with patch("app.agents.unity_agent.Kernel") as MockKernel, \
         patch("app.agents.unity_agent.provider_registry") as MockRegistry, \
         patch("app.agents.unity_agent.unity_mcp_plugin_available_for_writing", return_value=True), \
         patch("app.agents.unity_agent.create_unity_mcp_plugin") as MockFactory:

        # Mock Kernel
        mock_kernel_instance = MockKernel.return_value
        mock_kernel_instance.invoke_prompt = AsyncMock(return_value="Success")

        # Mock Registry
        mock_caps = MagicMock()
        mock_caps.api_key_name = "openai"
        mock_caps.supports_tool_use = True
        MockRegistry.get.return_value = mock_caps
        MockRegistry.create_chat_service.return_value = MagicMock()

        # Mock Plugin Factory Context Manager
        mock_plugin_instance = MagicMock()
        mock_context_manager = AsyncMock()
        mock_context_manager.__aenter__.return_value = mock_plugin_instance
        mock_context_manager.__aexit__.return_value = None
        MockFactory.return_value = mock_context_manager

        await agent.run(
            prompt="Create a platformer",
            provider="openai",
            options={"model": "gpt-4"},
            api_keys={"openai": "sk-test"},
            system_prompt=custom_prompt,
        )

        # Get the full prompt
        call_kwargs = mock_kernel_instance.invoke_prompt.call_args[1]
        full_prompt = call_kwargs.get("prompt", "")

        # Verify custom prompt is present
        assert custom_prompt in full_prompt, \
            "Custom system prompt not found in full prompt"

        # Verify enhanced guidance is also present
        assert "SCENE BUILDING:" in full_prompt, \
            "Enhanced guidance not appended when custom system_prompt provided"
        assert "unity_create_prototype_recipe" in full_prompt, \
            "Enhanced guidance tools not found when custom system_prompt provided"


@pytest.mark.asyncio
async def test_unity_agent_enhanced_guidance_without_tools():
    """
    Verify enhanced guidance is appended even when tools are not available.

    Validates: Requirement 9.7

    The enhanced capabilities guidance should be appended to the system message
    regardless of whether MCP tools are available, to maintain consistency.
    """
    agent = UnityAgent()

    with patch("app.agents.unity_agent.Kernel") as MockKernel, \
         patch("app.agents.unity_agent.provider_registry") as MockRegistry, \
         patch("app.agents.unity_agent.unity_mcp_plugin_available_for_writing", return_value=False):

        # Mock Kernel
        mock_kernel_instance = MockKernel.return_value
        mock_kernel_instance.invoke_prompt = AsyncMock(return_value="Plain text response")

        # Mock Registry
        mock_caps = MagicMock()
        mock_caps.api_key_name = "openai"
        mock_caps.supports_tool_use = False
        MockRegistry.get.return_value = mock_caps
        MockRegistry.create_chat_service.return_value = MagicMock()

        await agent.run(
            prompt="test",
            provider="openai",
            options={"model": "gpt-4"},
            api_keys={"openai": "sk-test"},
        )

        # Get the full prompt
        call_kwargs = mock_kernel_instance.invoke_prompt.call_args[1]
        full_prompt = call_kwargs.get("prompt", "")

        # Verify enhanced guidance is present even without tools
        assert "SCENE BUILDING:" in full_prompt, \
            "Enhanced guidance not appended when tools unavailable"
        assert "unity_create_detailed_scene" in full_prompt, \
            "Enhanced guidance tools not mentioned when tools unavailable"


# ======================================================================
# Input Validation Tests (Task 1.3)
# ======================================================================


@pytest.mark.asyncio
async def test_unity_agent_empty_prompt_raises_error():
    """
    Verify that empty prompt raises ValueError with clear message.

    Validates: Requirement 10.4

    When UnityAgent.run() is called with an empty prompt string,
    it should raise ValueError with message "prompt must be non-empty string".
    """
    agent = UnityAgent()

    # Test with empty string
    with pytest.raises(ValueError, match="prompt must be non-empty string"):
        await agent.run(
            prompt="",
            provider="openai",
            options={"model": "gpt-4"},
            api_keys={"openai": "sk-test"},
        )

    # Test with whitespace-only string
    with pytest.raises(ValueError, match="prompt must be non-empty string"):
        await agent.run(
            prompt="   ",
            provider="openai",
            options={"model": "gpt-4"},
            api_keys={"openai": "sk-test"},
        )

    # Test with None (if type checking allows)
    with pytest.raises(ValueError, match="prompt must be non-empty string"):
        await agent.run(
            prompt=None,  # type: ignore
            provider="openai",
            options={"model": "gpt-4"},
            api_keys={"openai": "sk-test"},
        )


@pytest.mark.asyncio
async def test_unity_agent_invalid_project_path_raises_error(tmp_path):
    """
    Verify that non-existent project_path raises ValueError with clear message.

    Validates: Requirement 10.5

    When UnityAgent.run() is called with a project_path that does not exist,
    it should raise ValueError with message "project_path does not exist: {path}".
    """
    agent = UnityAgent()

    # Create a path that doesn't exist
    non_existent_path = tmp_path / "does_not_exist" / "project"
    # Build the match pattern without backslash escapes in f-strings (Python 3.10 compat)
    escaped_path = str(non_existent_path).replace("\\", "\\\\")
    match_pattern = "project_path does not exist: " + escaped_path

    with pytest.raises(ValueError, match=match_pattern):
        await agent.run(
            prompt="Create a cube",
            provider="openai",
            options={"model": "gpt-4"},
            api_keys={"openai": "sk-test"},
            project_path=str(non_existent_path),
        )


@pytest.mark.asyncio
async def test_unity_agent_valid_project_path_succeeds(tmp_path):
    """
    Verify that valid project_path passes validation.

    Validates: Requirement 10.5

    When UnityAgent.run() is called with a project_path that exists,
    validation should pass and the method should proceed normally.
    """
    agent = UnityAgent()

    # Create a valid project directory
    project_path = tmp_path / "valid_project"
    project_path.mkdir()

    with patch("app.agents.unity_agent.Kernel") as MockKernel, \
         patch("app.agents.unity_agent.provider_registry") as MockRegistry, \
         patch("app.agents.unity_agent.unity_mcp_plugin_available_for_writing", return_value=True), \
         patch("app.agents.unity_agent.create_unity_mcp_plugin") as MockFactory:

        # Mock Kernel
        mock_kernel_instance = MockKernel.return_value
        mock_kernel_instance.invoke_prompt = AsyncMock(return_value="Success")

        # Mock Registry
        mock_caps = MagicMock()
        mock_caps.api_key_name = "openai"
        mock_caps.supports_tool_use = True
        MockRegistry.get.return_value = mock_caps
        MockRegistry.create_chat_service.return_value = MagicMock()

        # Mock Plugin Factory Context Manager
        mock_plugin_instance = MagicMock()
        mock_context_manager = AsyncMock()
        mock_context_manager.__aenter__.return_value = mock_plugin_instance
        mock_context_manager.__aexit__.return_value = None
        MockFactory.return_value = mock_context_manager

        # Should not raise any validation errors
        result = await agent.run(
            prompt="Create a cube",
            provider="openai",
            options={"model": "gpt-4"},
            api_keys={"openai": "sk-test"},
            project_path=str(project_path),
        )

        assert "content" in result
        assert result["content"] == "Success"


@pytest.mark.asyncio
async def test_unity_agent_none_project_path_succeeds():
    """
    Verify that None project_path (optional parameter) passes validation.

    Validates: Requirement 10.5

    When UnityAgent.run() is called without project_path (None),
    validation should pass since project_path is optional.
    """
    agent = UnityAgent()

    with patch("app.agents.unity_agent.Kernel") as MockKernel, \
         patch("app.agents.unity_agent.provider_registry") as MockRegistry, \
         patch("app.agents.unity_agent.unity_mcp_plugin_available_for_writing", return_value=True), \
         patch("app.agents.unity_agent.create_unity_mcp_plugin") as MockFactory:

        # Mock Kernel
        mock_kernel_instance = MockKernel.return_value
        mock_kernel_instance.invoke_prompt = AsyncMock(return_value="Success")

        # Mock Registry
        mock_caps = MagicMock()
        mock_caps.api_key_name = "openai"
        mock_caps.supports_tool_use = True
        MockRegistry.get.return_value = mock_caps
        MockRegistry.create_chat_service.return_value = MagicMock()

        # Mock Plugin Factory Context Manager
        mock_plugin_instance = MagicMock()
        mock_context_manager = AsyncMock()
        mock_context_manager.__aenter__.return_value = mock_plugin_instance
        mock_context_manager.__aexit__.return_value = None
        MockFactory.return_value = mock_context_manager

        # Should not raise any validation errors
        result = await agent.run(
            prompt="Create a cube",
            provider="openai",
            options={"model": "gpt-4"},
            api_keys={"openai": "sk-test"},
            project_path=None,
        )

        assert "content" in result
        assert result["content"] == "Success"


@pytest.mark.asyncio
async def test_unity_agent_validation_logs_errors(caplog):
    """
    Verify that validation errors are logged before raising exceptions.

    Validates: Requirement 10.7

    When input validation fails, the error should be logged before
    raising the ValueError exception.
    """
    import logging

    agent = UnityAgent()

    # Test empty prompt logging
    with caplog.at_level(logging.ERROR):
        with pytest.raises(ValueError, match="prompt must be non-empty string"):
            await agent.run(
                prompt="",
                provider="openai",
                options={"model": "gpt-4"},
                api_keys={"openai": "sk-test"},
            )

    assert "Input validation failed: prompt must be non-empty string" in caplog.text

    # Clear log for next test
    caplog.clear()

    # Test invalid project_path logging
    with caplog.at_level(logging.ERROR):
        with pytest.raises(ValueError, match="project_path does not exist"):
            await agent.run(
                prompt="Create a cube",
                provider="openai",
                options={"model": "gpt-4"},
                api_keys={"openai": "sk-test"},
                project_path="/nonexistent/path",
            )

    assert "Input validation failed: project_path does not exist" in caplog.text


@pytest.mark.asyncio
async def test_unity_agent_validation_order():
    """
    Verify that input validation occurs before other validations.

    Validates: Requirements 10.4, 10.5

    Input validation (prompt, project_path) should occur first,
    before provider and model validation.
    """
    agent = UnityAgent()

    # Empty prompt should fail before provider validation
    with pytest.raises(ValueError, match="prompt must be non-empty string"):
        await agent.run(
            prompt="",
            provider=None,  # This would normally fail, but prompt validation comes first
            options={},
            api_keys={},
        )

    # Invalid project_path should fail before provider validation
    with pytest.raises(ValueError, match="project_path does not exist"):
        await agent.run(
            prompt="Valid prompt",
            provider=None,  # This would normally fail, but project_path validation comes first
            options={},
            api_keys={},
            project_path="/nonexistent/path",
        )
