import json
import os
import re
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional
import pandas as pd
from app.core.config import settings
from app.schemas.faculty import FacultyMember, FacultyAccount, FacultyStats, FacultyListResponse

class FacultyService:
    def __init__(self, raw_file: Optional[Path] = None, processed_file: Optional[Path] = None):
        self.raw_file = raw_file or (settings.RAW_DATA_DIR / "faculty_list_50.csv")
        self.workspace_file = settings.WORKSPACE_RAW_DIR / "faculty_list_50.csv"
        self.processed_file = processed_file or (settings.PROCESSED_DATA_DIR / "faculty_50.json")
        self.faculty_cache: List[FacultyMember] = []

    def _resolve_file_path(self) -> Path:
        if self.raw_file.exists():
            return self.raw_file
        if self.workspace_file.exists():
            return self.workspace_file
        raise FileNotFoundError(f"faculty_list_50.csv not found in {self.raw_file} or {self.workspace_file}")

    def _generate_username(self, name: str) -> str:
        clean = re.sub(r'^(dr\.|prof\.)\s*', '', name, flags=re.IGNORECASE)
        parts = [p.strip().lower() for p in clean.split() if p.strip()]
        if not parts:
            return "faculty"
        if len(parts) == 1:
            return parts[0]
        return f"{parts[0]}.{parts[-1]}"

    def load_and_persist(self) -> List[FacultyMember]:
        file_path = self._resolve_file_path()
        df = pd.read_csv(file_path)

        # Normalize column names
        df.columns = [c.strip() for c in df.columns]

        required_cols = {"Faculty_ID", "Faculty_Name", "Subject", "Qualification", "Designation"}
        missing = required_cols - set(df.columns)
        if missing:
            raise ValueError(f"faculty_list_50.csv missing required columns: {missing}")

        # Validate unique Faculty_IDs
        df["Faculty_ID"] = df["Faculty_ID"].astype(str).str.strip().str.upper()
        if df["Faculty_ID"].duplicated().any():
            duplicates = df[df["Faculty_ID"].duplicated()]["Faculty_ID"].tolist()
            raise ValueError(f"Duplicate Faculty_IDs detected in CSV: {duplicates}")

        now_str = datetime.now().isoformat()
        loaded_members: List[FacultyMember] = []

        for _, row in df.iterrows():
            fid = str(row["Faculty_ID"]).strip().upper()
            fname = str(row["Faculty_Name"]).strip()
            subject = str(row["Subject"]).strip()
            qual = str(row["Qualification"]).strip()
            desig = str(row["Designation"]).strip()

            has_phd = "ph.d" in qual.lower() or "phd" in qual.lower() or fname.lower().startswith("dr.")

            # Department assignment based on academic discipline
            if subject.lower() == "maths":
                dept = "Mathematics"
            elif subject.lower() == "physics":
                dept = "Physical Sciences"
            else:
                dept = "Computer Science & Engineering"

            # Role: Full Professors have administrative role ("ADMIN"), others "FACULTY"
            role = "ADMIN" if desig.lower() == "professor" else "FACULTY"

            # Account status: Professors and Associate Professors are ACTIVE, Assistant Professors are PENDING_SETUP
            account_status = "ACTIVE" if "associate" in desig.lower() or "professor" == desig.lower() else "PENDING_SETUP"

            username = self._generate_username(fname)
            email = f"{username}@campus.edu"

            account = FacultyAccount(
                account_id=f"ACC-{fid}",
                faculty_id=fid,
                username=username,
                email=email,
                role=role,
                account_status=account_status,
                password_hash=None,  # Explicitly None per security constraints
                last_login=None,
                created_at=now_str
            )

            member = FacultyMember(
                faculty_id=fid,
                faculty_name=fname,
                subject=subject,
                qualification=qual,
                designation=desig,
                has_phd=has_phd,
                department=dept,
                assigned_interventions_count=0,
                account=account
            )
            loaded_members.append(member)

        self.faculty_cache = loaded_members

        # Persist to processed directory
        self.processed_file.parent.mkdir(parents=True, exist_ok=True)
        with open(self.processed_file, "w", encoding="utf-8") as f:
            json.dump([m.model_dump() for m in loaded_members], f, indent=2)

        return self.faculty_cache

    def get_all(self) -> List[FacultyMember]:
        if not self.faculty_cache:
            if self.processed_file.exists():
                with open(self.processed_file, "r", encoding="utf-8") as f:
                    raw = json.load(f)
                    self.faculty_cache = [FacultyMember(**r) for r in raw]
            else:
                self.load_and_persist()
        return self.faculty_cache

    def list_faculty(
        self,
        search: Optional[str] = None,
        subject: Optional[str] = None,
        designation: Optional[str] = None,
        role: Optional[str] = None,
        account_status: Optional[str] = None,
        page: int = 1,
        page_size: int = 15
    ) -> FacultyListResponse:
        all_faculty = self.get_all()
        filtered = []

        q = search.strip().lower() if search else None

        for f in all_faculty:
            if q:
                if not (q in f.faculty_id.lower() or q in f.faculty_name.lower() or q in f.subject.lower()):
                    continue
            if subject and f.subject.lower() != subject.strip().lower():
                continue
            if designation and f.designation.lower() != designation.strip().lower():
                continue
            if role and f.account.role.lower() != role.strip().lower():
                continue
            if account_status and f.account.account_status.lower() != account_status.strip().lower():
                continue
            filtered.append(f)

        total = len(filtered)
        total_pages = (total + page_size - 1) // page_size if total > 0 else 1
        start = (page - 1) * page_size
        end = start + page_size

        return FacultyListResponse(
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            faculty=filtered[start:end]
        )

    def get_by_id(self, faculty_id: str) -> Optional[FacultyMember]:
        all_faculty = self.get_all()
        target = faculty_id.strip().upper()
        for f in all_faculty:
            if f.faculty_id.upper() == target:
                return f
        return None

    def get_stats(self) -> FacultyStats:
        all_faculty = self.get_all()
        total = len(all_faculty)

        profs = sum(1 for f in all_faculty if f.designation == "Professor")
        assoc_profs = sum(1 for f in all_faculty if f.designation == "Associate Professor")
        asst_profs = sum(1 for f in all_faculty if f.designation == "Assistant Professor")
        phds = sum(1 for f in all_faculty if f.has_phd)

        subj_dist: Dict[str, int] = {}
        role_dist: Dict[str, int] = {}
        status_dist: Dict[str, int] = {}

        for f in all_faculty:
            subj_dist[f.subject] = subj_dist.get(f.subject, 0) + 1
            role_dist[f.account.role] = role_dist.get(f.account.role, 0) + 1
            status_dist[f.account.account_status] = status_dist.get(f.account.account_status, 0) + 1

        return FacultyStats(
            total_faculty=total,
            professors=profs,
            associate_professors=assoc_profs,
            assistant_professors=asst_profs,
            phd_holders=phds,
            subject_distribution=subj_dist,
            role_distribution=role_dist,
            status_distribution=status_dist
        )
