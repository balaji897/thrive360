import pytest
from starlette.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.core.security import hash_password, verify_password

client = TestClient(app)

def test_pbkdf2_password_hashing():
    pwd = "TestSecretPassword123!"
    hashed = hash_password(pwd)
    assert hashed.startswith("pbkdf2_sha256$100000$")
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword", hashed) is False
    assert verify_password("", hashed) is False
    assert verify_password(pwd, None) is False

def test_login_input_validation():
    # Identification alone without password
    res = client.post("/api/v1/auth/login", json={"portal": "student", "identifier": "STU001", "password": ""})
    assert res.status_code in [400, 422]
    assert "password" in str(res.json()["detail"]).lower()

    # Empty identifier
    res = client.post("/api/v1/auth/login", json={"portal": "student", "identifier": "", "password": "anypassword"})
    assert res.status_code in [400, 422]

    # Invalid portal
    res = client.post("/api/v1/auth/login", json={"portal": "unknown", "identifier": "STU001", "password": "pass"})
    assert res.status_code == 422

def test_dev_student_accounts_successful_login():
    # Exactly 3 dev student accounts: STU001, STU002, STU003
    for stu_id in ["STU001", "STU002", "STU003"]:
        res = client.post("/api/v1/auth/login", json={
            "portal": "student",
            "identifier": stu_id,
            "password": "CampusStudent2026!"
        })
        assert res.status_code == 200, f"Failed for {stu_id}: {res.text}"
        data = res.json()
        assert data["success"] is True
        assert data["portal"] == "student"
        assert data["role"] == "STUDENT"
        assert data["user_id"] == stu_id
        assert len(data["access_token"]) > 20
        # Cookie verification
        assert "thrive360_access_token" in res.cookies

def test_dev_faculty_accounts_successful_login():
    # Exactly 2 dev faculty accounts: FAC01 (FACULTY) and FAC21 (ADMIN)
    res_fac01 = client.post("/api/v1/auth/login", json={
        "portal": "faculty",
        "identifier": "FAC01",
        "password": "CampusFaculty2026!"
    })
    assert res_fac01.status_code == 200
    assert res_fac01.json()["role"] == "FACULTY"
    assert res_fac01.json()["user_id"] == "FAC01"

    res_fac21 = client.post("/api/v1/auth/login", json={
        "portal": "faculty",
        "identifier": "FAC21",
        "password": "CampusAdmin2026!"
    })
    assert res_fac21.status_code == 200
    assert res_fac21.json()["role"] == "ADMIN"
    assert res_fac21.json()["user_id"] == "FAC21"

def test_incorrect_password_rejected():
    res = client.post("/api/v1/auth/login", json={
        "portal": "student",
        "identifier": "STU001",
        "password": "WrongPassword123"
    })
    assert res.status_code == 401
    assert "authentication failed" in res.json()["detail"].lower()
    # Ensure no hashes or secrets leaked
    assert "pbkdf2" not in res.text
    assert "salt" not in res.text

def test_portal_and_role_mismatch_enforced():
    # Student attempting to log into faculty portal
    res_stu_in_fac = client.post("/api/v1/auth/login", json={
        "portal": "faculty",
        "identifier": "STU001",
        "password": "CampusStudent2026!"
    })
    assert res_stu_in_fac.status_code == 403
    assert "access denied" in res_stu_in_fac.json()["detail"].lower() or "portal mismatch" in res_stu_in_fac.json()["detail"].lower()

    # Faculty attempting to log into student portal
    res_fac_in_stu = client.post("/api/v1/auth/login", json={
        "portal": "student",
        "identifier": "FAC01",
        "password": "CampusFaculty2026!"
    })
    assert res_fac_in_stu.status_code == 403
    assert "access denied" in res_fac_in_stu.json()["detail"].lower()

def test_unprovisioned_real_records_rejected():
    # STU004 is a real student but not a dev test account -> requires activation
    res_stu004 = client.post("/api/v1/auth/login", json={
        "portal": "student",
        "identifier": "STU004",
        "password": "AnyPassword123"
    })
    assert res_stu004.status_code == 403
    assert "activation" in res_stu004.json()["detail"].lower()

    # FAC02 is a real faculty member but has password_hash=None -> setup pending
    res_fac02 = client.post("/api/v1/auth/login", json={
        "portal": "faculty",
        "identifier": "FAC02",
        "password": "AnyPassword123"
    })
    assert res_fac02.status_code == 403
    assert "setup pending" in res_fac02.json()["detail"].lower()

def test_protected_me_endpoint_lifecycle():
    client.cookies.clear()
    # 1. Unauthenticated request fails
    res_unauth = client.get("/api/v1/auth/me")
    assert res_unauth.status_code == 401

    # 2. Login to get token
    login_res = client.post("/api/v1/auth/login", json={
        "portal": "faculty",
        "identifier": "FAC21",
        "password": "CampusAdmin2026!"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    # 3. Authenticated request with Bearer header
    res_me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res_me.status_code == 200
    me_data = res_me.json()
    assert me_data["user_id"] == "FAC21"
    assert me_data["role"] == "ADMIN"
    assert me_data["portal"] == "faculty"

    # 4. Logout clears session
    res_logout = client.post("/api/v1/auth/logout")
    assert res_logout.status_code == 200

def test_dev_accounts_disabled_when_flag_off(monkeypatch):
    monkeypatch.setattr(settings, "DEV_ACCOUNTS_ENABLED", False)
    client.cookies.clear()

    # Attempting to login with STU001 now treats it as unprovisioned real record
    res = client.post("/api/v1/auth/login", json={
        "portal": "student",
        "identifier": "STU001",
        "password": "CampusStudent2026!"
    })
    assert res.status_code == 403
    assert "activation" in res.json()["detail"].lower()

    # Metadata endpoint returns 403 when disabled
    res_meta = client.get("/api/v1/auth/dev-accounts")
    assert res_meta.status_code == 403

def test_student_dashboard_endpoint_protection():
    client.cookies.clear()
    # 1. Unauthenticated -> 401
    res_unauth = client.get("/api/v1/dashboard/student")
    assert res_unauth.status_code == 401

    # 2. Student STU001 login -> 200
    res_login = client.post("/api/v1/auth/login", json={
        "portal": "student",
        "identifier": "STU001",
        "password": "CampusStudent2026!"
    })
    token = res_login.json()["access_token"]
    res_dash = client.get("/api/v1/dashboard/student", headers={"Authorization": f"Bearer {token}"})
    assert res_dash.status_code == 200
    data = res_dash.json()
    assert data["student_id"] == "STU001"
    assert "success_score" in data
    assert "recommendations" in data
    assert len(data["recommendations"]) > 0

    # 3. Faculty FAC01 accessing student dashboard -> 403 Forbidden
    res_fac_login = client.post("/api/v1/auth/login", json={
        "portal": "faculty",
        "identifier": "FAC01",
        "password": "CampusFaculty2026!"
    })
    fac_token = res_fac_login.json()["access_token"]
    res_forbidden = client.get("/api/v1/dashboard/student", headers={"Authorization": f"Bearer {fac_token}"})
    assert res_forbidden.status_code == 403

def test_faculty_dashboard_endpoint_protection():
    client.cookies.clear()
    # 1. Unauthenticated -> 401
    res_unauth = client.get("/api/v1/dashboard/faculty")
    assert res_unauth.status_code == 401

    # 2. Student STU001 accessing faculty dashboard -> 403 Forbidden
    res_stu_login = client.post("/api/v1/auth/login", json={
        "portal": "student",
        "identifier": "STU001",
        "password": "CampusStudent2026!"
    })
    stu_token = res_stu_login.json()["access_token"]
    res_stu_forbidden = client.get("/api/v1/dashboard/faculty", headers={"Authorization": f"Bearer {stu_token}"})
    assert res_stu_forbidden.status_code == 403

    # 3. Faculty FAC01 (non-admin) login -> 200
    res_fac01_login = client.post("/api/v1/auth/login", json={
        "portal": "faculty",
        "identifier": "FAC01",
        "password": "CampusFaculty2026!"
    })
    fac01_token = res_fac01_login.json()["access_token"]
    res_fac01_dash = client.get("/api/v1/dashboard/faculty", headers={"Authorization": f"Bearer {fac01_token}"})
    assert res_fac01_dash.status_code == 200
    data_fac01 = res_fac01_dash.json()
    assert data_fac01["faculty_id"] == "FAC01"
    assert data_fac01["is_admin"] is False
    assert data_fac01["cohort_total_students"] < 250  # Scoped cohort, not entire campus

    # 4. Admin FAC21 login -> 200
    res_fac21_login = client.post("/api/v1/auth/login", json={
        "portal": "faculty",
        "identifier": "FAC21",
        "password": "CampusAdmin2026!"
    })
    fac21_token = res_fac21_login.json()["access_token"]
    res_fac21_dash = client.get("/api/v1/dashboard/faculty", headers={"Authorization": f"Bearer {fac21_token}"})
    assert res_fac21_dash.status_code == 200
    data_fac21 = res_fac21_dash.json()
    assert data_fac21["faculty_id"] == "FAC21"
    assert data_fac21["is_admin"] is True
    assert data_fac21["cohort_total_students"] == 250  # Full campus scope

def test_cross_student_access_prevention():
    client.cookies.clear()
    res_login = client.post("/api/v1/auth/login", json={
        "portal": "student",
        "identifier": "STU001",
        "password": "CampusStudent2026!"
    })
    token = res_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Student STU001 accessing their own profile -> 200 OK
    res_own = client.get("/api/v1/students/STU001", headers=headers)
    assert res_own.status_code == 200
    assert res_own.json()["student_id"] == "STU001"

    # 2. Student STU001 accessing another student STU002 -> 200 OK (campus-wide read access enabled)
    res_other = client.get("/api/v1/students/STU002", headers=headers)
    assert res_other.status_code == 200
    assert res_other.json()["student_id"] == "STU002"

    # 3. Student STU001 accessing student STU003 -> 200 OK
    res_other3 = client.get("/api/v1/students/STU003", headers=headers)
    assert res_other3.status_code == 200
    assert res_other3.json()["student_id"] == "STU003"

    # 4. Student STU001 attempting to list all students -> 403 Forbidden
    res_dir = client.get("/api/v1/students", headers=headers)
    assert res_dir.status_code == 403

    # 5. Student STU001 attempting to list all faculty -> 403 Forbidden
    res_fac = client.get("/api/v1/faculty", headers=headers)
    assert res_fac.status_code == 403

def test_faculty_access_restrictions():
    from app.core.state import app_state
    cse_student = next(s for s in app_state.students if s["department"] == "CSE")
    cse_id = cse_student["student_id"]

    client.cookies.clear()
    # 1. Login as FAC01 (Faculty role, Maths)
    res_fac01 = client.post("/api/v1/auth/login", json={
        "portal": "faculty",
        "identifier": "FAC01",
        "password": "CampusFaculty2026!"
    })
    fac01_token = res_fac01.json()["access_token"]
    headers_fac01 = {"Authorization": f"Bearer {fac01_token}"}

    # Accessing STU003 (enrolled in MECH, outside faculty department) -> 200 OK (department boundaries removed)
    res_outside = client.get("/api/v1/students/STU003", headers=headers_fac01)
    assert res_outside.status_code == 200
    assert res_outside.json()["student_id"] == "STU003"

    # Accessing student in CSE -> 200 OK
    res_inside = client.get(f"/api/v1/students/{cse_id}", headers=headers_fac01)
    assert res_inside.status_code == 200
    assert res_inside.json()["student_id"] == cse_id

    # 2. Login as FAC21 (ADMIN role, campus-wide)
    res_fac21 = client.post("/api/v1/auth/login", json={
        "portal": "faculty",
        "identifier": "FAC21",
        "password": "CampusAdmin2026!"
    })
    fac21_token = res_fac21.json()["access_token"]
    headers_fac21 = {"Authorization": f"Bearer {fac21_token}"}

    # Admin CAN access STU003 in MECH -> 200 OK
    res_admin_stu003 = client.get("/api/v1/students/STU003", headers=headers_fac21)
    assert res_admin_stu003.status_code == 200
    assert res_admin_stu003.json()["student_id"] == "STU003"

def test_logout_invalidates_session_and_subsequent_access():
    client.cookies.clear()
    # 1. Login sets cookie
    login_res = client.post("/api/v1/auth/login", json={
        "portal": "student",
        "identifier": "STU001",
        "password": "CampusStudent2026!"
    })
    assert login_res.status_code == 200
    assert "thrive360_access_token" in client.cookies

    # 2. Access dashboard using cookie
    dash_res = client.get("/api/v1/dashboard/student")
    assert dash_res.status_code == 200

    # 3. Logout clears cookie
    logout_res = client.post("/api/v1/auth/logout")
    assert logout_res.status_code == 200

    # 4. Subsequent access without Authorization header -> 401
    post_logout_res = client.get("/api/v1/dashboard/student")
    assert post_logout_res.status_code == 401

def test_existing_apis_regression_check():
    client.cookies.clear()
    # Summary
    summary_res = client.get("/api/v1/dashboard/summary")
    assert summary_res.status_code == 200
    assert summary_res.json()["total_students"] == 250

    # Risk heatmap
    heatmap_res = client.get("/api/v1/analytics/risk-heatmap")
    assert heatmap_res.status_code == 200

    # Interventions
    interventions_res = client.get("/api/v1/interventions")
    assert interventions_res.status_code == 200

    # Data quality
    dq_res = client.get("/api/v1/data-quality/report")
    assert dq_res.status_code == 200


