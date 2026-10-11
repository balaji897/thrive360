import pytest
from app.analytics.success_scorer import SuccessScorer
from app.core.config import ScoringWeights

def test_success_score_computation_and_bounds():
    scorer = SuccessScorer()
    
    # High achiever mock
    high_student = {
        "cgpa": 9.5,
        "avg_marks": 92.0,
        "backlogs": 0,
        "overall_attendance": 95.0,
        "lms_login_frequency": 30,
        "events_participated": 5,
        "clubs_joined_count": 2,
        "hackathons_participated": 2,
        "hackathons_won": 1,
        "certifications_count": 2,
        "aptitude_score": 90,
        "coding_score": 95,
        "mock_interviews_attended": 3,
        "mock_interview_avg_score": 88,
        "technical_assessment_score": 92,
        "soft_skills_avg": 85,
        "overall_satisfaction": 4.5
    }
    
    score, contributions = scorer.calculate_score(high_student)
    assert 85.0 <= score <= 100.0
    assert len(contributions) == 7

    # Struggling student mock
    low_student = {
        "cgpa": 4.8,
        "avg_marks": 35.0,
        "backlogs": 4,
        "overall_attendance": 60.0,
        "lms_login_frequency": 8,
        "events_participated": 0,
        "clubs_joined_count": 0,
        "hackathons_participated": 0,
        "hackathons_won": 0,
        "certifications_count": 0,
        "aptitude_score": 30,
        "coding_score": 25,
        "mock_interviews_attended": 0,
        "mock_interview_avg_score": 0,
        "technical_assessment_score": 35,
        "soft_skills_avg": 40,
        "overall_satisfaction": 2.0
    }
    
    low_score, low_contributions = scorer.calculate_score(low_student)
    assert 0.0 <= low_score <= 50.0
    assert low_score < score

def test_weight_update_changes_score():
    scorer = SuccessScorer()
    mock_student = {
        "cgpa": 9.0,
        "avg_marks": 85.0,
        "backlogs": 0,
        "overall_attendance": 90.0,
        "lms_login_frequency": 25,
        "events_participated": 3,
        "clubs_joined_count": 1,
        "hackathons_participated": 1,
        "hackathons_won": 0,
        "certifications_count": 1,
        "aptitude_score": 80,
        "coding_score": 85,
        "mock_interviews_attended": 2,
        "mock_interview_avg_score": 75,
        "technical_assessment_score": 80,
        "soft_skills_avg": 75,
        "overall_satisfaction": 4.0
    }

    score1, _ = scorer.calculate_score(mock_student)

    # Shift heavy weight to academic
    new_weights = ScoringWeights(
        academic_performance=0.60,
        attendance=0.10,
        lms_participation=0.05,
        student_engagement=0.05,
        placement_readiness=0.10,
        technical_soft_skills=0.05,
        feedback_support=0.05
    )
    scorer.update_weights(new_weights)
    score2, _ = scorer.calculate_score(mock_student)
    
    assert isinstance(score2, float)
    assert 0.0 <= score2 <= 100.0
