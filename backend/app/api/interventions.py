from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.core.state import app_state
from app.schemas.intervention import Intervention, InterventionCreate, InterventionUpdate

router = APIRouter(prefix="/interventions", tags=["Interventions"])

@router.get("", response_model=List[Intervention])
def list_interventions(
    student_id: Optional[str] = Query(None, description="Filter by Student ID"),
    status: Optional[str] = Query(None, description="Filter by status (Pending, In Progress, Completed, Cancelled)"),
    priority: Optional[str] = Query(None, description="Filter by priority (High, Medium, Low)"),
    category: Optional[str] = Query(None, description="Filter by category (Academic, Placement, Attendance, Engagement, Personal)")
):
    return app_state.intervention_store.list_all(
        student_id=student_id,
        status=status,
        priority=priority,
        category=category
    )

@router.get("/{intervention_id}", response_model=Intervention)
def get_intervention(intervention_id: str):
    res = app_state.intervention_store.get_by_id(intervention_id)
    if not res:
        raise HTTPException(status_code=404, detail=f"Intervention '{intervention_id}' not found.")
    return res

@router.post("", response_model=Intervention, status_code=status.HTTP_201_CREATED)
def create_intervention(payload: InterventionCreate):
    # Verify student exists if possible
    existing_students = {s["student_id"].upper(): s["name"] for s in app_state.students}
    stu_id_clean = payload.student_id.strip().upper()
    if existing_students and stu_id_clean not in existing_students:
        raise HTTPException(status_code=400, detail=f"Student ID '{payload.student_id}' does not exist in student database.")

    # Autofill student name if blank
    if not payload.student_name and stu_id_clean in existing_students:
        payload.student_name = existing_students[stu_id_clean]

    return app_state.intervention_store.create(payload)

@router.patch("/{intervention_id}", response_model=Intervention)
def update_intervention(intervention_id: str, payload: InterventionUpdate):
    res = app_state.intervention_store.update(intervention_id, payload)
    if not res:
        raise HTTPException(status_code=404, detail=f"Intervention '{intervention_id}' not found.")
    return res

@router.delete("/{intervention_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_intervention(intervention_id: str):
    success = app_state.intervention_store.delete(intervention_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Intervention '{intervention_id}' not found.")
    return None
