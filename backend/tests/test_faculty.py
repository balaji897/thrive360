import pytest
from starlette.testclient import TestClient
from app.main import app
from app.services.faculty_service import FacultyService

client = TestClient(app)

def test_faculty_service_ingestion_and_uniqueness():
    service = FacultyService()
    faculty_list = service.load_and_persist()

    # 1. Verify exactly 50 faculty records
    assert len(faculty_list) == 50

    # 2. Verify all unique Faculty_IDs
    ids = [f.faculty_id for f in faculty_list]
    assert len(set(ids)) == 50
    assert "FAC01" in ids
    assert "FAC50" in ids

    # 3. Check actual CSV columns mapped
    first = faculty_list[0]
    assert first.faculty_id == "FAC01"
    assert first.faculty_name == "Venkat Reddy"
    assert first.subject == "Maths"
    assert first.qualification == "M.Sc Mathematics"
    assert first.designation == "Assistant Professor"
    assert first.department == "Mathematics"

def test_faculty_account_preparation_security():
    service = FacultyService()
    faculty_list = service.get_all()

    for f in faculty_list:
        acc = f.account
        # Uniquely linked to faculty_id
        assert acc.faculty_id == f.faculty_id
        assert acc.account_id == f"ACC-{f.faculty_id}"
        assert "@campus.edu" in acc.email
        assert acc.role in ["ADMIN", "FACULTY"]
        assert acc.account_status in ["ACTIVE", "PENDING_SETUP", "INACTIVE"]
        
        # Security constraint: NEVER store or create plaintext passwords or fake credentials
        assert acc.password_hash is None

    # Check Professor has ADMIN role
    professors = [f for f in faculty_list if f.designation == "Professor"]
    assert len(professors) > 0
    for p in professors:
        assert p.account.role == "ADMIN"

def test_faculty_api_endpoints():
    # 1. List all faculty
    res = client.get("/api/v1/faculty?page=1&page_size=20")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 50
    assert len(data["faculty"]) == 20

    # 2. Filter by subject
    maths_res = client.get("/api/v1/faculty?subject=Maths")
    assert maths_res.status_code == 200
    maths_data = maths_res.json()
    assert maths_data["total"] == 10
    assert all(f["subject"] == "Maths" for f in maths_data["faculty"])

    # 3. Filter by designation
    prof_res = client.get("/api/v1/faculty?designation=Professor")
    assert prof_res.status_code == 200
    prof_data = prof_res.json()
    assert prof_data["total"] > 0
    assert all(f["designation"] == "Professor" for f in prof_data["faculty"])

    # 4. Search filter
    search_res = client.get("/api/v1/faculty?search=FAC01")
    assert search_res.status_code == 200
    assert search_res.json()["total"] == 1
    assert search_res.json()["faculty"][0]["faculty_id"] == "FAC01"

    # 5. Detail by ID
    detail_res = client.get("/api/v1/faculty/FAC02")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["faculty_id"] == "FAC02"
    assert detail["faculty_name"] == "Dr. Ravi Teja"
    assert detail["account"]["role"] in ["ADMIN", "FACULTY"]

    # 6. Stats endpoint
    stats_res = client.get("/api/v1/faculty/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_faculty"] == 50
    assert stats["professors"] > 0
    assert stats["phd_holders"] > 0
    assert "Maths" in stats["subject_distribution"]
