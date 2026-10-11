from typing import List, Dict, Any
from app.schemas.analytics import StudentSegment

class SegmentationEngine:
    SEGMENTS_CONFIG = [
        {
            "id": "critical_dual_risk",
            "name": "Critical Dual Risk",
            "description": "Students with severe concurrent vulnerabilities in both academic progression and placement readiness.",
            "criteria": "Academic Risk = High AND Placement Risk = High",
            "recommended_strategy": "Urgent multi-department intervention: Assign dedicated faculty mentor, remedial classes, and foundation aptitude support."
        },
        {
            "id": "high_acad_low_placement",
            "name": "High Academic / Low Placement Readiness",
            "description": "Strong classroom performers (CGPA ≥ 7.5) whose practical coding or interview scores lag behind.",
            "criteria": "CGPA ≥ 7.5 AND (Coding Score < 60 OR Aptitude Score < 60 OR Placement Risk in [High, Medium])",
            "recommended_strategy": "Direct toward hands-on coding bootcamps, DSA labs, and peer mock interviews to translate theory into industry readiness."
        },
        {
            "id": "placement_ready_acad_risk",
            "name": "Placement Ready / Academic Risk",
            "description": "Practical talent with strong placement readiness (Coding ≥ 70) who are jeopardized by backlogs, low attendance, or falling CGPA.",
            "criteria": "Coding Score ≥ 70 AND (Backlogs > 0 OR CGPA < 6.5 OR Attendance < 75%)",
            "recommended_strategy": "Protect placement eligibility by providing fast-track backlog clearance support and strict attendance monitoring."
        },
        {
            "id": "low_engagement_drifting",
            "name": "Low Engagement / Drifting",
            "description": "Students disengaged from campus life and digital learning platforms, showing early signs of institutional detachment.",
            "criteria": "LMS Logins < 20 AND Events Participated ≤ 1 AND Clubs Joined = 0",
            "recommended_strategy": "Proactive advisor outreach, peer buddy pairing, and orientation into student clubs or study circles."
        },
        {
            "id": "all_round_achievers",
            "name": "All-Round Achievers",
            "description": "High performers across academics, attendance, technical skills, and placement preparation.",
            "criteria": "CGPA ≥ 8.0 AND Attendance ≥ 85% AND Success Score ≥ 78% AND Backlogs = 0",
            "recommended_strategy": "Channel into tier-1 recruitment drives, research fellowships, hackathon teams, and student leadership roles."
        },
        {
            "id": "steady_core",
            "name": "Steady Core Performers",
            "description": "Solid mainstream cohort maintaining consistent acceptable progress without acute flags.",
            "criteria": "Consistent average indicators across academics, attendance, and skills.",
            "recommended_strategy": "Regular faculty advising, skill enhancement electives, and structured placement milestones."
        }
    ]

    def classify_student(self, student: Dict[str, Any]) -> str:
        acad_level = student.get("academic_risk", {}).get("level", "Low")
        place_level = student.get("placement_risk", {}).get("level", "Low")
        cgpa = float(student.get("academics", {}).get("cgpa", 0.0))
        backlogs = int(student.get("academics", {}).get("backlogs", 0))
        attendance = float(student.get("academics", {}).get("overall_attendance", 0.0))
        coding = float(student.get("placement", {}).get("coding_score", 0.0))
        aptitude = float(student.get("placement", {}).get("aptitude_score", 0.0))
        lms_logins = int(student.get("lms", {}).get("login_frequency", 0))
        events = int(student.get("activities", {}).get("events_participated", 0))
        clubs = int(student.get("activities", {}).get("clubs_joined_count", 0))
        success_score = float(student.get("success_score", 0.0))

        # 1. Critical Dual Risk
        if acad_level == "High" and place_level == "High":
            return "Critical Dual Risk"

        # 2. High Academic / Low Placement
        if cgpa >= 7.5 and (coding < 60.0 or aptitude < 60.0 or place_level in ["High", "Medium"]):
            return "High Academic / Low Placement Readiness"

        # 3. Placement Ready / Academic Risk
        if coding >= 70.0 and (backlogs > 0 or cgpa < 6.5 or attendance < 75.0 or acad_level in ["High", "Medium"]):
            return "Placement Ready / Academic Risk"

        # 4. Low Engagement / Drifting
        if lms_logins < 20 and events <= 1 and clubs == 0:
            return "Low Engagement / Drifting"

        # 5. All-Round Achievers
        if cgpa >= 8.0 and attendance >= 85.0 and success_score >= 75.0 and backlogs == 0 and acad_level == "Low" and place_level == "Low":
            return "All-Round Achievers"

        # 6. Default Steady Core
        return "Steady Core Performers"

    def generate_segments(self, students: List[Dict[str, Any]]) -> List[StudentSegment]:
        segment_groups: Dict[str, List[Dict[str, Any]]] = {
            s["name"]: [] for s in self.SEGMENTS_CONFIG
        }

        for st in students:
            seg_name = st.get("primary_segment", "Steady Core Performers")
            if seg_name in segment_groups:
                segment_groups[seg_name].append(st)
            else:
                segment_groups["Steady Core Performers"].append(st)

        total_students = len(students) if students else 1
        results: List[StudentSegment] = []

        for cfg in self.SEGMENTS_CONFIG:
            group = segment_groups[cfg["name"]]
            count = len(group)
            percentage = round((count / total_students) * 100.0, 1)
            avg_score = round(sum(s.get("success_score", 0.0) for s in group) / count, 1) if count > 0 else 0.0
            student_ids = [s["student_id"] for s in group]

            results.append(StudentSegment(
                id=cfg["id"],
                name=cfg["name"],
                description=cfg["description"],
                criteria=cfg["criteria"],
                count=count,
                percentage=percentage,
                avg_success_score=avg_score,
                recommended_strategy=cfg["recommended_strategy"],
                student_ids=student_ids
            ))

        return results
