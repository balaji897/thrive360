from fastapi import APIRouter, HTTPException
from app.core.config import ScoringWeights
from app.core.state import app_state

router = APIRouter(prefix="/config", tags=["Configuration"])

@router.get("/scoring-weights", response_model=ScoringWeights)
def get_scoring_weights():
    return app_state.current_weights

@router.post("/scoring-weights", response_model=ScoringWeights)
def update_scoring_weights(new_weights: ScoringWeights):
    if not new_weights.validate_weights():
        total = sum([
            new_weights.academic_performance,
            new_weights.attendance,
            new_weights.lms_participation,
            new_weights.student_engagement,
            new_weights.placement_readiness,
            new_weights.technical_soft_skills,
            new_weights.feedback_support
        ])
        raise HTTPException(
            status_code=400,
            detail=f"Scoring weights must sum to 1.0 (100%). Received sum: {total:.3f}"
        )
    
    app_state.rescore(new_weights)
    return app_state.current_weights
