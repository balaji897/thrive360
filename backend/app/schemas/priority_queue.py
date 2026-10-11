from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class PriorityFactorDetail(BaseModel):
    value: float
    reasons: List[str]

class PriorityQueueItem(BaseModel):
    student_id: str
    name: str
    department: str
    year: int
    semester: int
    priority_score: float
    risk_tier: str
    risk_factor: float
    urgency_factor: float
    recoverability_factor: float
    factors: Dict[str, PriorityFactorDetail]
    top_reasons: List[str]
    recommended_action: str
    academic_risk_level: str
    placement_risk_level: str
    cgpa: float
    attendance: float
    backlogs: int

class PriorityQueueResponse(BaseModel):
    total_in_queue: int
    filtered_count: int
    limit: int
    department_filter: Optional[str] = None
    semester_filter: Optional[int] = None
    items: List[PriorityQueueItem]
