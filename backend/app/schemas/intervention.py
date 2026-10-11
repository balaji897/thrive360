from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field

class InterventionBase(BaseModel):
    student_id: str
    student_name: str
    category: str  # "Academic", "Placement", "Attendance", "Engagement", "Personal/Mentoring"
    title: str
    description: str
    priority: str  # "High", "Medium", "Low"
    assigned_faculty: str
    status: str = "Pending"  # "Pending", "In Progress", "Completed", "Cancelled"
    due_date: str
    action_items: List[str] = []
    notes: Optional[str] = ""

class InterventionCreate(InterventionBase):
    pass

class InterventionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    assigned_faculty: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[str] = None
    action_items: Optional[List[str]] = None
    notes: Optional[str] = None
    outcome: Optional[str] = None

class Intervention(InterventionBase):
    id: str
    created_at: str
    updated_at: str
    outcome: Optional[str] = None
