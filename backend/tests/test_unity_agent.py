
"""
Tests for the UnityAgent and the ``_build_sk_service`` helper.

Covers provider-specific service construction (OpenAI, DeepSeek,
OpenRouter, Groq, Azure), unsupported-provider error, and
missing argument validation.
"""


import os
import sys
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.providers import Modality, ProviderNotSupportedError, provider_registry
from app.agents.unity_agent import UnityAgent, _build_sk_service

######################################################################
# _build_sk_service unit tests
######################################################################


class TestBuildSkService:
    """Unit tests for the _build_sk_service helper."""

    def test_missing_model_raises(self) -> None:
        """Missing 'model' in options raises ValueError."""
        with pytest.raises(ValueError, match="Model must be specified"):
            _build_sk_service("openai", {}, {"openai_api_key": "k"})

    @patch("app.agents.unity_agent.OpenAIChatCompletion")
    def test_openai_service(self, mock_cls: MagicMock) -> None:
        """OpenAI uses direct OpenAIChatCompletion (no custom client)."""
        _build_sk_service("openai", {"model": "gpt-4"}, {"openai_api_key": "sk-test"})
        mock_cls.assert_called_once_with(
            service_id="default",
            ai_model_id="gpt-4",
            api_key="sk-test",
        )

    @patch("app.agents.unity_agent.AsyncOpenAI")
    @patch("app.agents.unity_agent.OpenAIChatCompletion")
    def test_deepseek_service(self, mock_cls: MagicMock, mock_client: MagicMock) -> None:
        """DeepSeek creates AsyncOpenAI with base_url."""
        _build_sk_service("deepseek", {"model": "deepseek-chat"}, {"deepseek_api_key": "ds"})
        mock_client.assert_called_once_with(
            api_key="ds",
            base_url="https://api.deepseek.com",
        )
        mock_cls.assert_called_once_with(
            service_id="default",
            ai_model_id="deepseek-chat",
            async_client=mock_client.return_value,
        )

    @patch("app.agents.unity_agent.AsyncOpenAI")
    @patch("app.agents.unity_agent.OpenAIChatCompletion")
    def test_openrouter_service(self, mock_cls: MagicMock, mock_client: MagicMock) -> None:
        """OpenRouter creates AsyncOpenAI with OpenRouter base_url."""
        _build_sk_service("openrouter", {"model": "auto"}, {"openrouter_api_key": "or-k"})
        mock_client.assert_called_once_with(
            api_key="or-k",
            base_url="https://openrouter.ai/api/v1",
        )

    @patch("app.agents.unity_agent.AsyncOpenAI")
    @patch("app.agents.unity_agent.OpenAIChatCompletion")
    def test_groq_service(self, mock_cls: MagicMock, mock_client: MagicMock) -> None:
        """Groq creates AsyncOpenAI with Groq base_url."""
        _build_sk_service("groq", {"model": "llama-3"}, {"groq_api_key": "g-k"})
        mock_client.assert_called_once_with(
            api_key="g-k",
            base_url="https://api.groq.com/openai/v1",
        )

    @patch("app.agents.unity_agent.AzureChatCompletion")
    def test_azure_service(self, mock_azure: MagicMock) -> None:
        """Azure provider creates AzureChatCompletion."""
        # Azure is a special registration; patch the registry to recognise it
        from app.services.providers import Modality, ProviderCapabilities, ProviderRegistry

        reg = ProviderRegistry()
        reg.register(ProviderCapabilities(
            name="azure", api_key_name="azure_api_key",
            modalities={Modality.LLM}, openai_compatible=False,
        ))
        with patch("app.agents.unity_agent.provider_registry", reg):
            _build_sk_service(
                "azure",
                {"model": "gpt-4-deploy"},
                {"AZURE_OPENAI_ENDPOINT": "https://my.azure.com", "AZURE_OPENAI_KEY": "az-key"},
            )
            mock_azure.assert_called_once()

    def test_google_raises_not_implemented(self) -> None:
        """Google (non-OpenAI-compatible) raises NotImplementedError."""
        with pytest.raises(NotImplementedError, match="not currently supported"):
            _build_sk_service("google", {"model": "gemini"}, {"google_api_key": "k"})

    def test_anthropic_raises_not_implemented(self) -> None:
        """Anthropic (non-OpenAI-compatible) raises NotImplementedError."""
        with pytest.raises(NotImplementedError, match="not currently supported"):
            _build_sk_service("anthropic", {"model": "claude"}, {"anthropic_api_key": "k"})


# ======================================================================
# UnityAgent integration tests
# ======================================================================


@pytest.mark.asyncio
async def test_unity_agent_openai():
    """OpenAI provider constructs the correct SK service."""
    agent = UnityAgent()

    with patch("app.agents.unity_agent.Kernel") as MockKernel, \
         patch("app.agents.unity_agent.OpenAIChatCompletion") as MockOpenAIService, \
         patch("app.agents.unity_agent.UnityMCPPluginWrapper") as MockPlugin:

        mock_kernel_instance = MockKernel.return_value
        mock_kernel_instance.invoke_prompt = AsyncMock(return_value="Success")

        mock_plugin_instance = AsyncMock()
        mock_plugin_instance.initialize.return_value = MagicMock()
        MockPlugin.return_value = mock_plugin_instance

        await agent.run(
            prompt="test",
            provider="openai",
            options={"model": "gpt-4"},
            api_keys={"openai_api_key": "sk-test"}
        )

        MockOpenAIService.assert_called_with(
            service_id="default",
            ai_model_id="gpt-4",
            api_key="sk-test"
        )
        mock_kernel_instance.add_service.assert_called()


@pytest.mark.asyncio
async def test_unity_agent_deepseek():
    """DeepSeek provider constructs AsyncOpenAI with base_url."""
    agent = UnityAgent()

    with patch("app.agents.unity_agent.Kernel") as MockKernel, \
         patch("app.agents.unity_agent.OpenAIChatCompletion") as MockOpenAIService, \
         patch("app.agents.unity_agent.UnityMCPPluginWrapper") as MockPlugin, \
         patch("app.agents.unity_agent.AsyncOpenAI") as MockAsyncClient:

        mock_kernel_instance = MockKernel.return_value
        mock_kernel_instance.invoke_prompt = AsyncMock(return_value="Success")

        mock_plugin_instance = AsyncMock()
        mock_plugin_instance.initialize.return_value = MagicMock()
        MockPlugin.return_value = mock_plugin_instance

        await agent.run(
            prompt="test",
            provider="deepseek",
            options={"model": "deepseek-chat"},
            api_keys={"deepseek_api_key": "sk-deepseek"}
        )

        MockAsyncClient.assert_called_with(
            api_key="sk-deepseek",
            base_url="https://api.deepseek.com"
        )

        MockOpenAIService.assert_called_with(
            service_id="default",
            ai_model_id="deepseek-chat",
            async_client=MockAsyncClient.return_value
        )


@pytest.mark.asyncio
async def test_unity_agent_unsupported_provider():
    """Non-OpenAI-compatible providers raise NotImplementedError."""
    agent = UnityAgent()

    with pytest.raises(NotImplementedError):
        await agent.run(
            prompt="test",
            provider="google",
            options={"model": "gemini"},
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
         patch("app.agents.unity_agent.OpenAIChatCompletion"), \
         patch("app.agents.unity_agent.UnityMCPPluginWrapper") as MockPlugin:

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
