# pyrefly: ignore [missing-import]
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "LifeLedger AI Service"


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "ai"


def test_predict_demo_fallback():
    response = client.post("/predict", json={"records": []})
    assert response.status_code == 200
    data = response.json()
    assert data["source"] == "demo_fallback"
    assert "predictions" in data
    assert len(data["predictions"]) > 0


def test_predict_with_records():
    sample_records = [
        {
            "date": "2026-07-20T10:00:00Z",
            "region": "Delhi",
            "blood_group": "O-",
            "sos_count": 5.0,
            "usage_units": 10.0,
            "camp_donation_volume": 8.0
        },
        {
            "date": "2026-07-21T10:00:00Z",
            "region": "Delhi",
            "blood_group": "O-",
            "sos_count": 6.0,
            "usage_units": 12.0,
            "camp_donation_volume": 7.0
        }
    ]
    response = client.post("/predict", json={"records": sample_records})
    assert response.status_code == 200
    data = response.json()
    assert data["source"] == "ai_service"
    assert len(data["predictions"]) == 1
    assert data["predictions"][0]["region"] == "Delhi"
    assert data["predictions"][0]["blood_group"] == "O-"
