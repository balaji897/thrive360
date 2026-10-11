from pydantic import BaseModel, Field
from typing import Optional, Literal

class LoginRequest(BaseModel):
    portal: Literal["student", "faculty"] = Field(..., description="Target authentication portal: 'student' or 'faculty'")
    identifier: str = Field(..., min_length=2, description="Student ID, Faculty ID, Username, or Institutional Email")
    password: str = Field(..., min_length=1, description="Account password")

class LoginResponse(BaseModel):
    success: bool
    access_token: Optional[str] = None
    token_type: str = "bearer"
    portal: str
    user_id: str
    username: str
    name: str
    role: str
    message: str

class UserProfile(BaseModel):
    user_id: str
    username: str
    name: str
    role: str
    portal: str
    email: Optional[str] = None
    department: Optional[str] = None
