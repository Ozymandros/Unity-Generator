import os

import pytest

from app.core.db import init_db
from app.repositories import get_api_key_repo, get_model_repo, get_provider_repo, get_system_prompt_repo
from app.services.providers.capabilities import Modality, ProviderCapabilities


@pytest.fixture(autouse=True)
def setup_test_db(tmp_path):
    os.environ["DATABASE_DIR"] = str(tmp_path)
    init_db()
    yield
    # Cleanup env var after test
    if "DATABASE_DIR" in os.environ:
        del os.environ["DATABASE_DIR"]

def test_provider_repository():
    repo = get_provider_repo()

    caps = ProviderCapabilities(
        name="test_provider",
        api_key_name="test_key",
        modalities={Modality.LLM},
        default_models={Modality.LLM: "test-model"}
    )

    repo.save(caps)
    all_providers = repo.get_all()
    assert "test_provider" in [p.name for p in all_providers]

    fetched = repo.get_by_name("test_provider")
    assert fetched is not None
    assert fetched.name == "test_provider"
    assert fetched.api_key_name == "test_key"
    assert fetched.default_models[Modality.LLM] == "test-model"


def test_provider_delete_cascades_models():
    """Deleting a provider removes its models (no orphan rows in provider_models)."""
    provider_repo = get_provider_repo()
    model_repo = get_model_repo()

    caps = ProviderCapabilities(
        name="cascade_test",
        api_key_name="key",
        modalities={Modality.LLM},
        default_models={Modality.LLM: "m1"},
    )
    provider_repo.save(caps)
    model_repo.add("cascade_test", "model-a", "Model A", "llm")
    model_repo.add("cascade_test", "model-b", "Model B", "llm")

    models_before = model_repo.get_by_provider("cascade_test")
    assert len(models_before) == 2

    deleted = provider_repo.delete("cascade_test")
    assert deleted is True

    models_after = model_repo.get_by_provider("cascade_test")
    assert len(models_after) == 0

def test_model_repository():
    repo = get_model_repo()

    repo.add("test_provider", "model-1", "Model One", "llm")
    repo.add("test_provider", "model-2", "Model Two", "llm")

    models = repo.get_by_provider("test_provider")
    assert len(models) == 2
    assert models[0]["value"] == "model-1"
    assert models[1]["label"] == "Model Two"

    repo.remove("test_provider", "model-1")
    models = repo.get_by_provider("test_provider")
    assert len(models) == 1
    assert models[0]["value"] == "model-2"

def test_api_key_repository():
    repo = get_api_key_repo()

    repo.save("openai", "sk-test")
    repo.save("anthropic", "ant-test")

    keys = repo.get_all()
    assert keys["openai"] == "sk-test"
    assert keys["anthropic"] == "ant-test"

    repo.delete("openai")
    keys = repo.get_all()
    assert "openai" not in keys
    assert "anthropic" in keys

def test_system_prompt_repository():
    repo = get_system_prompt_repo()

    repo.save("code", "Expert coder")
    repo.save("text", "Helpful assistant")

    prompts = repo.get_all()
    assert prompts["code"] == "Expert coder"
    assert prompts["text"] == "Helpful assistant"

    repo.save("code", "Senior dev")
    prompts = repo.get_all()
    assert prompts["code"] == "Senior dev"
