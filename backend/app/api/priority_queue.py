from typing import Optional, Dict, Any
from fastapi import APIRouter, Query, Depends
from app.core.dependencies import require_faculty_user
from app.schemas.priority_queue import PriorityQueueResponse
from app.services.priority_queue_service import PriorityQueueService
from app.core.state import app_state

router = APIRouter(prefix="/priority-queue", tags=["Priority Queue"])

@router.get("", response_model=PriorityQueueResponse)
def get_priority_queue(
    department: Optional[str] = Query(None, description="Filter by department (e.g. IT, CSE, ECE)"),
    semester: Optional[int] = Query(None, description="Filter by semester (1-8)"),
    limit: int = Query(10, ge=1, le=250, description="Number of students to return (default 10)"),
    user: Dict[str, Any] = Depends(require_faculty_user)
):
    """
    Returns the student intervention priority queue sorted by multi-factor priority score.
    Factors in risk [0,1], urgency [0,1], and recoverability [0,1].
    Priority score = (risk * urgency * recoverability) * 100.
    Enforces faculty/admin access control.
    """
    return PriorityQueueService.get_priority_queue(
        students=app_state.students,
        department=department,
        semester=semester,
        limit=limit
    )
