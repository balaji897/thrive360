from fastapi import APIRouter
from app.core.state import app_state

router = APIRouter(tags=["Health"])

@router.get("/health")
def get_health():
    return {
        "status": "healthy",
        "service": "Smart Campus Analytics API",
        "version": "1.0.0",
        "students_loaded": len(app_state.students),
        "data_integrated": len(app_state.students) > 0,
        "raw_source_count": app_state.data_quality_report.total_source_files if app_state.data_quality_report else 0
    }
