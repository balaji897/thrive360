import pytest
from app.analytics.risk_detector import RiskDetector

def test_academic_risk_detector_flags_backlogs_and_low_attendance():
    detector = RiskDetector()
    high_risk_data = {
        "cgpa": 5.06,
        "backlogs": 5,
        "overall_attendance": 72.4,
        "maths_marks": 39,
        "physics_marks": 30,
        "programming_marks": 32,
        "dbms_marks": 31,
        "os_marks": 38,
        "maths_attendance": 64.0,
        "physics_attendance": 59.0,
        "programming_attendance": 90.0,
        "dbms_attendance": 71.0,
        "os_attendance": 78.0,
        "lms_login_frequency": 18
    }

    assessment = detector.evaluate_academic_risk(high_risk_data)
    assert assessment.level == "High"
    assert assessment.score >= 50.0
    assert any("backlog" in f.lower() for f in assessment.contributing_factors)
    assert any("attendance" in f.lower() for f in assessment.contributing_factors)
    assert len(assessment.recommendations) > 0

def test_placement_risk_detector_flags_weak_coding():
    detector = RiskDetector()
    high_place_risk = {
        "coding_score": 27,
        "aptitude_score": 39,
        "technical_assessment_score": 47,
        "mock_interviews_attended": 2,
        "mock_interview_avg_score": 40,
        "soft_skills_avg": 52.0,
        "certifications_count": 0,
        "year": 3
    }

    assessment = detector.evaluate_placement_risk(high_place_risk)
    assert assessment.level == "High"
    assert any("coding" in f.lower() for f in assessment.contributing_factors)
    assert len(assessment.recommendations) > 0
