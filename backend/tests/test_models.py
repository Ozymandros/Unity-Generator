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


@pytest.fixture(autouse=True)
def _isolate_db(monkeypatch: pytest.MonkeyPatch, tmp_path):
    """Redirect the DB to a temp file so tests never touch real data."""
    db_path = str(tmp_path / "test.db")
    monkeypatch.setenv("UNITY_GEN_DB", db_path)
    # Force module-level helpers to pick up the new path
    from app.core import db as db_mod
    monkeypatch.setattr(db_mod, "get_db_path", lambda: db_path)
    db_mod.init_db()
    yield
    if os.path.exists(db_path):
        os.remove(db_path)


class TestDbModels:
    """Tests for low-level db CRUD functions."""

    def test_add_and_get_models(self):
        from app.core.db import add_model, get_models

        add_model("openai", "gpt-4o", "GPT-4o")
        add_model("openai", "gpt-4o-mini", "GPT-4o Mini")

        models = get_models("openai")
        assert len(models) == 2
        values = {m["value"] for m in models}
        assert "gpt-4o" in values
        assert "gpt-4o-mini" in values

    def test_get_models_empty_provider(self):
        from app.core.db import get_models

        models = get_models("nonexistent")
        assert models == []

    def test_get_all_models(self):
        from app.core.db import add_model, get_all_models

        add_model("openai", "gpt-4o", "GPT-4o")
        add_model("google", "gemini-1.5-pro", "Gemini 1.5 Pro")

        all_models = get_all_models()
        assert "openai" in all_models
        assert "google" in all_models
        assert len(all_models["openai"]) == 1

    def test_remove_model(self):
        from app.core.db import add_model, get_models, remove_model

        add_model("openai", "gpt-4o", "GPT-4o")
        assert len(get_models("openai")) == 1

        deleted = remove_model("openai", "gpt-4o")
        assert deleted is True
        assert len(get_models("openai")) == 0

    def test_remove_model_not_found(self):
        from app.core.db import remove_model

        deleted = remove_model("openai", "nonexistent")
        assert deleted is False

    def test_add_duplicate_raises(self):
        from app.core.db import add_model

        add_model("openai", "gpt-4o", "GPT-4o")
        with pytest.raises(sqlite3.IntegrityError):
            add_model("openai", "gpt-4o", "GPT-4o Duplicate")

    def test_add_model_empty_value_raises(self):
        from app.core.db import add_model

        with pytest.raises(ValueError):
            add_model("openai", "", "Empty")

    def test_seed_default_models_idempotent(self):
        from app.core.db import get_all_models, seed_default_models

        defaults = {
            "openai": [{"value": "gpt-4o", "label": "GPT-4o"}],
            "google": [{"value": "gemini-1.5-pro", "label": "Gemini 1.5 Pro"}],
        }
        seed_default_models(defaults)
        all1 = get_all_models()
        assert len(all1["openai"]) == 1

        # Second call should be a no-op
        seed_default_models({
            "openai": [
                {"value": "gpt-4o", "label": "GPT-4o"},
                {"value": "gpt-4o-mini", "label": "GPT-4o Mini"},
            ],
        })
        all2 = get_all_models()
        # Should NOT have added the extra model
        assert len(all2["openai"]) == 1

    def test_provider_case_insensitive(self):
        from app.core.db import add_model, get_models

        add_model("OpenAI", "gpt-4o", "GPT-4o")
        models = get_models("openai")
        assert len(models) == 1


# ---------------------------------------------------------------------------
# Router endpoint tests
# ---------------------------------------------------------------------------


@pytest.fixture
def client():
    """Create a TestClient for the FastAPI app."""
    from app.main import app
    return TestClient(app)


class TestModelsRouter:
    """Integration tests for /api/models endpoints."""

    def test_list_all_empty(self, client: TestClient):
        resp = client.get("/api/models")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert isinstance(data["data"]["models"], dict)

    def test_add_and_list(self, client: TestClient):
        # Add a model
        resp = client.post(
            "/api/models/openai",
            json={"value": "gpt-4o", "label": "GPT-4o"},
        )
        assert resp.status_code == 200
        assert resp.json()["success"] is True

        # List provider models
        resp = client.get("/api/models/openai")
        assert resp.status_code == 200
        models = resp.json()["data"]["models"]
        assert len(models) == 1
        assert models[0]["value"] == "gpt-4o"

    def test_add_duplicate_409(self, client: TestClient):
        client.post(
            "/api/models/openai",
            json={"value": "gpt-4o", "label": "GPT-4o"},
        )
        resp = client.post(
            "/api/models/openai",
            json={"value": "gpt-4o", "label": "GPT-4o Again"},
        )
        assert resp.status_code == 409

    def test_delete_model(self, client: TestClient):
        client.post(
            "/api/models/openai",
            json={"value": "gpt-4o", "label": "GPT-4o"},
        )
        resp = client.delete("/api/models/openai/gpt-4o")
        assert resp.status_code == 200
        assert resp.json()["data"]["deleted"] is True

        # Should be gone
        resp = client.get("/api/models/openai")
        assert len(resp.json()["data"]["models"]) == 0

    def test_delete_not_found_404(self, client: TestClient):
        resp = client.delete("/api/models/openai/nonexistent")
        assert resp.status_code == 404

    def test_add_empty_value_422(self, client: TestClient):
        resp = client.post(
            "/api/models/openai",
            json={"value": "", "label": "Empty"},
        )
        assert resp.status_code == 422
