import pytest
from starlette.testclient import TestClient
from app.main import app
from app.core.state import app_state
from app.analytics.ml_predictor import MLPredictor

client = TestClient(app)

def test_ml_predictor_audit_feasibility():
    predictor = MLPredictor()
    audit = predictor.audit_feasibility(app_state.students)
    assert audit.total_records == 250
    assert audit.features_audited == 48
    assert audit.ground_truth_labels_found is False
    assert "No ground-truth outcome labels" in audit.audit_verdict
    assert "synthetic label leakage" in audit.audit_verdict

def test_ml_predictor_unsupervised_training_and_evaluation():
    predictor = MLPredictor()
    metrics = predictor.train_and_evaluate(app_state.students)
    
    assert metrics.model_name == "Isolation Forest Multivariate Anomaly Detector"
    assert metrics.algorithm == "Isolation Forest (Ensemble Decision Trees, Scikit-Learn)"
    assert metrics.accuracy == 0.0  # Supervised accuracy strictly omitted
    assert metrics.supervised_metrics_available is False
    assert metrics.total_students_evaluated == 250
    assert metrics.contamination_rate == 0.10
    assert metrics.detected_anomalies_count == 25
    assert 0.0 <= metrics.mean_anomaly_score <= 1.0
    
    # Feature importances
    assert len(metrics.feature_importances) == 14
    top_feature = metrics.feature_importances[0]
    assert "feature" in top_feature
    assert "relative_percentage" in top_feature
    assert top_feature["relative_percentage"] > 0
    
    # Cross-source conflicting insights
    assert len(metrics.cross_source_insights) == 6
    p_names = [c.pattern_name for c in metrics.cross_source_insights]
    assert "Academic Distress vs Placement Ready" in p_names
    assert "Academic High Achiever vs Placement Vulnerable" in p_names
    assert "High Technical Acumen with Attendance Shortfall" in p_names
    
    for c in metrics.cross_source_insights:
        assert c.count > 0
        assert c.percentage > 0
        assert len(c.sample_student_ids) > 0
        assert len(c.threshold_criteria) > 0

    # Top anomalous students
    assert len(metrics.top_anomalous_students) == 8
    top_student = metrics.top_anomalous_students[0]
    assert top_student.anomaly_score >= 0.70
    assert top_student.anomaly_tier == "Severe Anomaly"
    assert len(top_student.top_contributing_indicators) > 0
    assert len(top_student.plain_language_explanation) > 0

def test_student_level_intelligence_caching():
    predictor = MLPredictor()
    predictor.train_and_evaluate(app_state.students)
    
    intel = predictor.get_student_intelligence("STU001")
    assert intel is not None
    assert 0.0 <= intel.anomaly_score <= 1.0
    assert intel.anomaly_tier in ["Severe Anomaly", "Moderate Deviation", "Expected Profile"]
    assert len(intel.top_contributing_indicators) > 0

def test_api_analytics_ml_endpoints():
    # 1. /api/v1/analytics/ml-model
    res1 = client.get("/api/v1/analytics/ml-model")
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["model_name"] == "Isolation Forest Multivariate Anomaly Detector"
    assert data1["accuracy"] == 0.0
    assert data1["supervised_metrics_available"] is False
    assert len(data1["feature_importances"]) > 0
    assert len(data1["cross_source_insights"]) == 6
    assert len(data1["top_anomalous_students"]) == 8

    # 2. /api/v1/analytics/intelligence
    res2 = client.get("/api/v1/analytics/intelligence")
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["detected_anomalies_count"] == 25

    # 3. /api/v1/analytics/cross-insights
    res3 = client.get("/api/v1/analytics/cross-insights")
    assert res3.status_code == 200
    insights = res3.json()
    assert len(insights) == 6
    assert any(i["count"] == 9 for i in insights)

def test_student_detail_includes_intelligence():
    res = client.get("/api/v1/students/STU001")
    assert res.status_code == 200
    student = res.json()
    assert "intelligence" in student
    if student["intelligence"]:
        assert "anomaly_score" in student["intelligence"]
        assert "anomaly_tier" in student["intelligence"]
        assert "top_contributing_indicators" in student["intelligence"]
