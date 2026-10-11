from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ScoreContribution(BaseModel):
    category: str
    weight: float
    raw_value: float
    normalized_score: float
    weighted_contribution: float
    description: str

class RiskAssessment(BaseModel):
    level: str  # High, Medium, Low
    score: float  # 0 - 100 risk index
    contributing_factors: List[str]
    evidence: Dict[str, Any]
    recommendations: List[str]

class AcademicProfile(BaseModel):
    cgpa: float
    maths_marks: float
    physics_marks: float
    programming_marks: float
    dbms_marks: float
    os_marks: float
    avg_marks: float
    backlogs: int
    maths_attendance: float
    physics_attendance: float
    programming_attendance: float
    dbms_attendance: float
    os_attendance: float
    overall_attendance: float

class LMSProfile(BaseModel):
    login_frequency: int

class ActivitiesProfile(BaseModel):
    events_participated: int
    clubs_joined_count: int
    club_names: List[str]
    hackathons_participated: int
    hackathons_won: int
    certifications_count: int
    certification_names: List[str]

class PlacementProfile(BaseModel):
    aptitude_score: float
    coding_score: float
    mock_interviews_attended: int
    mock_interview_avg_score: float

class SkillsProfile(BaseModel):
    technical_assessment_score: float
    technical_assessments_attempted: int
    communication_skills: float
    teamwork: float
    leadership: float
    problem_solving: float
    time_management: float
    soft_skills_avg: float

class FeedbackProfile(BaseModel):
    overall_satisfaction: float
    teaching_quality_satisfaction: float
    infrastructure_satisfaction: float
    campus_life_satisfaction: float
    placement_support_satisfaction: float
    faculty_subject_knowledge: float = 0.0
    faculty_communication: float = 0.0
    faculty_punctuality: float = 0.0
    faculty_doubt_clearing: float = 0.0
    faculty_feedback_avg: float
    would_recommend_college: str

class StudentSummary(BaseModel):
    student_id: str
    name: str
    department: str
    year: int
    cgpa: float
    overall_attendance: float
    success_score: float
    academic_risk_level: str
    placement_risk_level: str
    primary_segment: str
    has_backlogs: bool
    backlogs: int

class UnifiedStudent(BaseModel):
    student_id: str
    name: str
    department: str
    year: int
    
    # Sub-profiles
    academics: AcademicProfile
    lms: LMSProfile
    activities: ActivitiesProfile
    placement: PlacementProfile
    skills: SkillsProfile
    feedback: FeedbackProfile
    
    # Analytics results
    success_score: float
    score_breakdown: List[ScoreContribution]
    academic_risk: RiskAssessment
    placement_risk: RiskAssessment
    primary_segment: str
    missing_data_flags: List[str]
    intelligence: Optional["StudentIntelligenceProfile"] = None
    drivers: Optional["StudentDrivers"] = None
    data_confidence: Optional["StudentDataConfidence"] = None

class IndicatorGroupConfidence(BaseModel):
    group_name: str
    status: str  # "Complete", "Partial", "Missing"
    completeness_percentage: float
    indicators_present: int
    indicators_total: int
    source_file: str
    details: str

class StudentDataConfidence(BaseModel):
    confidence_score: float  # 0 - 100 percentage
    confidence_tier: str     # "High Confidence", "Moderate Confidence", "Low Confidence"
    indicator_groups: List[IndicatorGroupConfidence]
    missing_indicators: List[str]
    total_indicators_available: int
    total_indicators_tracked: int
    provenance_sources_count: int

class ScoreDriver(BaseModel):
    category: str
    indicator: str
    weight: float
    student_value: float
    cohort_mean: float
    deviation: float
    impact_score: float
    impact_type: str  # "positive" or "negative"
    explanation: str

class StudentDrivers(BaseModel):
    top_positive_drivers: List[ScoreDriver]
    top_negative_drivers: List[ScoreDriver]
    triggered_risk_rules: List[str]

class StudentIntelligenceProfile(BaseModel):
    anomaly_score: float
    is_anomaly: bool
    anomaly_tier: str
    top_contributing_indicators: List[str]
    conflicting_signals: List[str]
    plain_language_explanation: str



class StudentListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    students: List[StudentSummary]
