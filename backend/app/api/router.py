from fastapi import APIRouter
from app.api.health import router as health_router
from app.api.dashboard import router as dashboard_router
from app.api.students import router as students_router
from app.api.analytics import router as analytics_router
from app.api.interventions import router as interventions_router
from app.api.data_quality import router as data_quality_router
from app.api.config import router as config_router
from app.api.faculty import router as faculty_router
from app.api.auth import router as auth_router
from app.api.priority_queue import router as priority_queue_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(dashboard_router)
api_router.include_router(students_router)
api_router.include_router(analytics_router)
api_router.include_router(interventions_router)
api_router.include_router(data_quality_router)
api_router.include_router(config_router)
api_router.include_router(faculty_router)
api_router.include_router(auth_router)
api_router.include_router(priority_queue_router)

