
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
         patch("app.agents.unity_agent.create_unity_mcp_plugin") as MockFactory:

        # Mock Kernel
        mock_kernel_instance = MockKernel.return_value
        mock_kernel_instance.invoke_prompt = AsyncMock(return_value="Success")

        # Mock Registry
        mock_caps = MagicMock()
        mock_caps.api_key_name = "openai_api_key"
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
            api_keys={"openai_api_key": "sk-test"}
        )

        MockRegistry.get.assert_called_with("openai")
        MockRegistry.create_chat_service.assert_called_with(
            "openai", "sk-test", model_id="gpt-4", endpoint=None, service_id="default"
        )
        mock_kernel_instance.add_service.assert_called()
        MockFactory.assert_called_once()
        mock_kernel_instance.add_plugin.assert_called_with(mock_plugin_instance, plugin_name="UnityMCP")


@pytest.mark.asyncio
async def test_unity_agent_deepseek():
    """DeepSeek provider constructs the correct SK service via registry."""
    agent = UnityAgent()

    with patch("app.agents.unity_agent.Kernel") as MockKernel, \
         patch("app.agents.unity_agent.provider_registry") as MockRegistry, \
         patch("app.agents.unity_agent.create_unity_mcp_plugin") as MockFactory:

        # Mock Kernel
        mock_kernel_instance = MockKernel.return_value
        mock_kernel_instance.invoke_prompt = AsyncMock(return_value="Success")

        # Mock Registry
        mock_caps = MagicMock()
        mock_caps.api_key_name = "deepseek_api_key"
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
            api_keys={"deepseek_api_key": "sk-deepseek"}
        )

        MockRegistry.get.assert_called_with("deepseek")
        MockRegistry.create_chat_service.assert_called_with(
            "deepseek", "sk-deepseek", model_id="deepseek-chat", endpoint=None, service_id="default"
        )
        MockFactory.assert_called_once()


@pytest.mark.asyncio
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
         patch("app.agents.unity_agent.create_unity_mcp_plugin") as MockFactory:

        # Mock Registry
        mock_caps = MagicMock()
        mock_caps.api_key_name = "openai_api_key"
        mock_caps.supports_tool_use = True
        MockRegistry.get.return_value = mock_caps

        # Mock Factory to raise exception on enter
        mock_context_manager = AsyncMock()
        mock_context_manager.__aenter__.side_effect = ConnectionError("Failed to connect")
        MockFactory.return_value = mock_context_manager

        result = await agent.run(
            prompt="test",
            provider="openai",
            options={"model": "gpt-4"},
            api_keys={"openai_api_key": "sk-test"},
        )

        assert "failed" in result["content"].lower()
        assert "error" in result
        assert "Failed to connect" in result["error"]


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
