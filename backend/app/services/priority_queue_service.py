from typing import List, Dict, Any, Optional, Tuple
from app.schemas.priority_queue import (
    PriorityQueueItem,
    PriorityQueueResponse,
    PriorityFactorDetail
)
from app.schemas.student import ScoreDriver, StudentDrivers
from app.core.config import ScoringWeights

class PriorityQueueService:
    @staticmethod
    def compute_student_factors(s: Dict[str, Any]) -> Tuple[float, float, float, float, str, Dict[str, PriorityFactorDetail], List[str], str]:
        acad = s.get("academics", {})
        place = s.get("placement", {})
        skills = s.get("skills", {})
        lms = s.get("lms", {})
        act = s.get("activities", {})
        fb = s.get("feedback", {})
        acad_risk = s.get("academic_risk", {})
        place_risk = s.get("placement_risk", {})
        intel = s.get("intelligence", {})

        # -------------------------------------------------------------
        # 1. RISK FACTOR [0, 1]
        # Combines academic risk, placement risk, success score deficit, anomaly score
        # -------------------------------------------------------------
        acad_r = acad_risk.get("score", 0.0) / 100.0
        place_r = place_risk.get("score", 0.0) / 100.0
        success_score = float(s.get("success_score", 50.0))
        deficit = max(0.0, (100.0 - success_score) / 100.0)
        anom_score = float(intel.get("anomaly_score", 0.0)) if intel else 0.0

        risk_val = min(1.0, max(0.05, (0.35 * acad_r) + (0.25 * place_r) + (0.25 * deficit) + (0.15 * anom_score)))

        risk_reasons = []
        if acad_risk.get("level") == "High":
            risk_reasons.append(f"High Academic Risk (index: {acad_risk.get('score', 0):.0f}/100)")
        elif acad_risk.get("level") == "Medium":
            risk_reasons.append(f"Moderate Academic Risk (index: {acad_risk.get('score', 0):.0f}/100)")

        if place_risk.get("level") == "High":
            risk_reasons.append(f"High Placement Risk (index: {place_risk.get('score', 0):.0f}/100)")
        elif place_risk.get("level") == "Medium":
            risk_reasons.append(f"Moderate Placement Risk (index: {place_risk.get('score', 0):.0f}/100)")

        if anom_score >= 0.65:
            risk_reasons.append(f"High Multivariate Anomaly outlier score ({anom_score:.2f}/1.0)")
        if not risk_reasons:
            risk_reasons.append("Overall institutional indicators within standard safety thresholds")

        # -------------------------------------------------------------
        # 2. URGENCY FACTOR [0, 1]
        # Considers:
        # - attendance <= 85%
        # - active backlogs
        # - falling SGPA / downward coursework trajectory
        # - placement-semester students (Years 3 & 4) with weak readiness
        # -------------------------------------------------------------
        urgency_points = 0.05
        urgency_reasons = []

        att = float(acad.get("overall_attendance", 100.0))
        if att < 75.0:
            urgency_points += 0.35
            urgency_reasons.append(f"Statutory attendance shortfall ({att:.1f}% is below 75% university limit)")
        elif att <= 85.0:
            urgency_points += 0.20
            urgency_reasons.append(f"Attendance warning ({att:.1f}% <= 85% safety threshold)")

        backlogs = int(acad.get("backlogs", 0))
        if backlogs >= 2:
            urgency_points += 0.35
            urgency_reasons.append(f"{backlogs} active uncleared backlogs endangering degree timeline")
        elif backlogs == 1:
            urgency_points += 0.20
            urgency_reasons.append("1 active backlog requiring immediate semester clearance")

        cgpa = float(acad.get("cgpa", 7.0))
        avg_m = float(acad.get("avg_marks", 70.0))
        # Falling trajectory check: recent subject avg marks / 10 is significantly lower than cumulative CGPA
        if (avg_m / 10.0) < (cgpa - 0.4):
            urgency_points += 0.15
            urgency_reasons.append(f"Downward academic trajectory (avg marks {avg_m:.1f}% vs CGPA {cgpa:.2f})")

        yr = int(s.get("year", 1))
        coding = float(place.get("coding_score", 70.0))
        aptitude = float(place.get("aptitude_score", 70.0))
        mocks = int(place.get("mock_interviews_attended", 0))

        # Placement semester (Year 3 = Sems 5/6, Year 4 = Sems 7/8)
        if yr >= 3:
            if coding < 50.0 or aptitude < 50.0 or mocks == 0:
                urgency_points += 0.25
                gap_parts = []
                if coding < 50.0:
                    gap_parts.append(f"coding {coding:.0f}/100")
                if aptitude < 50.0:
                    gap_parts.append(f"aptitude {aptitude:.0f}/100")
                if mocks == 0:
                    gap_parts.append("0 mock interviews")
                urgency_reasons.append(f"Imminent placement drive vulnerability in Year {yr} ({', '.join(gap_parts)})")

        urgency_val = min(1.0, max(0.05, urgency_points))
        if not urgency_reasons:
            urgency_reasons.append("No acute attendance or graduation deadlines threatened")

        # -------------------------------------------------------------
        # 3. RECOVERABILITY FACTOR [0, 1]
        # Reflects available strengths (skills, soft skills, engagement, LMS),
        # reduced for multiple backlogs combined with very low attendance & LMS
        # -------------------------------------------------------------
        soft = float(skills.get("soft_skills_avg", 50.0)) / 100.0
        tech = float(skills.get("technical_assessment_score", 50.0)) / 100.0
        coding_cap = coding / 100.0
        best_skill = max(tech, coding_cap)
        lms_logins = int(lms.get("login_frequency", 20))
        lms_ratio = min(1.0, lms_logins / 30.0)
        events = int(act.get("events_participated", 0))
        certs = int(act.get("certifications_count", 0))
        eng_ratio = min(1.0, (events + certs * 2) / 6.0)
        sat_ratio = float(fb.get("overall_satisfaction", 3.0)) / 5.0

        strength_base = (0.25 * soft) + (0.25 * best_skill) + (0.20 * lms_ratio) + (0.15 * eng_ratio) + (0.15 * sat_ratio)

        penalty = 0.0
        rec_reasons = []

        # Reduced for multiple backlogs combined with very low attendance and LMS activity
        if backlogs >= 2 and att < 75.0 and lms_logins < 20:
            penalty += 0.35
            rec_reasons.append(f"Severe engagement detachment: {backlogs} backlogs coupled with sub-75% attendance and low LMS logins")
        elif backlogs >= 2:
            penalty += 0.15
            rec_reasons.append(f"Academic load drag from {backlogs} active course backlogs")

        if best_skill >= 0.70:
            rec_reasons.append(f"Strong practical domain aptitude ({int(best_skill * 100)}/100 tech assessment)")
        if soft >= 0.70:
            rec_reasons.append(f"High communication and collaboration foundation ({int(soft * 100)}/100)")
        if lms_logins >= 24:
            rec_reasons.append(f"Consistent digital platform engagement ({lms_logins} logins/mo)")
        if not rec_reasons:
            rec_reasons.append("Moderate baseline recovery agility across domain indicators")

        recoverability_val = min(1.0, max(0.10, strength_base - penalty))

        # -------------------------------------------------------------
        # PRIORITY SCORE = product * 100
        # -------------------------------------------------------------
        priority_score = round(risk_val * urgency_val * recoverability_val * 100.0, 1)

        # Risk tier determination
        if priority_score >= 32.0 or (risk_val >= 0.65 and urgency_val >= 0.85):
            tier = "Critical Priority"
        elif priority_score >= 22.0:
            tier = "High Priority"
        elif priority_score >= 12.0:
            tier = "Medium Priority"
        else:
            tier = "Low Priority"

        # Construct top 3 concise plain-language reasons
        candidate_reasons = []
        if att < 75.0:
            candidate_reasons.append(f"Statutory attendance shortfall ({att:.1f}% is below 75% detention threshold)")
        elif att <= 85.0:
            candidate_reasons.append(f"Attendance warning ({att:.1f}% <= 85% safety benchmark)")

        if backlogs >= 2:
            candidate_reasons.append(f"{backlogs} active uncleared course backlogs endanger graduation timeline")
        elif backlogs == 1:
            candidate_reasons.append("1 active backlog requires clearance this semester")

        if yr >= 3 and (coding < 50.0 or aptitude < 50.0):
            candidate_reasons.append(f"Placement screening vulnerability: Coding {coding:.0f}/100, Aptitude {aptitude:.0f}/100")
        elif yr >= 3 and mocks == 0:
            candidate_reasons.append(f"Year {yr} student with 0 mock interviews completed")
        elif cgpa < 6.0:
            candidate_reasons.append(f"Sub-6.0 CGPA ({cgpa:.2f}) threatens minimum graduation standing")
        elif (avg_m / 10.0) < (cgpa - 0.4):
            candidate_reasons.append(f"Recent test marks ({avg_m:.1f}%) indicate falling performance trend")
        elif anom_score >= 0.65:
            candidate_reasons.append(f"Multivariate outlier distress pattern flagged by ML anomaly detector")

        if not candidate_reasons:
            candidate_reasons = [
                f"CGPA {cgpa:.2f} with {att:.1f}% attendance",
                f"Coding assessment {coding:.0f}/100 and Aptitude {aptitude:.0f}/100",
                "Stable progression across core criteria"
            ]

        top_3_reasons = candidate_reasons[:3]

        # Recommended Action Plan
        if backlogs >= 2 and att < 75.0:
            action = "Immediate 48-hour faculty counseling: issue statutory attendance warning and assign backlog clearance tutor."
        elif yr >= 3 and (coding < 50.0 or mocks == 0):
            action = "Mandatory enrollment in 6-week Coding & DSA Bootcamp and schedule technical mock interview with alumni."
        elif backlogs >= 1:
            action = "Schedule department mentor review session to formulate course backlog clearance study plan."
        elif att <= 85.0:
            action = "Issue attendance alert and bi-weekly check-in with faculty advisor."
        else:
            action = "Routine academic advisor check-in to support continued progression."

        factors_map = {
            "risk": PriorityFactorDetail(value=round(risk_val, 3), reasons=risk_reasons[:2]),
            "urgency": PriorityFactorDetail(value=round(urgency_val, 3), reasons=urgency_reasons[:2]),
            "recoverability": PriorityFactorDetail(value=round(recoverability_val, 3), reasons=rec_reasons[:2])
        }

        return (
            priority_score,
            round(risk_val, 3),
            round(urgency_val, 3),
            round(recoverability_val, 3),
            tier,
            factors_map,
            top_3_reasons,
            action
        )

    @classmethod
    def get_priority_queue(
        cls,
        students: List[Dict[str, Any]],
        department: Optional[str] = None,
        semester: Optional[int] = None,
        limit: int = 10
    ) -> PriorityQueueResponse:
        filtered = []

        dept_filter = department.strip().upper() if department else None

        for s in students:
            # Department filter
            if dept_filter and s.get("department", "").upper() != dept_filter:
                continue

            # Semester filter: matches exact semester if present or year-equivalent
            if semester is not None:
                yr = int(s.get("year", 1))
                s_sem = int(s.get("semester", yr * 2))
                # Match semester if s_sem == semester or if semester passed represents year (1-4) or corresponding semesters (2*yr-1, 2*yr)
                sem_matches = (
                    s_sem == semester or
                    yr == semester or
                    (2 * yr - 1) == semester or
                    (2 * yr) == semester
                )
                if not sem_matches:
                    continue

            filtered.append(s)

        items: List[PriorityQueueItem] = []

        for s in filtered:
            (
                p_score,
                r_val,
                u_val,
                c_val,
                tier,
                factors_map,
                top_3,
                action
            ) = cls.compute_student_factors(s)

            yr = int(s.get("year", 1))
            sem = int(s.get("semester", yr * 2))

            items.append(PriorityQueueItem(
                student_id=s["student_id"],
                name=s["name"],
                department=s.get("department", "Unknown"),
                year=yr,
                semester=sem,
                priority_score=p_score,
                risk_tier=tier,
                risk_factor=r_val,
                urgency_factor=u_val,
                recoverability_factor=c_val,
                factors=factors_map,
                top_reasons=top_3,
                recommended_action=action,
                academic_risk_level=s.get("academic_risk", {}).get("level", "Low"),
                placement_risk_level=s.get("placement_risk", {}).get("level", "Low"),
                cgpa=float(s.get("academics", {}).get("cgpa", 0.0)),
                attendance=float(s.get("academics", {}).get("overall_attendance", 0.0)),
                backlogs=int(s.get("academics", {}).get("backlogs", 0))
            ))

        # Sort descending by priority score
        items.sort(key=lambda x: x.priority_score, reverse=True)

        return PriorityQueueResponse(
            total_in_queue=len(students),
            filtered_count=len(items),
            limit=limit,
            department_filter=department,
            semester_filter=semester,
            items=items[:limit]
        )


class DriverCalculator:
    """
    Computes top 3 positive and negative score drivers for an individual student:
    Impact = weight * (student indicator - department/semester cohort mean)
    Extracts actual triggered institutional risk rules.
    """
    @staticmethod
    def calculate_drivers(
        student: Dict[str, Any],
        all_students: List[Dict[str, Any]],
        weights: ScoringWeights
    ) -> StudentDrivers:
        dept = student.get("department", "")
        yr = student.get("year", 1)

        # Department + Year cohort
        cohort = [s for s in all_students if s.get("department") == dept and s.get("year") == yr]
        cohort_label = f"{dept} Year {yr}"
        if len(cohort) < 3:
            cohort = [s for s in all_students if s.get("department") == dept]
            cohort_label = f"{dept} Department"
        if not cohort:
            cohort = all_students
            cohort_label = "Campus"

        # Categories mapping to weight attributes
        cat_configs = [
            ("Academic Performance", weights.academic_performance, "GPA, Coursework Marks, & Backlogs"),
            ("Attendance", weights.attendance, "Statutory Classroom Attendance"),
            ("LMS Participation", weights.lms_participation, "Digital Portal Logins"),
            ("Student Engagement", weights.student_engagement, "Events, Clubs, Certs, & Hackathons"),
            ("Placement Readiness", weights.placement_readiness, "Coding, Aptitude, & Mock Interviews"),
            ("Technical & Soft Skills", weights.technical_soft_skills, "Domain Test & Communication Competencies"),
            ("Feedback & Satisfaction", weights.feedback_support, "Institutional Perception & Appraisals"),
        ]

        # Extract student normalized category values
        s_breakdown = {b["category"]: float(b["normalized_score"]) for b in student.get("score_breakdown", [])}

        drivers_list: List[ScoreDriver] = []

        for cat_name, cat_weight, desc in cat_configs:
            s_val = s_breakdown.get(cat_name, 50.0)

            # Compute cohort mean for this category
            cohort_vals = []
            for st in cohort:
                for b in st.get("score_breakdown", []):
                    if b["category"] == cat_name:
                        cohort_vals.append(float(b["normalized_score"]))
            c_mean = sum(cohort_vals) / len(cohort_vals) if cohort_vals else 50.0

            deviation = round(s_val - c_mean, 2)
            impact = round(cat_weight * deviation, 2)

            if impact >= 0:
                imp_type = "positive"
                exp = f"{cat_name} (+{impact:.1f} pts): Normalized score of {s_val:.1f} is +{deviation:.1f} pts above {cohort_label} cohort average ({c_mean:.1f})."
            else:
                imp_type = "negative"
                exp = f"{cat_name} ({impact:.1f} pts): Normalized score of {s_val:.1f} is {deviation:.1f} pts below {cohort_label} cohort average ({c_mean:.1f})."

            drivers_list.append(ScoreDriver(
                category=cat_name,
                indicator=desc,
                weight=round(cat_weight, 2),
                student_value=round(s_val, 1),
                cohort_mean=round(c_mean, 1),
                deviation=deviation,
                impact_score=impact,
                impact_type=imp_type,
                explanation=exp
            ))

        # Top 3 positive (highest positive impact)
        positives = sorted([d for d in drivers_list if d.impact_score > 0], key=lambda x: x.impact_score, reverse=True)[:3]
        if len(positives) < 3:
            remaining = [d for d in drivers_list if d.impact_score == 0 and d not in positives]
            positives.extend(remaining[:3 - len(positives)])

        # Top 3 negative (lowest negative impact)
        negatives = sorted([d for d in drivers_list if d.impact_score < 0], key=lambda x: x.impact_score)[:3]
        if len(negatives) < 3:
            remaining = [d for d in drivers_list if d.impact_score == 0 and d not in negatives and d not in positives]
            negatives.extend(remaining[:3 - len(negatives)])

        # Extract actual triggered risk rules
        acad_factors = student.get("academic_risk", {}).get("contributing_factors", [])
        place_factors = student.get("placement_risk", {}).get("contributing_factors", [])

        benign_substrings = [
            "satisfy all benchmarks",
            "meet or exceed benchmarks",
            "satisfy benchmarks"
        ]

        triggered = []
        for f in acad_factors + place_factors:
            if not any(b in f.lower() for b in benign_substrings):
                if f not in triggered:
                    triggered.append(f)

        if not triggered:
            triggered.append("No institutional risk thresholds triggered; all academic and placement metrics meet benchmarks.")

        return StudentDrivers(
            top_positive_drivers=positives,
            top_negative_drivers=negatives,
            triggered_risk_rules=triggered
        )
