from typing import Dict, Any, List, Tuple
from app.core.config import ScoringWeights
from app.schemas.student import ScoreContribution

class SuccessScorer:
    def __init__(self, weights: ScoringWeights = None):
        self.weights = weights or ScoringWeights()

    def update_weights(self, new_weights: ScoringWeights):
        self.weights = new_weights

    def calculate_score(self, student_data: Dict[str, Any]) -> Tuple[float, List[ScoreContribution]]:
        contributions: List[ScoreContribution] = []

        # 1. Academic Performance (Weight: 25%)
        cgpa = float(student_data.get("cgpa", 0.0))
        avg_marks = float(student_data.get("avg_marks", 0.0))
        backlogs = int(student_data.get("backlogs", 0))
        
        # Base academic score: blend of CGPA (0-10 -> 0-100) and avg marks (0-100)
        # Deduct 5 points per backlog to reflect academic risk
        academic_base = (cgpa * 10.0 * 0.5) + (avg_marks * 0.5)
        academic_normalized = max(0.0, min(100.0, academic_base - (backlogs * 5.0)))
        academic_contrib = round(academic_normalized * self.weights.academic_performance, 2)
        
        contributions.append(ScoreContribution(
            category="Academic Performance",
            weight=self.weights.academic_performance,
            raw_value=round(cgpa, 2),
            normalized_score=round(academic_normalized, 1),
            weighted_contribution=academic_contrib,
            description=f"CGPA {cgpa:.2f}, avg marks {avg_marks:.1f}%, minus {backlogs} backlog(s)"
        ))

        # 2. Attendance (Weight: 20%)
        overall_att = float(student_data.get("overall_attendance", 0.0))
        attendance_normalized = max(0.0, min(100.0, overall_att))
        attendance_contrib = round(attendance_normalized * self.weights.attendance, 2)
        
        contributions.append(ScoreContribution(
            category="Attendance",
            weight=self.weights.attendance,
            raw_value=round(overall_att, 1),
            normalized_score=round(attendance_normalized, 1),
            weighted_contribution=attendance_contrib,
            description=f"Cohort attendance average of {overall_att:.1f}% across all subjects"
        ))

        # 3. LMS Participation (Weight: 10%)
        lms_logins = float(student_data.get("lms_login_frequency", 0))
        # Benchmark: 30 logins/month is standard high engagement in cohort
        lms_normalized = max(0.0, min(100.0, (lms_logins / 30.0) * 100.0))
        lms_contrib = round(lms_normalized * self.weights.lms_participation, 2)
        
        contributions.append(ScoreContribution(
            category="LMS Participation",
            weight=self.weights.lms_participation,
            raw_value=lms_logins,
            normalized_score=round(lms_normalized, 1),
            weighted_contribution=lms_contrib,
            description=f"{int(lms_logins)} digital LMS platform logins recorded"
        ))

        # 4. Student Engagement (Weight: 10%)
        events = float(student_data.get("events_participated", 0))
        clubs = float(student_data.get("clubs_joined_count", 0))
        hackathons_part = float(student_data.get("hackathons_participated", 0))
        hackathons_won = float(student_data.get("hackathons_won", 0))
        certs = float(student_data.get("certifications_count", 0))

        # Component sums: events(max 30) + clubs(max 20) + hackathons(max 25) + certs(max 25) = 100
        engagement_pts = (
            min(30.0, events * 6.0) +
            min(20.0, clubs * 10.0) +
            min(15.0, hackathons_part * 5.0) +
            min(10.0, hackathons_won * 5.0) +
            min(25.0, certs * 12.5)
        )
        engagement_normalized = max(0.0, min(100.0, engagement_pts))
        engagement_contrib = round(engagement_normalized * self.weights.student_engagement, 2)
        
        contributions.append(ScoreContribution(
            category="Student Engagement",
            weight=self.weights.student_engagement,
            raw_value=round(events + clubs + certs, 1),
            normalized_score=round(engagement_normalized, 1),
            weighted_contribution=engagement_contrib,
            description=f"{int(events)} events, {int(clubs)} clubs, {int(certs)} certs, {int(hackathons_part)} hackathons"
        ))

        # 5. Placement Readiness (Weight: 20%)
        aptitude = float(student_data.get("aptitude_score", 0.0))
        coding = float(student_data.get("coding_score", 0.0))
        mock_interviews = int(student_data.get("mock_interviews_attended", 0))
        mock_score = float(student_data.get("mock_interview_avg_score", 0.0))

        # If student attended mock interviews, blend 35% coding, 35% aptitude, 30% mock score
        # If student attended 0 mock interviews, blend 50% coding, 50% aptitude
        if mock_interviews > 0:
            placement_normalized = (coding * 0.35) + (aptitude * 0.35) + (mock_score * 0.30)
        else:
            placement_normalized = (coding * 0.50) + (aptitude * 0.50)
            
        placement_normalized = max(0.0, min(100.0, placement_normalized))
        placement_contrib = round(placement_normalized * self.weights.placement_readiness, 2)
        
        contributions.append(ScoreContribution(
            category="Placement Readiness",
            weight=self.weights.placement_readiness,
            raw_value=round(coding, 1),
            normalized_score=round(placement_normalized, 1),
            weighted_contribution=placement_contrib,
            description=f"Coding {coding:.0f}/100, Aptitude {aptitude:.0f}/100, Mock Avg {mock_score:.0f}/100"
        ))

        # 6. Technical & Soft Skills (Weight: 10%)
        tech_assessment = float(student_data.get("technical_assessment_score", 0.0))
        soft_skills_avg = float(student_data.get("soft_skills_avg", 0.0))
        
        skills_normalized = max(0.0, min(100.0, (tech_assessment * 0.50) + (soft_skills_avg * 0.50)))
        skills_contrib = round(skills_normalized * self.weights.technical_soft_skills, 2)
        
        contributions.append(ScoreContribution(
            category="Technical & Soft Skills",
            weight=self.weights.technical_soft_skills,
            raw_value=round(tech_assessment, 1),
            normalized_score=round(skills_normalized, 1),
            weighted_contribution=skills_contrib,
            description=f"Tech test score {tech_assessment:.0f}/100, Soft skills avg {soft_skills_avg:.1f}/100"
        ))

        # 7. Feedback & Campus Satisfaction (Weight: 5%)
        overall_sat = float(student_data.get("overall_satisfaction", 3.0))
        feedback_normalized = max(0.0, min(100.0, (overall_sat / 5.0) * 100.0))
        feedback_contrib = round(feedback_normalized * self.weights.feedback_support, 2)
        
        contributions.append(ScoreContribution(
            category="Feedback & Satisfaction",
            weight=self.weights.feedback_support,
            raw_value=round(overall_sat, 2),
            normalized_score=round(feedback_normalized, 1),
            weighted_contribution=feedback_contrib,
            description=f"Overall campus satisfaction rating {overall_sat:.1f}/5.0"
        ))

        # Final composite score
        total_score = round(sum(c.weighted_contribution for c in contributions), 1)
        total_score = max(0.0, min(100.0, total_score))

        return total_score, contributions
