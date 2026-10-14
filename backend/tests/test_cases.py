import hashlib
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.seed_data import seed_database

@pytest.fixture(scope="module")
def client():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

    with TestClient(app) as c:
        yield c

def test_api_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_list_cases(client):
    response = client.get("/api/cases")
    assert response.status_code == 200
    cases = response.json()
    assert len(cases) >= 3
    assert any(c["case_number"] == "FG-2026-0901" for c in cases)

def test_sighting_submission_and_ai_trigger(client):
    # Submit a sighting that resembles P Yash Kumar
    sighting_payload = {
        "location_name": "Sector 9 Park Road",
        "latitude": 21.1900,
        "longitude": 81.3600,
        "sighting_time": "2026-10-14T02:00:00Z",
        "description": "Student matching description in navy blue hoodie walking with backpack.",
        "clothing_observed": "Navy blue hoodie with dark sleeves, black denim jeans.",
        "reporter_name": "Test Citizen Reporter",
        "reporter_contact": "+91 98270-11223"
    }

    response = client.post("/api/sightings", json=sighting_payload)
    assert response.status_code == 200
    sighting = response.json()
    assert sighting["status"] == "Submitted"
    assert sighting["id"] is not None

    # Check if AI candidates include this sighting
    ai_response = client.get(f"/api/ai/candidates?min_score=30")
    assert ai_response.status_code == 200
    matches = ai_response.json()
    assert len(matches) > 0

def test_evidence_verification_tamper_detection(client):
    # 1. Upload a genuine evidence file
    file_content = b"Original Authentic CCTV Surveillance Byte Stream 2026"
    expected_hash = "0x" + hashlib.sha256(file_content).hexdigest()

    # Get a valid case
    cases = client.get("/api/cases").json()
    case_id = cases[0]["id"]

    # Demo investigator login to upload
    auth_resp = client.post("/api/auth/demo-login", json={"role": "investigator"})
    token = auth_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    upload_resp = client.post(
        "/api/evidence/upload",
        data={"case_id": case_id},
        files={"file": ("cctv_frame.raw", file_content, "application/octet-stream")},
        headers=headers
    )
    assert upload_resp.status_code == 200
    evidence_data = upload_resp.json()
    assert evidence_data["sha256_hash"] == expected_hash

    # 2. Verify original file bytes -> should return is_valid: True
    verify_resp = client.post(
        "/api/evidence/verify-file",
        files={"file": ("test_verify.raw", file_content, "application/octet-stream")}
    )
    assert verify_resp.status_code == 200
    verify_data = verify_resp.json()
    assert verify_data["is_valid"] is True
    assert "VERIFIED GENUINE" in verify_data["details"]

    # 3. Verify modified/tampered file bytes -> should return is_valid: False
    tampered_content = b"TAMPERED Maliciously Altered CCTV Stream 2026"
    tampered_resp = client.post(
        "/api/evidence/verify-file",
        files={"file": ("tampered.raw", tampered_content, "application/octet-stream")}
    )
    assert tampered_resp.status_code == 200
    tampered_data = tampered_resp.json()
    assert tampered_data["is_valid"] is False
    assert "INTEGRITY FAILURE" in tampered_data["details"]
