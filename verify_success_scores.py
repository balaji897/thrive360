import json

with open("backend/data/processed/integrated_students_250.json", "r", encoding="utf-8") as f:
    students = json.load(f)

students_by_id = {s["student_id"]: s for s in students}

test_ids = ["STU001", "STU002", "STU003", "STU250"]

print("=== MANUAL VERIFICATION OF STUDENT SUCCESS SCORES ===")

for sid in test_ids:
    s = students_by_id[sid]
    acad = s["academics"]
    lms = s["lms"]
    act = s["activities"]
    place = s["placement"]
    skills = s["skills"]
    fb = s["feedback"]
    
    # 1. Academic Performance (25%)
    cgpa = acad["cgpa"]
    avg_marks = acad["avg_marks"]
    backlogs = acad["backlogs"]
    acad_base = (cgpa * 10.0 * 0.5) + (avg_marks * 0.5)
    acad_norm = max(0.0, min(100.0, acad_base - (backlogs * 5.0)))
    acad_pts = round(acad_norm * 0.25, 2)
    
    # 2. Attendance (20%)
    att_norm = acad["overall_attendance"]
    att_pts = round(att_norm * 0.20, 2)
    
    # 3. LMS (10%)
    lms_norm = min(100.0, (lms["login_frequency"] / 30.0) * 100.0)
    lms_pts = round(lms_norm * 0.10, 2)
    
    # 4. Engagement (10%)
    eng_pts = (
        min(30.0, act["events_participated"] * 6.0) +
        min(20.0, act["clubs_joined_count"] * 10.0) +
        min(15.0, act["hackathons_participated"] * 5.0) +
        min(10.0, act["hackathons_won"] * 5.0) +
        min(25.0, act["certifications_count"] * 12.5)
    )
    eng_norm = max(0.0, min(100.0, eng_pts))
    eng_pts_contrib = round(eng_norm * 0.10, 2)
    
    # 5. Placement (20%)
    if place["mock_interviews_attended"] > 0:
        place_norm = (place["coding_score"] * 0.35) + (place["aptitude_score"] * 0.35) + (place["mock_interview_avg_score"] * 0.30)
    else:
        place_norm = (place["coding_score"] * 0.50) + (place["aptitude_score"] * 0.50)
    place_pts = round(place_norm * 0.20, 2)
    
    # 6. Skills (10%)
    skills_norm = (skills["technical_assessment_score"] * 0.50) + (skills["soft_skills_avg"] * 0.50)
    skills_pts = round(skills_norm * 0.10, 2)
    
    # 7. Feedback (5%)
    fb_norm = (fb["overall_satisfaction"] / 5.0) * 100.0
    fb_pts = round(fb_norm * 0.05, 2)
    
    manual_total = round(acad_pts + att_pts + lms_pts + eng_pts_contrib + place_pts + skills_pts + fb_pts, 1)
    stored_score = s["success_score"]
    
    diff = abs(manual_total - stored_score)
    print(f"\nStudent {sid} ({s['name']}):")
    print(f"  CGPA: {cgpa}, Backlogs: {backlogs}, Attendance: {att_norm}%")
    print(f"  Academic Contrib (25%): {acad_pts} (norm: {acad_norm:.1f})")
    print(f"  Attendance Contrib (20%): {att_pts} (norm: {att_norm:.1f})")
    print(f"  LMS Contrib (10%): {lms_pts} (norm: {lms_norm:.1f})")
    print(f"  Engagement Contrib (10%): {eng_pts_contrib} (norm: {eng_norm:.1f})")
    print(f"  Placement Contrib (20%): {place_pts} (norm: {place_norm:.1f})")
    print(f"  Skills Contrib (10%): {skills_pts} (norm: {skills_norm:.1f})")
    print(f"  Feedback Contrib (5%): {fb_pts} (norm: {fb_norm:.1f})")
    print(f"  Manual Total: {manual_total} | Stored Total: {stored_score} | Delta: {diff:.2f}")
    assert diff < 0.05, f"Discrepancy for {sid}: {diff}"
