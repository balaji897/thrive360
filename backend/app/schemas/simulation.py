from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class SimulationRequest(BaseModel):
    attendance: Optional[float] = Field(
        None,
        ge=0.0,
        le=100.0,
        description="Hypothetical overall attendance percentage (0.0 to 100.0)"
    )
    assignment_completion: Optional[float] = Field(
        None,
        ge=0.0,
        le=100.0,
        description="Hypothetical coursework / assignment completion percentage (0.0 to 100.0)"
    )
    coding_score: Optional[float] = Field(
        None,
        ge=0.0,
        le=100.0,
        description="Hypothetical coding assessment score (0.0 to 100.0)"
    )

class SimulationBaseline(BaseModel):
    attendance: float
    assignment_completion: float
    coding_score: float
    success_score: float
    academic_risk_level: str
    academic_risk_score: float
    placement_risk_level: str
    placement_risk_score: float

class SimulationScenario(BaseModel):
    attendance: float
    assignment_completion: float
    coding_score: float
    success_score: float
    academic_risk_level: str
    academic_risk_score: float
    placement_risk_level: str
    placement_risk_score: float

class SimulationDeltas(BaseModel):
    success_score_delta: float
    academic_risk_score_delta: float
    placement_risk_score_delta: float
    academic_tier_transition: str
    placement_tier_transition: str
    attendance_delta: float
    assignment_delta: float
    coding_delta: float

class SimulationResult(BaseModel):
    student_id: str
    student_name: str
    baseline: SimulationBaseline
    scenario: SimulationScenario
    deltas: SimulationDeltas
    explanations: List[str]
    disclaimer: str = "Simulation only — not actual student data. Institutional records remain unchanged."
