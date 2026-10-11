import json
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Optional, Dict, Any
from app.core.config import settings
from app.schemas.intervention import Intervention, InterventionCreate, InterventionUpdate

class InterventionStore:
    def __init__(self, storage_file: Path = None):
        self.storage_file = storage_file or settings.INTERVENTIONS_FILE
        self.storage_file.parent.mkdir(parents=True, exist_ok=True)
        if not self.storage_file.exists():
            self._write_all([])

    def _read_all(self) -> List[Dict[str, Any]]:
        try:
            with open(self.storage_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def _write_all(self, data: List[Dict[str, Any]]):
        with open(self.storage_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def list_all(
        self,
        student_id: Optional[str] = None,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        category: Optional[str] = None
    ) -> List[Intervention]:
        records = self._read_all()
        filtered = []
        for r in records:
            if student_id and r.get("student_id") != student_id:
                continue
            if status and r.get("status", "").lower() != status.lower():
                continue
            if priority and r.get("priority", "").lower() != priority.lower():
                continue
            if category and r.get("category", "").lower() != category.lower():
                continue
            filtered.append(Intervention(**r))
        return filtered

    def get_by_id(self, intervention_id: str) -> Optional[Intervention]:
        records = self._read_all()
        for r in records:
            if r.get("id") == intervention_id:
                return Intervention(**r)
        return None

    def create(self, item: InterventionCreate) -> Intervention:
        records = self._read_all()
        now_str = datetime.now().isoformat()
        new_id = f"INT-{uuid.uuid4().hex[:8].upper()}"
        
        record = item.model_dump()
        record["id"] = new_id
        record["created_at"] = now_str
        record["updated_at"] = now_str
        record["outcome"] = ""

        records.append(record)
        self._write_all(records)
        return Intervention(**record)

    def update(self, intervention_id: str, updates: InterventionUpdate) -> Optional[Intervention]:
        records = self._read_all()
        found = False
        updated_record = None

        for i, r in enumerate(records):
            if r.get("id") == intervention_id:
                data_dict = updates.model_dump(exclude_unset=True)
                r.update(data_dict)
                r["updated_at"] = datetime.now().isoformat()
                records[i] = r
                updated_record = r
                found = True
                break

        if found and updated_record:
            self._write_all(records)
            return Intervention(**updated_record)
        return None

    def delete(self, intervention_id: str) -> bool:
        records = self._read_all()
        initial_len = len(records)
        records = [r for r in records if r.get("id") != intervention_id]
        if len(records) < initial_len:
            self._write_all(records)
            return True
        return False

    def seed_defaults_if_empty(self, students: List[Dict[str, Any]]):
        existing = self._read_all()
        if existing:
            return  # Already populated

        defaults = []
        now = datetime.now()

        # Find top high-risk students to generate realistic interventions
        high_risk_candidates = [
            s for s in students 
            if s.get("academic_risk", {}).get("level") == "High" or s.get("placement_risk", {}).get("level") == "High"
        ]

        faculty_names = ["Dr. Arvind Sharma (HOD IT)", "Prof. Sneha Rao (CSE)", "Dr. K. Ramanathan (Training Head)", "Prof. Meera Pillai (Dean Academics)"]

        if high_risk_candidates:
            # Candidate 1: Divya Goud or first high risk
            s1 = high_risk_candidates[0]
            defaults.append({
                "id": f"INT-{uuid.uuid4().hex[:8].upper()}",
                "student_id": s1["student_id"],
                "student_name": s1["name"],
                "category": "Academic",
                "title": "Remedial Tutoring & Backlog Clearance Plan",
                "description": f"Targeted academic recovery plan for {s1['name']} ({s1['student_id']}). Focus on clearing backlogs and lifting attendance above 75%.",
                "priority": "High",
                "assigned_faculty": faculty_names[0],
                "status": "In Progress",
                "due_date": (now + timedelta(days=14)).strftime("%Y-%m-%d"),
                "action_items": [
                    "Enroll in daily 4 PM tutorial sessions",
                    "Mandatory weekly attendance log check",
                    "Submit previous semester backlog question bank solutions"
                ],
                "notes": "Student attended first counseling session; expressed eagerness to improve DBMS and Maths.",
                "created_at": (now - timedelta(days=5)).isoformat(),
                "updated_at": now.isoformat(),
                "outcome": ""
            })

        if len(high_risk_candidates) > 1:
            s2 = high_risk_candidates[1]
            defaults.append({
                "id": f"INT-{uuid.uuid4().hex[:8].upper()}",
                "student_id": s2["student_id"],
                "student_name": s2["name"],
                "category": "Placement",
                "title": "DSA & Coding Accelerator Coaching",
                "description": f"Placement readiness intervention for {s2['name']}. Low coding assessment score requires hands-on problem solving sprint.",
                "priority": "High",
                "assigned_faculty": faculty_names[2],
                "status": "Pending",
                "due_date": (now + timedelta(days=21)).strftime("%Y-%m-%d"),
                "action_items": [
                    "Complete 50 LeetCode Easy/Medium problems in 3 weeks",
                    "Attend 2 alumni mock technical interviews",
                    "Resume audit and technical project review"
                ],
                "notes": "Notice issued by placement cell.",
                "created_at": (now - timedelta(days=2)).isoformat(),
                "updated_at": now.isoformat(),
                "outcome": ""
            })

        if len(high_risk_candidates) > 2:
            s3 = high_risk_candidates[2]
            defaults.append({
                "id": f"INT-{uuid.uuid4().hex[:8].upper()}",
                "student_id": s3["student_id"],
                "student_name": s3["name"],
                "category": "Attendance",
                "title": "Attendance Compliance & LMS Re-engagement",
                "description": f"Parent-faculty consultation regarding sub-75% attendance and low digital learning platform logins.",
                "priority": "Medium",
                "assigned_faculty": faculty_names[1],
                "status": "In Progress",
                "due_date": (now + timedelta(days=10)).strftime("%Y-%m-%d"),
                "action_items": [
                    "Sign attendance undertaking letter",
                    "Set up daily morning check-in with class representative",
                    "Complete pending video modules on LMS"
                ],
                "notes": "Parent informed via official email. Positive student response.",
                "created_at": (now - timedelta(days=7)).isoformat(),
                "updated_at": now.isoformat(),
                "outcome": ""
            })

        self._write_all(defaults)
