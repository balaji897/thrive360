from fastapi import APIRouter
from app.core.state import app_state
from app.schemas.data_quality import DataQualityReport

router = APIRouter(prefix="/data-quality", tags=["Data Quality"])

@router.get("", response_model=DataQualityReport)
def get_data_quality_report():
    if not app_state.data_quality_report:
        # Re-trigger integration if needed
        _, report = app_state.integrator.integrate(app_state.current_weights)
        app_state.data_quality_report = report
    return app_state.data_quality_report
