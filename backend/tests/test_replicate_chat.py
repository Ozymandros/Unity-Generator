"""
Tests for Replicate chat completion adapter (predictions API).

Covers ReplicateChatCompletion: chat history to prompt conversion,
execution settings mapping, and that create_chat_service returns
the native Replicate adapter for provider 'replicate'.
"""

from unittest.mock import AsyncMock

import pytest
from semantic_kernel.connectors.ai.prompt_execution_settings import PromptExecutionSettings
from semantic_kernel.contents.chat_history import ChatHistory
from semantic_kernel.contents.chat_message_content import ChatMessageContent
from semantic_kernel.contents.utils.author_role import AuthorRole

from app.services.providers.connectors.replicate import (
    ReplicateChatCompletion,
    _chat_history_to_prompt,
)
from app.services.providers.registry import Modality, ProviderRegistry, provider_registry


class TestChatHistoryToPrompt:
    """Tests for _chat_history_to_prompt helper."""

    def test_empty_messages_returns_empty_string(self) -> None:
        history = ChatHistory(messages=[])
        assert _chat_history_to_prompt(history) == ""

    def test_single_user_message(self) -> None:
        history = ChatHistory(messages=[
            ChatMessageContent(role=AuthorRole.USER, content="Hello"),
        ])
        assert _chat_history_to_prompt(history) == "user: Hello"

    def test_system_and_user_messages(self) -> None:
        history = ChatHistory(messages=[
            ChatMessageContent(role=AuthorRole.SYSTEM, content="You are helpful."),
            ChatMessageContent(role=AuthorRole.USER, content="Hi"),
        ])
        out = _chat_history_to_prompt(history)
        assert "system: You are helpful." in out
        assert "user: Hi" in out
        assert out.strip().count("\n") == 1


class TestReplicateChatCompletion:
    """Unit tests for ReplicateChatCompletion with mocked Replicate API."""

    @pytest.mark.asyncio
    async def test_get_chat_message_contents_returns_assistant_content(self) -> None:
        service = ReplicateChatCompletion(
            api_key="test-token",
            model_id="meta/llama-2-7b",
            service_id="replicate",
        )
        service._create_prediction = AsyncMock(return_value="https://api.replicate.com/v1/predictions/abc")
        service._poll_prediction = AsyncMock(return_value="Generated response text")

        history = ChatHistory(messages=[
            ChatMessageContent(role=AuthorRole.USER, content="Say hello"),
        ])
        settings = PromptExecutionSettings(service_id="replicate", max_tokens=100, temperature=0.7)

        result = await service.get_chat_message_contents(chat_history=history, settings=settings)

        assert len(result) == 1
        assert result[0].role == AuthorRole.ASSISTANT
        assert result[0].content == "Generated response text"
        assert result[0].ai_model_id == "meta/llama-2-7b"
        service._create_prediction.assert_called_once()
        call_input = service._create_prediction.call_args[0][0]
        assert call_input["prompt"] == "user: Say hello"
        assert call_input["max_new_tokens"] == 100
        assert call_input["temperature"] == 0.7

    @pytest.mark.asyncio
    async def test_get_chat_message_contents_list_output_joined(self) -> None:
        service = ReplicateChatCompletion(
            api_key="test-token",
            model_id="meta/llama-2-7b",
        )
        service._create_prediction = AsyncMock(return_value="https://api.replicate.com/v1/predictions/xyz")
        service._poll_prediction = AsyncMock(return_value=["Hello", " ", "world"])

        history = ChatHistory(messages=[
            ChatMessageContent(role=AuthorRole.USER, content="Hi"),
        ])
        settings = PromptExecutionSettings(service_id="replicate")

        result = await service.get_chat_message_contents(chat_history=history, settings=settings)

        assert len(result) == 1
        assert result[0].content == "Hello world"

    @pytest.mark.asyncio
    async def test_empty_prompt_returns_no_input_message(self) -> None:
        service = ReplicateChatCompletion(
            api_key="test-token",
            model_id="meta/llama-2-7b",
        )
        service._create_prediction = AsyncMock()
        history = ChatHistory(messages=[])
        settings = PromptExecutionSettings(service_id="replicate")

        result = await service.get_chat_message_contents(chat_history=history, settings=settings)

        assert len(result) == 1
        assert result[0].role == AuthorRole.ASSISTANT
        assert result[0].content == "No input provided."
        service._create_prediction.assert_not_called()

    @pytest.mark.asyncio
    async def test_streaming_not_implemented(self) -> None:
        service = ReplicateChatCompletion(api_key="tk", model_id="meta/llama-2-7b")
        history = ChatHistory(messages=[
            ChatMessageContent(role=AuthorRole.USER, content="Hi"),
        ])
        settings = PromptExecutionSettings(service_id="replicate")

        with pytest.raises(NotImplementedError, match="streaming"):
            async for _ in service.get_streaming_chat_message_contents(
                chat_history=history, settings=settings
            ):
                pass


class TestRegistryReplicateChat:
    """Tests that the registry returns ReplicateChatCompletion for replicate."""

    def test_create_chat_service_replicate_returns_replicate_chat_completion(self) -> None:
        reg = ProviderRegistry()
        reg.load_from_db()
        caps = reg.get("replicate")
        assert Modality.LLM in caps.modalities

        service = reg.create_chat_service(
            "replicate",
            api_key="r8_test_key",
            model_id=None,
            service_id="replicate",
        )

        assert isinstance(service, ReplicateChatCompletion)
        assert service.ai_model_id == caps.default_models[Modality.LLM]
        assert service.model_id == caps.default_models[Modality.LLM]

    def test_replicate_default_llm_is_meta_llama_2_7b(self) -> None:
        assert "replicate" in provider_registry.priority_list(Modality.LLM)
        caps = provider_registry.get("replicate")
        assert caps.default_models.get(Modality.LLM) == "meta/llama-2-7b"

    def test_replicate_not_openai_compatible(self) -> None:
        caps = provider_registry.get("replicate")
        assert caps.openai_compatible is False
