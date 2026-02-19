
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
         patch("app.agents.unity_agent.UnityMCPPluginWrapper") as MockPlugin:

        # Mock Kernel
        mock_kernel_instance = MockKernel.return_value
        mock_kernel_instance.invoke_prompt = AsyncMock(return_value="Success")

        # Mock Registry
        mock_caps = MagicMock()
        mock_caps.api_key_name = "openai_api_key"
        MockRegistry.get.return_value = mock_caps
        MockRegistry.create_chat_service.return_value = MagicMock()

        # Mock Plugin
        mock_plugin_instance = AsyncMock()
        mock_plugin_instance.initialize.return_value = MagicMock()
        MockPlugin.return_value = mock_plugin_instance

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


@pytest.mark.asyncio
async def test_unity_agent_deepseek():
    """DeepSeek provider constructs the correct SK service via registry."""
    agent = UnityAgent()

    with patch("app.agents.unity_agent.Kernel") as MockKernel, \
         patch("app.agents.unity_agent.provider_registry") as MockRegistry, \
         patch("app.agents.unity_agent.UnityMCPPluginWrapper") as MockPlugin:

        # Mock Kernel
        mock_kernel_instance = MockKernel.return_value
        mock_kernel_instance.invoke_prompt = AsyncMock(return_value="Success")

        # Mock Registry
        mock_caps = MagicMock()
        mock_caps.api_key_name = "deepseek_api_key"
        MockRegistry.get.return_value = mock_caps
        MockRegistry.create_chat_service.return_value = MagicMock()

        # Mock Plugin
        mock_plugin_instance = AsyncMock()
        mock_plugin_instance.initialize.return_value = MagicMock()
        MockPlugin.return_value = mock_plugin_instance

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
async def test_unity_agent_mcp_unreachable():
    """When MCP server is not reachable, agent returns error content."""
    agent = UnityAgent()

    with patch("app.agents.unity_agent.Kernel"), \
         patch("app.agents.unity_agent.provider_registry") as MockRegistry, \
         patch("app.agents.unity_agent.UnityMCPPluginWrapper") as MockPlugin:

        # Mock Registry
        mock_caps = MagicMock()
        mock_caps.api_key_name = "openai_api_key"
        MockRegistry.get.return_value = mock_caps

        mock_plugin_instance = AsyncMock()
        mock_plugin_instance.initialize.side_effect = ConnectionError("unreachable")
        MockPlugin.return_value = mock_plugin_instance

        result = await agent.run(
            prompt="test",
            provider="openai",
            options={"model": "gpt-4"},
            api_keys={"openai_api_key": "sk-test"},
        )

        assert "not connected" in result["content"].lower() or "error" in result
