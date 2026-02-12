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
