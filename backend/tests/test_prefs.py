from fastapi.testclient import TestClient

from app.main import app


def test_prefs_roundtrip() -> None:
    client = TestClient(app)
    response = client.post("/prefs", json={"key": "k1", "value": "v1"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True

    response = client.get("/prefs/k1")
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True


def test_set_preferred_model_invalid_400(tmp_path) -> None:
    """Setting preferred_llm_model to a value not in the provider's list returns 400."""
    import os
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
    get_model_repo().add("openai", "gpt-4o", "GPT-4o", "llm")

    client = TestClient(app)
    client.post("/prefs", json={"key": "preferred_llm_provider", "value": "openai"})
    resp = client.post(
        "/prefs",
        json={"key": "preferred_llm_model", "value": "not-a-registered-model-xyz"},
    )
    if "DATABASE_DIR" in os.environ:
        del os.environ["DATABASE_DIR"]
    assert resp.status_code == 400
    data = resp.json()
    assert "detail" in data
    assert "not registered" in data["detail"].lower() or "provider" in data["detail"].lower()


def test_set_preferred_model_valid_200() -> None:
    """Setting preferred_llm_model to a value in the provider's list returns 200."""
    client = TestClient(app)
    client.post("/prefs", json={"key": "preferred_llm_provider", "value": "openai"})
    # Get a valid model for openai (seeded or from list)
    models_resp = client.get("/api/management/models/openai")
    assert models_resp.status_code == 200
    models = models_resp.json()
    # Prefs validation requires the model to match the provider's modality (llm)
    valid_model = next((m["value"] for m in models if m.get("modality") == "llm"), None)
    if not valid_model:
        client.post(
            "/api/management/models",
            json={"provider": "openai", "value": "gpt-4o-mini", "label": "GPT-4o Mini", "modality": "llm"},
        )
        valid_model = "gpt-4o-mini"
    resp = client.post(
        "/prefs",
        json={"key": "preferred_llm_model", "value": valid_model},
    )
    assert resp.status_code == 200
    assert resp.json().get("success") is True
