from collections import defaultdict
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends, status
from app.core.state import app_state
from app.schemas.analytics import ExecutiveSummary
from app.schemas.dashboards import StudentDashboardResponse, FacultyDashboardResponse
from app.core.dependencies import require_student_user, require_faculty_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=ExecutiveSummary)
def get_dashboard_summary():
    students = app_state.students
    total = len(students)
    if total == 0:
        return ExecutiveSummary(
            total_students=0,
            average_success_score=0.0,
            academic_risk_counts={"High": 0, "Medium": 0, "Low": 0},
            placement_risk_counts={"High": 0, "Medium": 0, "Low": 0},
            students_needing_immediate_attention=0,
            average_cgpa=0.0,
            average_attendance=0.0,
            placement_readiness_avg=0.0,
            department_metrics=[],
            year_metrics=[],
            top_urgent_students=[]
        )

    acad_counts = {"High": 0, "Medium": 0, "Low": 0}
    place_counts = {"High": 0, "Medium": 0, "Low": 0}
    immediate_attention = 0

    dept_groups = defaultdict(lambda: {"count": 0, "total_score": 0.0, "high_risk_count": 0, "avg_cgpa_sum": 0.0, "avg_att_sum": 0.0})
    year_groups = defaultdict(lambda: {"count": 0, "total_score": 0.0, "high_risk_count": 0})

    total_score_sum = 0.0
    total_cgpa_sum = 0.0
    total_att_sum = 0.0
    total_place_sum = 0.0

    urgent_candidates = []

    for s in students:
        s_score = s.get("success_score", 0.0)
        total_score_sum += s_score

        cgpa = s.get("academics", {}).get("cgpa", 0.0)
        att = s.get("academics", {}).get("overall_attendance", 0.0)
        coding = s.get("placement", {}).get("coding_score", 0.0)
        aptitude = s.get("placement", {}).get("aptitude_score", 0.0)
        place_avg = (coding + aptitude) / 2.0

        total_cgpa_sum += cgpa
        total_att_sum += att
        total_place_sum += place_avg

        acad_level = s.get("academic_risk", {}).get("level", "Low")
        place_level = s.get("placement_risk", {}).get("level", "Low")

        acad_counts[acad_level] = acad_counts.get(acad_level, 0) + 1
        place_counts[place_level] = place_counts.get(place_level, 0) + 1

        is_high_risk = acad_level == "High" or place_level == "High"
        if is_high_risk:
            immediate_attention += 1
            # Calculate urgency weight: acad_risk_score + place_risk_score
            urgency = (s.get("academic_risk", {}).get("score", 0) * 1.2) + s.get("placement_risk", {}).get("score", 0)
            urgent_candidates.append({
                "student_id": s["student_id"],
                "name": s["name"],
                "department": s["department"],
                "year": s["year"],
                "cgpa": cgpa,
                "overall_attendance": att,
                "success_score": s_score,
                "academic_risk_level": acad_level,
                "placement_risk_level": place_level,
                "urgency_score": round(urgency, 1),
                "primary_reason": s.get("academic_risk", {}).get("contributing_factors", [""])[0] if acad_level == "High" else s.get("placement_risk", {}).get("contributing_factors", [""])[0]
            })

        # Department aggregation
        dept = s.get("department", "Unknown")
        dept_groups[dept]["count"] += 1
        dept_groups[dept]["total_score"] += s_score
        dept_groups[dept]["avg_cgpa_sum"] += cgpa
        dept_groups[dept]["avg_att_sum"] += att
        if is_high_risk:
            dept_groups[dept]["high_risk_count"] += 1

        # Year aggregation
        yr = s.get("year", 1)
        year_groups[yr]["count"] += 1
        year_groups[yr]["total_score"] += s_score
        if is_high_risk:
            year_groups[yr]["high_risk_count"] += 1

    # Format department metrics
    department_metrics = []
    for dept, data in sorted(dept_groups.items()):
        cnt = data["count"]
        department_metrics.append({
            "department": dept,
            "student_count": cnt,
            "average_score": round(data["total_score"] / cnt, 1),
            "average_cgpa": round(data["avg_cgpa_sum"] / cnt, 2),
            "average_attendance": round(data["avg_att_sum"] / cnt, 1),
            "high_risk_count": data["high_risk_count"],
            "risk_percentage": round((data["high_risk_count"] / cnt) * 100.0, 1)
        })

    # Format year metrics
    year_metrics = []
    for yr, data in sorted(year_groups.items()):
        cnt = data["count"]
        year_metrics.append({
            "year": f"Year {yr}",
            "student_count": cnt,
            "average_score": round(data["total_score"] / cnt, 1),
            "high_risk_count": data["high_risk_count"]
        })

    # Sort urgent students by urgency
    urgent_candidates.sort(key=lambda x: x["urgency_score"], reverse=True)

    return ExecutiveSummary(
        total_students=total,
        average_success_score=round(total_score_sum / total, 1),
        academic_risk_counts=acad_counts,
        placement_risk_counts=place_counts,
        students_needing_immediate_attention=immediate_attention,
        average_cgpa=round(total_cgpa_sum / total, 2),
        average_attendance=round(total_att_sum / total, 1),
        placement_readiness_avg=round(total_place_sum / total, 1),
        department_metrics=department_metrics,
        year_metrics=year_metrics,
        top_urgent_students=urgent_candidates[:10]
    )

@router.get("/student", response_model=StudentDashboardResponse)
def get_student_dashboard(user: Dict[str, Any] = Depends(require_student_user)):
    student_id = user.get("sub", "").upper()
    student = next((s for s in app_state.students if s["student_id"].upper() == student_id), None)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student record for ID '{student_id}' not found."
        )

    # Fetch personalized interventions for this student only
    all_interventions = app_state.intervention_store.list_all()
    my_interventions = [
        item.model_dump() for item in all_interventions
        if item.student_id.upper() == student_id
    ]

    # Generate personalized recommendations based on risks
    recommendations = []
    academics = student.get("academics", {})
    placement = student.get("placement", {})
    acad_risk = student.get("academic_risk", {})
    place_risk = student.get("placement_risk", {})

    if acad_risk.get("level") == "High":
        recommendations.append("Immediate academic counseling recommended. Schedule session with faculty advisor.")
    if academics.get("overall_attendance", 100) < 75.0:
        recommendations.append(f"Attendance warning ({academics.get('overall_attendance')}%): Attend all upcoming lectures to reach minimum 75% threshold.")
    if academics.get("backlogs", 0) > 0:
        recommendations.append(f"Active backlogs ({academics.get('backlogs')} subject): Enroll in remedial tutorial sessions before semester exams.")
    if placement.get("coding_score", 100) < 60.0:
        recommendations.append(f"Coding readiness ({placement.get('coding_score')}/100): Practice DSA problems on campus coding portal.")
    if not recommendations:
        recommendations.append("Performance is on track. Maintain continuous attendance and engage in campus hackathons.")

    return StudentDashboardResponse(
        student_id=student["student_id"],
        name=user.get("name") or student["name"],
        department=student["department"],
        year=student["year"],
        success_score=student.get("success_score", 0.0),
        academic_risk=acad_risk,
        placement_risk=place_risk,
        academics=academics,
        lms=student.get("lms", {}),
        placement=placement,
        activities=student.get("activities", {}),
        feedback=student.get("feedback", {}),
        interventions=my_interventions,
        score_breakdown=student.get("score_contributions", {}),
        recommendations=recommendations
    )

@router.get("/faculty", response_model=FacultyDashboardResponse)
def get_faculty_dashboard(user: Dict[str, Any] = Depends(require_faculty_user)):
    faculty_id = user.get("sub", "").upper()
    is_admin = user.get("role") == "ADMIN"

    fac = app_state.faculty_service.get_by_id(faculty_id)
    fac_name = fac.faculty_name if fac else user.get("name", "Faculty Member")
    fac_subj = fac.subject if fac else "General"
    fac_dept = fac.department if fac else user.get("department", "Academic Department")
    fac_desig = fac.designation if fac else "Faculty"

    # Get interventions assigned to this faculty
    all_interventions = app_state.intervention_store.list_all()
    assigned_interventions = [
        item.model_dump() for item in all_interventions
        if fac and (fac.faculty_name.lower() in item.assigned_faculty.lower() or fac.faculty_id.lower() in item.assigned_faculty.lower())
    ]
    assigned_student_ids = {i["student_id"].upper() for i in assigned_interventions}

    # Authorized cohort of students: ADMIN gets all 250, FACULTY gets their department/subject/assigned
    if is_admin:
        cohort_students = app_state.students
    else:
        cohort_dept = "CSE" if "math" in fac_subj.lower() or "math" in fac_dept.lower() else fac_dept
        cohort_students = [
            s for s in app_state.students
            if (s["department"].upper() == cohort_dept.upper()
                or s["department"].lower() in fac_dept.lower()
                or s["student_id"].upper() in assigned_student_ids)
        ]
        if not cohort_students:
            cohort_students = [s for s in app_state.students if s["department"] == "CSE"]

    total_cohort = len(cohort_students)
    avg_score = round(sum(s.get("success_score", 0.0) for s in cohort_students) / max(total_cohort, 1), 1)

    high_acad = sum(1 for s in cohort_students if s.get("academic_risk", {}).get("level") == "High")
    high_place = sum(1 for s in cohort_students if s.get("placement_risk", {}).get("level") == "High")

    risk_dist = {
        "High": sum(1 for s in cohort_students if s.get("academic_risk", {}).get("level") == "High" or s.get("placement_risk", {}).get("level") == "High"),
        "Medium": sum(1 for s in cohort_students if (s.get("academic_risk", {}).get("level") == "Medium" or s.get("placement_risk", {}).get("level") == "Medium") and s.get("academic_risk", {}).get("level") != "High" and s.get("placement_risk", {}).get("level") != "High"),
        "Low": sum(1 for s in cohort_students if s.get("academic_risk", {}).get("level") == "Low" and s.get("placement_risk", {}).get("level") == "Low")
    }

    authorized_summary = []
    for s in cohort_students[:40]:
        authorized_summary.append({
            "student_id": s["student_id"],
            "name": s["name"],
            "department": s["department"],
            "year": s["year"],
            "cgpa": s.get("academics", {}).get("cgpa", 0.0),
            "attendance": s.get("academics", {}).get("overall_attendance", 0.0),
            "success_score": s.get("success_score", 0.0),
            "academic_risk": s.get("academic_risk", {}).get("level", "Low"),
            "placement_risk": s.get("placement_risk", {}).get("level", "Low")
        })

    urgent_candidates = [
        s for s in authorized_summary
        if s["academic_risk"] == "High" or s["placement_risk"] == "High"
    ]
    urgent_candidates.sort(key=lambda x: x["success_score"])

    return FacultyDashboardResponse(
        faculty_id=faculty_id,
        faculty_name=fac_name,
        subject=fac_subj,
        department=fac_dept,
        designation=fac_desig,
        role=user.get("role", "FACULTY"),
        is_admin=is_admin,
        cohort_total_students=total_cohort,
        cohort_average_score=avg_score,
        cohort_high_academic_risk=high_acad,
        cohort_high_placement_risk=high_place,
        cohort_risk_distribution=risk_dist,
        assigned_interventions=assigned_interventions,
        authorized_students=authorized_summary,
        urgent_attention_students=urgent_candidates[:8]
    )

