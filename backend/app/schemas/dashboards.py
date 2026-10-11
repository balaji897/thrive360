from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class StudentDashboardResponse(BaseModel):
    student_id: str
    name: str
    department: str
    year: int
    success_score: float
    academic_risk: Dict[str, Any]
    placement_risk: Dict[str, Any]
    academics: Dict[str, Any]
    lms: Dict[str, Any]
    placement: Dict[str, Any]
    activities: Dict[str, Any]
    feedback: Dict[str, Any]
    interventions: List[Dict[str, Any]]
    score_breakdown: Dict[str, float]
    recommendations: List[str]

class FacultyDashboardResponse(BaseModel):
    faculty_id: str
    faculty_name: str
    subject: str
    department: str
    designation: str
    role: str
    is_admin: bool
    cohort_total_students: int
    cohort_average_score: float
    cohort_high_academic_risk: int
    cohort_high_placement_risk: int
    cohort_risk_distribution: Dict[str, int]
    assigned_interventions: List[Dict[str, Any]]
    authorized_students: List[Dict[str, Any]]
    urgent_attention_students: List[Dict[str, Any]]
