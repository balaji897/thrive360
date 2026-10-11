from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Query, Depends, status
from app.core.state import app_state
from app.schemas.student import StudentListResponse, StudentSummary, UnifiedStudent
from app.schemas.simulation import (
    SimulationRequest,
    SimulationResult,
    SimulationBaseline,
    SimulationScenario,
    SimulationDeltas
)
from app.core.dependencies import get_optional_user_payload
from app.services.priority_queue_service import DriverCalculator
from app.services.data_integrator import DataIntegrator
from app.analytics.success_scorer import SuccessScorer
from app.analytics.risk_detector import RiskDetector


router = APIRouter(prefix="/students", tags=["Students"])

@router.get("", response_model=StudentListResponse)
def list_students(
    search: Optional[str] = Query(None, description="Search by Student ID or Name"),
    department: Optional[str] = Query(None, description="Filter by department (e.g. IT, CSE, ECE)"),
    year: Optional[int] = Query(None, description="Filter by academic year (1-4)"),
    academic_risk: Optional[str] = Query(None, description="Filter by academic risk level (High, Medium, Low)"),
    placement_risk: Optional[str] = Query(None, description="Filter by placement risk level (High, Medium, Low)"),
    segment: Optional[str] = Query(None, description="Filter by primary segment"),
    min_score: Optional[float] = Query(None, description="Minimum Student Success Score"),
    max_score: Optional[float] = Query(None, description="Maximum Student Success Score"),
    has_backlogs: Optional[bool] = Query(None, description="Filter by presence of backlogs"),
    sort_by: str = Query("student_id", description="Field to sort by"),
    sort_order: str = Query("asc", description="Sort order: asc or desc"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(15, ge=1, le=250, description="Items per page"),
    user: Optional[Dict[str, Any]] = Depends(get_optional_user_payload)
):
    if user and user.get("role") == "STUDENT":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Student accounts are not authorized to browse the institutional student directory."
        )

    all_students = app_state.students
    filtered = []

    search_term = search.strip().lower() if search else None

    for s in all_students:
        # Search query
        if search_term:
            stu_id_match = search_term in s["student_id"].lower()
            name_match = search_term in s["name"].lower()
            if not (stu_id_match or name_match):
                continue

        # Department filter
        if department and s["department"].lower() != department.strip().lower():
            continue

        # Year filter
        if year is not None and s["year"] != year:
            continue

        # Academic risk
        if academic_risk and s.get("academic_risk", {}).get("level", "").lower() != academic_risk.strip().lower():
            continue

        # Placement risk
        if placement_risk and s.get("placement_risk", {}).get("level", "").lower() != placement_risk.strip().lower():
            continue

        # Segment filter
        if segment and s.get("primary_segment", "").lower() != segment.strip().lower():
            continue

        # Success score bounds
        score = s.get("success_score", 0.0)
        if min_score is not None and score < min_score:
            continue
        if max_score is not None and score > max_score:
            continue

        # Backlogs filter
        backlogs = s.get("academics", {}).get("backlogs", 0)
        if has_backlogs is not None:
            if has_backlogs and backlogs == 0:
                continue
            if not has_backlogs and backlogs > 0:
                continue

        filtered.append(s)

    # Sorting
    reverse = (sort_order.lower() == "desc")
    
    def get_sort_key(item):
        if sort_by == "success_score":
            return item.get("success_score", 0.0)
        elif sort_by == "cgpa":
            return item.get("academics", {}).get("cgpa", 0.0)
        elif sort_by == "overall_attendance":
            return item.get("academics", {}).get("overall_attendance", 0.0)
        elif sort_by == "name":
            return item.get("name", "")
        elif sort_by == "academic_risk":
            # Map High -> 3, Med -> 2, Low -> 1
            risk_order = {"High": 3, "Medium": 2, "Low": 1}
            return risk_order.get(item.get("academic_risk", {}).get("level"), 0)
        elif sort_by == "placement_risk":
            risk_order = {"High": 3, "Medium": 2, "Low": 1}
            return risk_order.get(item.get("placement_risk", {}).get("level"), 0)
        else:
            return item.get("student_id", "")

    filtered.sort(key=get_sort_key, reverse=reverse)

    total = len(filtered)
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paged_items = filtered[start_idx:end_idx]

    # Convert to StudentSummary
    summaries = []
    for s in paged_items:
        bl = s.get("academics", {}).get("backlogs", 0)
        summaries.append(StudentSummary(
            student_id=s["student_id"],
            name=s["name"],
            department=s["department"],
            year=s["year"],
            cgpa=s.get("academics", {}).get("cgpa", 0.0),
            overall_attendance=s.get("academics", {}).get("overall_attendance", 0.0),
            success_score=s.get("success_score", 0.0),
            academic_risk_level=s.get("academic_risk", {}).get("level", "Low"),
            placement_risk_level=s.get("placement_risk", {}).get("level", "Low"),
            primary_segment=s.get("primary_segment", "Steady Core Performers"),
            has_backlogs=(bl > 0),
            backlogs=bl
        ))

    return StudentListResponse(
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        students=summaries
    )

@router.get("/{student_id}", response_model=UnifiedStudent)
def get_student_detail(
    student_id: str,
    user: Optional[Dict[str, Any]] = Depends(get_optional_user_payload)
):
    target_id = student_id.strip().upper()

    # Department, cohort, and cross-student ownership restrictions removed for read-only access:
    # All authenticated faculty, administrators, and students can view any student profile.

    for s in app_state.students:
        if s["student_id"].upper() == target_id:
            student_dict = dict(s)
            drivers = DriverCalculator.calculate_drivers(s, app_state.students, app_state.current_weights)
            student_dict["drivers"] = drivers.model_dump()
            if "data_confidence" not in student_dict or not student_dict["data_confidence"]:
                student_dict["data_confidence"] = DataIntegrator.calculate_student_data_confidence(s)
            return UnifiedStudent(**student_dict)
    raise HTTPException(status_code=404, detail=f"Student profile with ID '{student_id}' not found.")

@router.post("/{student_id}/simulate", response_model=SimulationResult)
def simulate_student_what_if(
    student_id: str,
    payload: SimulationRequest,
    user: Optional[Dict[str, Any]] = Depends(get_optional_user_payload)
):
    """
    What-If Simulator: Calculates baseline versus scenario results for hypothetical changes
    in attendance, assignment completion, and coding score.
    Returns score and risk deltas with causal explanations.
    Does NOT modify saved records or retrain models.
    """
    target_id = student_id.strip().upper()
    student = next((s for s in app_state.students if s["student_id"].upper() == target_id), None)
    if not student:
        raise HTTPException(status_code=404, detail=f"Student profile with ID '{student_id}' not found.")

    acad = student.get("academics", {})
    lms = student.get("lms", {})
    act = student.get("activities", {})
    place = student.get("placement", {})
    skills = student.get("skills", {})
    fb = student.get("feedback", {})

    baseline_att = float(acad.get("overall_attendance", 0.0))
    baseline_assignment = float(acad.get("avg_marks", 0.0))
    baseline_coding = float(place.get("coding_score", 0.0))

    baseline_score = float(student.get("success_score", 0.0))
    baseline_acad_risk = student.get("academic_risk", {})
    baseline_acad_level = baseline_acad_risk.get("level", "Medium")
    baseline_acad_score = float(baseline_acad_risk.get("score", 50.0))

    baseline_place_risk = student.get("placement_risk", {})
    baseline_place_level = baseline_place_risk.get("level", "Medium")
    baseline_place_score = float(baseline_place_risk.get("score", 50.0))

    # Base flat dictionary cloned in memory
    sim_flat = {
        "student_id": student.get("student_id", ""),
        "name": student.get("name", ""),
        "department": student.get("department", ""),
        "year": student.get("year", 1),
        "cgpa": float(acad.get("cgpa", 0.0)),
        "avg_marks": baseline_assignment,
        "backlogs": int(acad.get("backlogs", 0)),
        "maths_marks": float(acad.get("maths_marks", 0.0)),
        "physics_marks": float(acad.get("physics_marks", 0.0)),
        "programming_marks": float(acad.get("programming_marks", 0.0)),
        "dbms_marks": float(acad.get("dbms_marks", 0.0)),
        "os_marks": float(acad.get("os_marks", 0.0)),
        "maths_attendance": float(acad.get("maths_attendance", 0.0)),
        "physics_attendance": float(acad.get("physics_attendance", 0.0)),
        "programming_attendance": float(acad.get("programming_attendance", 0.0)),
        "dbms_attendance": float(acad.get("dbms_attendance", 0.0)),
        "os_attendance": float(acad.get("os_attendance", 0.0)),
        "overall_attendance": baseline_att,
        "lms_login_frequency": int(lms.get("login_frequency", 0)),
        "events_participated": int(act.get("events_participated", 0)),
        "clubs_joined_count": int(act.get("clubs_joined_count", 0)),
        "hackathons_participated": int(act.get("hackathons_participated", 0)),
        "hackathons_won": int(act.get("hackathons_won", 0)),
        "certifications_count": int(act.get("certifications_count", 0)),
        "aptitude_score": float(place.get("aptitude_score", 0.0)),
        "coding_score": baseline_coding,
        "mock_interviews_attended": int(place.get("mock_interviews_attended", 0)),
        "mock_interview_avg_score": float(place.get("mock_interview_avg_score", 0.0)),
        "technical_assessment_score": float(skills.get("technical_assessment_score", 0.0)),
        "technical_assessments_attempted": int(skills.get("technical_assessments_attempted", 0)),
        "soft_skills_avg": float(skills.get("soft_skills_avg", 0.0)),
        "overall_satisfaction": float(fb.get("overall_satisfaction", 0.0))
    }

    explanations: List[str] = []

    # 1. Apply hypothetical attendance
    sim_att = baseline_att
    if payload.attendance is not None:
        sim_att = round(payload.attendance, 1)
        sim_flat["overall_attendance"] = sim_att
        att_ratio = (sim_att / baseline_att) if baseline_att > 0 else 1.0
        for subj in ["maths", "physics", "programming", "dbms", "os"]:
            orig_val = sim_flat[f"{subj}_attendance"]
            sim_flat[f"{subj}_attendance"] = max(0.0, min(100.0, orig_val * att_ratio))

        att_diff = sim_att - baseline_att
        if abs(att_diff) >= 0.1:
            if sim_att >= 75.0 and baseline_att < 75.0:
                explanations.append(
                    f"Attendance increased from {baseline_att:.1f}% to {sim_att:.1f}%, restoring statutory compliance (≥75%) and clearing institutional detention risk."
                )
            elif sim_att < 75.0 and baseline_att >= 75.0:
                explanations.append(
                    f"Attendance dropped from {baseline_att:.1f}% to {sim_att:.1f}%, falling below university statutory 75% threshold and triggering detention risk."
                )
            else:
                dir_str = "increased" if att_diff > 0 else "reduced"
                explanations.append(
                    f"Attendance {dir_str} by {abs(att_diff):.1f}% (from {baseline_att:.1f}% to {sim_att:.1f}%)."
                )

    # 2. Apply hypothetical assignment completion / coursework marks
    sim_assignment = baseline_assignment
    if payload.assignment_completion is not None:
        sim_assignment = round(payload.assignment_completion, 1)
        sim_flat["avg_marks"] = sim_assignment
        marks_ratio = (sim_assignment / baseline_assignment) if baseline_assignment > 0 else 1.0
        for subj in ["maths", "physics", "programming", "dbms", "os"]:
            orig_m = sim_flat[f"{subj}_marks"]
            sim_flat[f"{subj}_marks"] = max(0.0, min(100.0, orig_m * marks_ratio))

        assign_diff = sim_assignment - baseline_assignment
        if abs(assign_diff) >= 0.1:
            dir_str = "improved" if assign_diff > 0 else "decreased"
            explanations.append(
                f"Coursework / assignment completion {dir_str} from {baseline_assignment:.1f}% to {sim_assignment:.1f}%."
            )

    # 3. Apply hypothetical coding score
    sim_coding = baseline_coding
    if payload.coding_score is not None:
        sim_coding = round(payload.coding_score, 1)
        sim_flat["coding_score"] = sim_coding
        if sim_coding > baseline_coding:
            sim_flat["technical_assessment_score"] = max(
                sim_flat["technical_assessment_score"],
                sim_coding
            )

        coding_diff = sim_coding - baseline_coding
        if abs(coding_diff) >= 0.1:
            if sim_coding >= 70.0 and baseline_coding < 70.0:
                explanations.append(
                    f"Coding score improved from {baseline_coding:.1f} to {sim_coding:.1f}, achieving campus recruitment competency threshold (≥70 pts)."
                )
            else:
                dir_str = "advanced" if coding_diff > 0 else "declined"
                explanations.append(
                    f"Coding assessment score {dir_str} by {abs(coding_diff):.1f} points (from {baseline_coding:.1f} to {sim_coding:.1f})."
                )

    # Recalculate using existing scoring and risk services (No ML retraining, no record mutations)
    scorer = SuccessScorer(app_state.current_weights)
    sim_score, _ = scorer.calculate_score(sim_flat)
    sim_score = round(sim_score, 2)

    risk_detector = RiskDetector()
    sim_acad_risk = risk_detector.evaluate_academic_risk(sim_flat)
    sim_place_risk = risk_detector.evaluate_placement_risk(sim_flat)

    score_delta = round(sim_score - baseline_score, 2)
    acad_delta = round(sim_acad_risk.score - baseline_acad_score, 2)
    place_delta = round(sim_place_risk.score - baseline_place_score, 2)

    acad_trans = f"{baseline_acad_level} -> {sim_acad_risk.level}" if baseline_acad_level != sim_acad_risk.level else f"Unchanged ({sim_acad_risk.level})"
    place_trans = f"{baseline_place_level} -> {sim_place_risk.level}" if baseline_place_level != sim_place_risk.level else f"Unchanged ({sim_place_risk.level})"

    if baseline_acad_level != sim_acad_risk.level:
        explanations.append(
            f"Academic Risk transition: {baseline_acad_level} -> {sim_acad_risk.level} ({acad_delta:+.1f} risk index pts)."
        )
    if baseline_place_level != sim_place_risk.level:
        explanations.append(
            f"Placement Risk transition: {baseline_place_level} -> {sim_place_risk.level} ({place_delta:+.1f} risk index pts)."
        )

    if not explanations:
        explanations.append("Scenario inputs match current baseline metrics; no score or risk shifts detected.")

    return SimulationResult(
        student_id=student["student_id"],
        student_name=student["name"],
        baseline=SimulationBaseline(
            attendance=baseline_att,
            assignment_completion=baseline_assignment,
            coding_score=baseline_coding,
            success_score=baseline_score,
            academic_risk_level=baseline_acad_level,
            academic_risk_score=baseline_acad_score,
            placement_risk_level=baseline_place_level,
            placement_risk_score=baseline_place_score
        ),
        scenario=SimulationScenario(
            attendance=sim_att,
            assignment_completion=sim_assignment,
            coding_score=sim_coding,
            success_score=sim_score,
            academic_risk_level=sim_acad_risk.level,
            academic_risk_score=sim_acad_risk.score,
            placement_risk_level=sim_place_risk.level,
            placement_risk_score=sim_place_risk.score
        ),
        deltas=SimulationDeltas(
            success_score_delta=score_delta,
            academic_risk_score_delta=acad_delta,
            placement_risk_score_delta=place_delta,
            academic_tier_transition=acad_trans,
            placement_tier_transition=place_trans,
            attendance_delta=round(sim_att - baseline_att, 1),
            assignment_delta=round(sim_assignment - baseline_assignment, 1),
            coding_delta=round(sim_coding - baseline_coding, 1)
        ),
        explanations=explanations,
        disclaimer="Simulation only — not actual student data. Institutional records remain unchanged."
    )



