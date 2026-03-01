"""
Tests for the provider_models DB CRUD and models router endpoints.
"""

import os

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    """Create a TestClient for the FastAPI app."""
    from app.main import app
    return TestClient(app)


@pytest.fixture
def client_with_openai(tmp_path):
    """Client with a DB that has provider 'openai' so add/list/delete model tests can run."""
    os.environ["DATABASE_DIR"] = str(tmp_path)
    from app.core.db import init_db
    from app.repositories import get_provider_repo, get_model_repo
    from app.services.providers.capabilities import ProviderCapabilities, Modality

    init_db()
    caps = ProviderCapabilities(
        name="openai",
        api_key_name="openai",
        modalities={Modality.LLM},
        default_models={Modality.LLM: "gpt-4o"},
    )
    get_provider_repo().save(caps)

    from app.main import app
    yield TestClient(app)

    if "DATABASE_DIR" in os.environ:
        del os.environ["DATABASE_DIR"]


class TestModelsRouter:
    """Integration tests for /api/management/models endpoints."""

    def test_list_all_for_provider_empty(self, client: TestClient):
        # The new router uses /api/management/models/{provider}
        resp = client.get("/api/management/models/openai")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)

    def test_add_and_list(self, client_with_openai: TestClient):
        client = client_with_openai
        # Add a model
        resp = client.post(
            "/api/management/models",
            json={"provider": "openai", "value": "gpt-4o", "label": "GPT-4o"},
        )
        assert resp.status_code == 200
        assert resp.json().get("success") is True

        # List provider models
        resp = client.get("/api/management/models/openai")
        assert resp.status_code == 200
        models = resp.json()
        assert len(models) == 1
        assert models[0]["value"] == "gpt-4o"

    def test_delete_model(self, client_with_openai: TestClient):
        client = client_with_openai
        client.post(
            "/api/management/models",
            json={"provider": "openai", "value": "gpt-4o", "label": "GPT-4o"},
        )
        resp = client.delete("/api/management/models/openai/gpt-4o")
        assert resp.status_code == 200
        assert resp.json().get("success") is True

        # Should be gone
        resp = client.get("/api/management/models/openai")
        assert len(resp.json()) == 0

    def test_delete_not_found_404(self, client: TestClient):
        resp = client.delete("/api/management/models/openai/nonexistent")
        assert resp.status_code == 404

    def test_add_empty_value_422(self, client: TestClient):
        resp = client.post(
            "/api/management/models",
            json={"provider": "openai", "value": "", "label": "Empty"},
        )
        assert resp.status_code == 422

    def test_add_model_unknown_provider_400(self, client: TestClient):
        """Adding a model for a provider that does not exist returns 400."""
        resp = client.post(
            "/api/management/models",
            json={
                "provider": "nonexistent_provider_xyz",
                "value": "some-model",
                "label": "Some Model",
            },
        )
        assert resp.status_code == 400
        assert "Provider not found" in (resp.json().get("detail") or "")
