from pathlib import Path
from typing import Dict, Tuple, Optional
import os
import pandas as pd
from app.core.config import settings

class DataLoader:
    REQUIRED_FILES = {
        "students": [
            "students_250_cleaned.csv",
            "students_250_cleaned (1).csv"
        ],
        "lms": ["students_lms_250.csv"],
        "activities": ["students_activities_250.csv"],
        "placement": ["students_placement_readiness_250.csv"],
        "skills": ["students_skill_assessments_250.csv"],
        "feedback": ["students_feedback_250.csv"]
    }

    FILE_DESCRIPTIONS = {
        "students": "Academic marks, attendance by subject, backlogs, and CGPA",
        "lms": "Learning Management System (LMS) login frequency",
        "activities": "Campus events, club participation, hackathons, and certifications",
        "placement": "Aptitude, coding scores, and mock interview performance",
        "skills": "Technical assessments and multi-dimensional soft skills assessments",
        "feedback": "Student satisfaction, faculty ratings, and campus experience survey"
    }

    def __init__(self, raw_data_dir: Optional[Path] = None):
        self.raw_data_dir = raw_data_dir or settings.RAW_DATA_DIR
        self.workspace_dir = settings.WORKSPACE_RAW_DIR

    def _resolve_file_path(self, candidates: list[str]) -> Optional[Path]:
        # Check raw data directory first
        for name in candidates:
            p = self.raw_data_dir / name
            if p.exists() and p.is_file():
                return p
        # Check workspace directory fallback
        for name in candidates:
            p = self.workspace_dir / name
            if p.exists() and p.is_file():
                return p
        return None

    def load_raw_datasets(self) -> Tuple[Dict[str, pd.DataFrame], Dict[str, dict]]:
        dfs: Dict[str, pd.DataFrame] = {}
        file_audits: Dict[str, dict] = {}

        for key, candidate_names in self.REQUIRED_FILES.items():
            resolved_path = self._resolve_file_path(candidate_names)
            if not resolved_path:
                raise FileNotFoundError(
                    f"Required dataset '{key}' could not be located. Looked for {candidate_names} in {self.raw_data_dir} and {self.workspace_dir}."
                )

            # Read CSV
            df = pd.read_csv(resolved_path)
            
            # Normalize column names (strip whitespace)
            df.columns = [c.strip() for c in df.columns]

            # Validate Student_ID presence
            if "Student_ID" not in df.columns:
                raise ValueError(f"Dataset {resolved_path.name} is missing the mandatory 'Student_ID' column.")

            # Normalize Student_ID
            df["Student_ID"] = df["Student_ID"].astype(str).str.strip().str.upper()

            # Normalize Name if present
            if "Name" in df.columns:
                df["Name"] = df["Name"].astype(str).str.strip()

            # Record audit metrics
            duplicate_count = int(df.duplicated(subset=["Student_ID"]).sum())
            null_counts = {col: int(df[col].isnull().sum()) for col in df.columns}

            file_audits[key] = {
                "filename": resolved_path.name,
                "purpose": self.FILE_DESCRIPTIONS.get(key, "Student indicator dataset"),
                "record_count": len(df),
                "column_count": len(df.columns),
                "columns": list(df.columns),
                "missing_value_counts": null_counts,
                "duplicate_record_count": duplicate_count,
                "unique_student_ids": int(df["Student_ID"].nunique()),
                "id_format_valid": bool(df["Student_ID"].str.match(r"^STU\d+$").all()),
                "status": "VALIDATED"
            }

            dfs[key] = df

        return dfs, file_audits
