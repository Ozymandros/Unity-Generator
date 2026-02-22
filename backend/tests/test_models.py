"""
Tests for the provider_models DB CRUD and models router endpoints.
"""

import os
import sqlite3
import tempfile

import pytest
from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# DB CRUD unit tests
# ---------------------------------------------------------------------------


@pytest.fixture
def client():
    """Create a TestClient for the FastAPI app."""
    from app.main import app
    return TestClient(app)


class TestModelsRouter:
    """Integration tests for /api/management/models endpoints."""

    def test_list_all_for_provider_empty(self, client: TestClient):
        # The new router uses /api/management/models/{provider}
        resp = client.get("/api/management/models/openai")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)

    def test_add_and_list(self, client: TestClient):
        # Add a model
        # POST /api/management/models takes ModelUpdate(provider, value, label)
        resp = client.post(
            "/api/management/models",
            json={"provider": "openai", "value": "gpt-4o", "label": "GPT-4o"},
        )
        assert resp.status_code == 200
        assert resp.json() == {"status": "success"}

        # List provider models
        resp = client.get("/api/management/models/openai")
        assert resp.status_code == 200
        models = resp.json()
        assert len(models) == 1
        assert models[0]["value"] == "gpt-4o"

    def test_delete_model(self, client: TestClient):
        client.post(
            "/api/management/models",
            json={"provider": "openai", "value": "gpt-4o", "label": "GPT-4o"},
        )
        resp = client.delete("/api/management/models/openai/gpt-4o")
        assert resp.status_code == 200
        assert resp.json() == {"status": "success"}

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
