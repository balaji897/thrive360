from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Depends, status
from app.core.state import app_state
from app.schemas.faculty import FacultyMember, FacultyListResponse, FacultyStats
from app.core.dependencies import get_optional_user_payload

router = APIRouter(prefix="/faculty", tags=["Faculty"])

@router.get("", response_model=FacultyListResponse)
def list_faculty(
    search: Optional[str] = Query(None, description="Search by name, ID, or subject"),
    subject: Optional[str] = Query(None, description="Filter by subject (Maths, Physics, Programming, DBMS, OS)"),
    designation: Optional[str] = Query(None, description="Filter by designation (Professor, Associate Professor, Assistant Professor)"),
    role: Optional[str] = Query(None, description="Filter by account role (ADMIN, FACULTY)"),
    account_status: Optional[str] = Query(None, description="Filter by account status (ACTIVE, PENDING_SETUP, INACTIVE)"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(15, ge=1, le=100, description="Items per page"),
    user: Optional[Dict[str, Any]] = Depends(get_optional_user_payload)
):
    if user and user.get("role") == "STUDENT":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Students are not authorized to view the institutional faculty directory."
        )

    return app_state.faculty_service.list_faculty(
        search=search,
        subject=subject,
        designation=designation,
        role=role,
        account_status=account_status,
        page=page,
        page_size=page_size
    )

@router.get("/stats", response_model=FacultyStats)
def get_faculty_stats(user: Optional[Dict[str, Any]] = Depends(get_optional_user_payload)):
    if user and user.get("role") == "STUDENT":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Students are not authorized to view faculty governance statistics."
        )
    return app_state.faculty_service.get_stats()

@router.get("/{faculty_id}", response_model=FacultyMember)
def get_faculty_detail(faculty_id: str):
    res = app_state.faculty_service.get_by_id(faculty_id)
    if not res:
        raise HTTPException(status_code=404, detail=f"Faculty member with ID '{faculty_id}' not found.")
    
    # Check interventions assigned to this faculty
    assigned_interventions = app_state.intervention_store.list_all()
    matching_cnt = sum(1 for item in assigned_interventions if res.faculty_name.lower() in item.assigned_faculty.lower() or res.faculty_id.lower() in item.assigned_faculty.lower())
    
    # Return member with dynamic count
    res_dict = res.model_dump()
    res_dict["assigned_interventions_count"] = matching_cnt
    return FacultyMember(**res_dict)
