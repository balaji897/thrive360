from typing import Dict, Any, List
from app.schemas.student import RiskAssessment

class RiskDetector:
    """
    Evaluates dual institutional risks:
    1. Academic Risk: Based on CGPA, backlogs, overall & subject attendance, subject marks, LMS engagement.
    2. Placement Risk: Based on coding scores, aptitude, mock interviews, technical assessment, soft skills.
    """

    def evaluate_academic_risk(self, student_data: Dict[str, Any]) -> RiskAssessment:
        cgpa = float(student_data.get("cgpa", 0.0))
        backlogs = int(student_data.get("backlogs", 0))
        overall_att = float(student_data.get("overall_attendance", 0.0))
        lms_logins = int(student_data.get("lms_login_frequency", 0))

        # Check subject level grades & attendance
        subjects = [
            ("Maths", float(student_data.get("maths_marks", 100)), float(student_data.get("maths_attendance", 100))),
            ("Physics", float(student_data.get("physics_marks", 100)), float(student_data.get("physics_attendance", 100))),
            ("Programming", float(student_data.get("programming_marks", 100)), float(student_data.get("programming_attendance", 100))),
            ("DBMS", float(student_data.get("dbms_marks", 100)), float(student_data.get("dbms_attendance", 100))),
            ("OS", float(student_data.get("os_marks", 100)), float(student_data.get("os_attendance", 100))),
        ]

        failed_subjects = [s[0] for s in subjects if s[1] < 40.0]
        low_att_subjects = [s[0] for s in subjects if s[2] < 75.0]

        factors: List[str] = []
        recommendations: List[str] = []
        risk_points = 0.0

        # CGPA threshold analysis
        if cgpa < 6.0:
            factors.append(f"Critical CGPA: {cgpa:.2f} is below minimum graduation safety threshold (6.0)")
            risk_points += 35.0
        elif cgpa < 7.0:
            factors.append(f"Moderate CGPA: {cgpa:.2f} requires improvement to maintain academic standing")
            risk_points += 15.0

        # Backlogs analysis
        if backlogs >= 2:
            factors.append(f"Severe Backlogs: {backlogs} uncleared backlogs endangering graduation timeline")
            risk_points += 35.0
        elif backlogs == 1:
            factors.append(f"Active Backlog: 1 active backlog requiring clearance in upcoming semester")
            risk_points += 20.0

        # Attendance statutory compliance (75% standard)
        if overall_att < 75.0:
            factors.append(f"Attendance Shortfall: Overall attendance is {overall_att:.1f}%, below university statutory 75% limit")
            risk_points += 25.0
        elif overall_att < 80.0:
            factors.append(f"Marginal Attendance: Overall attendance is {overall_att:.1f}%, close to detention threshold")
            risk_points += 10.0

        # Subject failures
        if failed_subjects:
            factors.append(f"Failing marks (<40) in {', '.join(failed_subjects)}")
            risk_points += len(failed_subjects) * 10.0

        # Subject low attendance
        if low_att_subjects and overall_att >= 75.0:
            factors.append(f"Specific subject attendance below 75% in: {', '.join(low_att_subjects)}")
            risk_points += 8.0

        # Low LMS engagement as early warning
        if lms_logins < 18:
            factors.append(f"Low LMS Engagement: Only {lms_logins} logins this cycle")
            risk_points += 7.0

        # Determine level
        if backlogs >= 2 or cgpa < 6.0 or overall_att < 75.0 or len(failed_subjects) >= 2 or risk_points >= 40.0:
            level = "High"
            recommendations.append("Immediate faculty advisor counseling session within 48 hours")
            recommendations.append("Mandatory remedial tutoring for uncleared subjects")
            recommendations.append("Bi-weekly attendance check-ins and parental notification if below 70%")
        elif backlogs == 1 or (6.0 <= cgpa < 7.0) or (75.0 <= overall_att < 80.0) or risk_points >= 18.0:
            level = "Medium"
            recommendations.append("Assign peer study buddy for difficult coursework")
            recommendations.append("Schedule backlog clearance review with department mentor")
            recommendations.append("Monitor LMS assignment submissions weekly")
        else:
            level = "Low"
            recommendations.append("Encourage student to maintain academic excellence")
            recommendations.append("Offer honors/research project opportunities")

        risk_score = round(min(100.0, risk_points), 1)

        evidence = {
            "cgpa": cgpa,
            "backlogs": backlogs,
            "overall_attendance": overall_att,
            "failed_subjects": failed_subjects,
            "low_attendance_subjects": low_att_subjects,
            "lms_login_frequency": lms_logins
        }

        return RiskAssessment(
            level=level,
            score=risk_score,
            contributing_factors=factors if factors else ["Academic performance and attendance satisfy all benchmarks"],
            evidence=evidence,
            recommendations=recommendations
        )

    def evaluate_placement_risk(self, student_data: Dict[str, Any]) -> RiskAssessment:
        coding = float(student_data.get("coding_score", 0.0))
        aptitude = float(student_data.get("aptitude_score", 0.0))
        tech_assessment = float(student_data.get("technical_assessment_score", 0.0))
        mock_interviews = int(student_data.get("mock_interviews_attended", 0))
        mock_score = float(student_data.get("mock_interview_avg_score", 0.0))
        soft_skills = float(student_data.get("soft_skills_avg", 0.0))
        certs = int(student_data.get("certifications_count", 0))
        year = int(student_data.get("year", 1))

        factors: List[str] = []
        recommendations: List[str] = []
        risk_points = 0.0

        # Coding proficiency analysis
        if coding < 50.0:
            factors.append(f"Critical Coding Score: {coding:.0f}/100 is below recruitment benchmark (50)")
            risk_points += 30.0
        elif coding < 65.0:
            factors.append(f"Moderate Coding Score: {coding:.0f}/100 may hinder technical screening for Tier-1 companies")
            risk_points += 15.0

        # Aptitude analysis
        if aptitude < 50.0:
            factors.append(f"Low Aptitude Score: {aptitude:.0f}/100 creates high failure risk in initial placement rounds")
            risk_points += 25.0
        elif aptitude < 65.0:
            factors.append(f"Moderate Aptitude: {aptitude:.0f}/100 needs enhancement in quantitative/logical reasoning")
            risk_points += 12.0

        # Technical assessment
        if tech_assessment < 55.0:
            factors.append(f"Weak Technical Assessment: {tech_assessment:.0f}/100 indicates domain knowledge gaps")
            risk_points += 20.0
        elif tech_assessment < 70.0:
            factors.append(f"Fair Technical Assessment: {tech_assessment:.0f}/100 shows scope for core engineering depth")
            risk_points += 8.0

        # Mock interviews
        if mock_interviews == 0:
            factors.append("Zero mock interviews attended to date")
            risk_points += 15.0
        elif mock_score < 55.0:
            factors.append(f"Low Mock Interview Score: {mock_score:.0f}/100 reflects interview anxiety or gap in behavioral prep")
            risk_points += 18.0

        # Soft skills & communication
        if soft_skills < 55.0:
            factors.append(f"Low Soft Skills Rating: {soft_skills:.1f}/100 indicates communication/teamwork coaching needed")
            risk_points += 12.0

        # Certifications (especially crucial for Year 3 & 4)
        if year >= 3 and certs == 0:
            factors.append(f"Year {year} student with zero industry certifications on record")
            risk_points += 10.0

        # Determine placement risk level
        if coding < 50.0 or aptitude < 50.0 or tech_assessment < 50.0 or risk_points >= 40.0:
            level = "High"
            recommendations.append("Enroll in mandatory 6-week intensive Coding & DSA Bootcamp")
            recommendations.append("Assign 3 weekly timed aptitude mock tests on placement portal")
            recommendations.append("Schedule 2 mandatory 1-on-1 technical mock interviews with alumni/faculty")
        elif (50.0 <= coding < 65.0) or (50.0 <= aptitude < 65.0) or (mock_interviews == 0) or risk_points >= 18.0:
            level = "Medium"
            recommendations.append("Recommended participation in weekly competitive coding contests")
            recommendations.append("Complete 1 resume-building industry certification (e.g. AWS/Azure/NPTEL)")
            recommendations.append("Schedule 1 mock interview session focused on soft skills and HR questions")
        else:
            level = "Low"
            recommendations.append("Candidate is on track for campus placement drives")
            recommendations.append("Encourage participation in high-tier hackathons and product company drives")

        risk_score = round(min(100.0, risk_points), 1)

        evidence = {
            "coding_score": coding,
            "aptitude_score": aptitude,
            "technical_assessment_score": tech_assessment,
            "mock_interviews_attended": mock_interviews,
            "mock_interview_avg_score": mock_score,
            "soft_skills_avg": soft_skills,
            "certifications_count": certs,
            "year": year
        }

        return RiskAssessment(
            level=level,
            score=risk_score,
            contributing_factors=factors if factors else ["All placement, aptitude, and skill indicators meet or exceed benchmarks"],
            evidence=evidence,
            recommendations=recommendations
        )
