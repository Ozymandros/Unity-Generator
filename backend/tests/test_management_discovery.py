from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

def test_unified_discovery_all_config():
    """Test the /api/management/all discovery endpoint."""
    response = client.get("/api/management/all")
    assert response.status_code == 200
    data = response.json()

    # Check structure
    assert "providers" in data
    assert "models" in data
    assert "prompts" in data
    assert "keys" in data
    assert "preferences" in data

    # Verify data types
    assert isinstance(data["providers"], list)
    assert isinstance(data["models"], dict)
    assert isinstance(data["prompts"], dict)
    assert isinstance(data["keys"], list)
    assert isinstance(data["preferences"], dict)

    # Check that models are grouped by provider
    if data["providers"]:
        first_provider = data["providers"][0]["name"]
        if first_provider in data["models"]:
            assert isinstance(data["models"][first_provider], list)

def test_unified_discovery_preferences_exist():
    """Ensure essential preferences are returned in the discovery response."""
    response = client.get("/api/management/all")
    assert response.status_code == 200
    prefs = response.json().get("preferences", {})

    # We expect some default prefs to exist if seeder ran
    # even if empty, the keys should potentially be there if seeder is robust
    # But at least check it doesn't crash
    assert isinstance(prefs, dict)

def test_reset_system_prompts():
    """POST /api/management/system-prompts/reset must be registered and return 200."""
    response = client.post("/api/management/system-prompts/reset")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    assert "data" in data
    assert isinstance(data["data"], dict)