from typing import List, Optional, Dict
from pydantic import BaseModel, Field

class FacultyAccount(BaseModel):
    account_id: str
    faculty_id: str
    username: str
    email: str
    role: str  # "ADMIN" | "FACULTY"
    account_status: str  # "ACTIVE" | "PENDING_SETUP" | "INACTIVE"
    password_hash: Optional[str] = None  # None: Credentials provisioning deferred
    last_login: Optional[str] = None
    created_at: str

class FacultyMember(BaseModel):
    faculty_id: str
    faculty_name: str
    subject: str
    qualification: str
    designation: str
    has_phd: bool
    department: str
    assigned_interventions_count: int = 0
    account: FacultyAccount

class FacultyListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    faculty: List[FacultyMember]

class FacultyStats(BaseModel):
    total_faculty: int
    professors: int
    associate_professors: int
    assistant_professors: int
    phd_holders: int
    subject_distribution: Dict[str, int]
    role_distribution: Dict[str, int]
    status_distribution: Dict[str, int]
