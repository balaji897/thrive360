from starlette.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_api_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "Smart Campus Analytics API" in response.json()["message"]

def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["students_loaded"] == 250
    assert data["data_integrated"] is True

def test_dashboard_summary():
    response = client.get("/api/v1/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_students"] == 250
    assert 0 < data["average_success_score"] < 100
    assert "High" in data["academic_risk_counts"]
    assert "High" in data["placement_risk_counts"]
    assert len(data["department_metrics"]) > 0
    assert len(data["top_urgent_students"]) > 0

def test_students_listing_and_filtering():
    response = client.get("/api/v1/students?page=1&page_size=10")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 250
    assert len(data["students"]) == 10

    # Search filter
    search_res = client.get("/api/v1/students?search=STU001")
    assert search_res.status_code == 200
    assert search_res.json()["total"] >= 1
    assert search_res.json()["students"][0]["student_id"] == "STU001"

    # Department filter
    dept_res = client.get("/api/v1/students?department=IT")
    assert dept_res.status_code == 200
    assert all(s["department"] == "IT" for s in dept_res.json()["students"])

def test_student_detail_endpoint():
    response = client.get("/api/v1/students/STU001")
    assert response.status_code == 200
    data = response.json()
    assert data["student_id"] == "STU001"
    assert data["name"] == "Karthik Babu"
    assert "academics" in data
    assert "score_breakdown" in data
    assert len(data["score_breakdown"]) == 7

    # 404 test
    not_found = client.get("/api/v1/students/STU999")
    assert not_found.status_code == 404

def test_analytics_segments():
    response = client.get("/api/v1/analytics/segments")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 6
    assert any(s["name"] == "Critical Dual Risk" for s in data)

def test_analytics_risks():
    response = client.get("/api/v1/analytics/risks")
    assert response.status_code == 200
    data = response.json()
    assert "department_heatmap" in data
    assert "cross_risk_matrix" in data

def test_analytics_ml_model():
    response = client.get("/api/v1/analytics/ml-model")
    assert response.status_code == 200
    data = response.json()
    assert "accuracy" in data
    assert len(data["feature_importances"]) > 0

def test_data_quality_endpoint():
    response = client.get("/api/v1/data-quality")
    assert response.status_code == 200
    data = response.json()
    assert data["total_source_files"] == 6
    assert data["integrated_student_count"] == 250
    assert data["id_match_rate_percentage"] == 100.0

def test_scoring_weights_endpoint():
    # GET
    res = client.get("/api/v1/config/scoring-weights")
    assert res.status_code == 200
    weights = res.json()
    assert weights["academic_performance"] == 0.25

    # POST valid weights
    valid_payload = {
        "academic_performance": 0.30,
        "attendance": 0.20,
        "lms_participation": 0.10,
        "student_engagement": 0.10,
        "placement_readiness": 0.15,
        "technical_soft_skills": 0.10,
        "feedback_support": 0.05
    }
    post_res = client.post("/api/v1/config/scoring-weights", json=valid_payload)
    assert post_res.status_code == 200
    assert post_res.json()["academic_performance"] == 0.30

    # POST invalid weights (sum != 1.0)
    invalid_payload = {
        "academic_performance": 0.80,
        "attendance": 0.50,
        "lms_participation": 0.10,
        "student_engagement": 0.10,
        "placement_readiness": 0.15,
        "technical_soft_skills": 0.10,
        "feedback_support": 0.05
    }
    bad_res = client.post("/api/v1/config/scoring-weights", json=invalid_payload)
    assert bad_res.status_code == 400
