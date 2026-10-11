import time
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Header, Request, Response, status
from app.core.config import settings
from app.core.security import create_access_token, decode_access_token, verify_password
from app.core.auth_seed import dev_seed_store
from app.core.state import app_state
from app.schemas.auth import LoginRequest, LoginResponse, UserProfile

router = APIRouter(prefix="/auth", tags=["Authentication"])

from app.core.dependencies import get_current_user_payload, get_token_from_request

@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest, response: Response):
    identifier = req.identifier.strip()
    password = req.password.strip()

    if not identifier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Identifier (ID, username, or email) is required."
        )
    if not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is required to authenticate. Identification alone is not accepted."
        )

    # ---------------------------------------------------------
    # 1. Check Development-Only Test Accounts (If Dev Mode Active)
    # ---------------------------------------------------------
    dev_account = dev_seed_store.find_account(identifier, req.portal)
    if dev_account:
        # Verify role matches portal
        if dev_account.portal != req.portal:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Portal mismatch: Selected portal '{req.portal}' does not match account role '{dev_account.role}'."
            )

        # Validate password against PBKDF2 hash
        if not verify_password(password, dev_account.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication failed: Invalid identifier or password."
            )

        # Create session token
        token = create_access_token({
            "sub": dev_account.user_id,
            "username": dev_account.username,
            "name": dev_account.name,
            "role": dev_account.role,
            "portal": dev_account.portal,
            "department": dev_account.department,
            "is_dev": True
        })

        # Set secure HTTP-only cookie
        response.set_cookie(
            key="thrive360_access_token",
            value=token,
            httponly=True,
            secure=settings.COOKIE_SECURE,
            samesite=settings.COOKIE_SAMESITE,
            max_age=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )

        return LoginResponse(
            success=True,
            access_token=token,
            token_type="bearer",
            portal=dev_account.portal,
            user_id=dev_account.user_id,
            username=dev_account.username,
            name=dev_account.name,
            role=dev_account.role,
            message="Authentication successful."
        )

    # Check if this identifier matches a dev account in the OTHER portal
    other_portal = "student" if req.portal == "faculty" else "faculty"
    other_dev_account = dev_seed_store.find_account(identifier, other_portal)
    if other_dev_account:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: Selected portal '{req.portal}' does not match account role '{other_dev_account.role}'."
        )

    # ---------------------------------------------------------
    # 2. Production / Non-Test Directory Records
    # ---------------------------------------------------------
    if req.portal == "faculty":
        all_faculty = app_state.faculty_service.get_all()
        target = identifier.lower()
        matched_faculty = None

        for f in all_faculty:
            if (f.faculty_id.lower() == target or 
                f.account.username.lower() == target or 
                f.account.email.lower() == target):
                matched_faculty = f
                break

        if not matched_faculty:
            # Check if user accidentally entered a student ID in faculty portal
            all_students = app_state.students
            if any(s["student_id"].lower() == target for s in all_students):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: Student credentials cannot be used to authenticate into Faculty Portal."
                )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication failed: Invalid identifier or password."
            )

        # Faculty account exists but password has not been provisioned
        if matched_faculty.account.password_hash is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Account setup pending for {matched_faculty.faculty_name} ({matched_faculty.faculty_id}). "
                    "Password provisioning has not been completed. Please contact campus system administration."
                )
            )

        # Verify password if hash exists
        if not verify_password(password, matched_faculty.account.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication failed: Invalid identifier or password."
            )

        token = create_access_token({
            "sub": matched_faculty.faculty_id,
            "username": matched_faculty.account.username,
            "name": matched_faculty.faculty_name,
            "role": matched_faculty.account.role,
            "portal": "faculty",
            "department": matched_faculty.department
        })

        response.set_cookie(
            key="thrive360_access_token",
            value=token,
            httponly=True,
            secure=settings.COOKIE_SECURE,
            samesite=settings.COOKIE_SAMESITE,
            max_age=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )

        return LoginResponse(
            success=True,
            access_token=token,
            token_type="bearer",
            portal="faculty",
            user_id=matched_faculty.faculty_id,
            username=matched_faculty.account.username,
            name=matched_faculty.faculty_name,
            role=matched_faculty.account.role,
            message="Faculty authentication successful."
        )

    elif req.portal == "student":
        all_students = app_state.students
        target = identifier.upper()
        matched_student = None

        for s in all_students:
            if s["student_id"].upper() == target or s["name"].lower() == identifier.lower():
                matched_student = s
                break

        if not matched_student:
            # Check if user accidentally entered a faculty ID in student portal
            all_faculty = app_state.faculty_service.get_all()
            if any(f.faculty_id.upper() == target for f in all_faculty):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: Faculty credentials cannot be used to authenticate into Student Portal."
                )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication failed: Invalid identifier or password."
            )

        # Student accounts require password provisioning in future phases
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"Student portal authentication requires account activation. "
                f"Password provisioning has not been completed for {matched_student['name']} ({matched_student['student_id']}). "
                "Please contact campus IT services to activate your account."
            )
        )

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid portal '{req.portal}'. Allowed portals: 'student', 'faculty'."
        )

@router.get("/me", response_model=UserProfile)
def get_current_user(payload: Dict[str, Any] = Depends(get_current_user_payload)):
    """
    Retrieve current authenticated user session details.
    """
    return UserProfile(
        user_id=payload.get("sub", ""),
        username=payload.get("username", ""),
        name=payload.get("name", ""),
        role=payload.get("role", "USER"),
        portal=payload.get("portal", ""),
        department=payload.get("department", "")
    )

@router.get("/dev-accounts")
def get_dev_test_accounts():
    """
    Retrieve safe metadata about development test accounts.
    Disabled in non-development environments.
    """
    if not settings.DEV_ACCOUNTS_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Development test accounts are disabled in this environment."
        )
    return {
        "enabled": True,
        "environment": settings.ENVIRONMENT,
        "accounts": dev_seed_store.list_dev_accounts(),
        "instruction": "Credentials are for local development and integration testing only."
    }

@router.post("/logout")
def logout(response: Response):
    """
    Clear session cookies and terminate authentication session.
    """
    response.delete_cookie(
        key="thrive360_access_token",
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE
    )
    return {"success": True, "message": "Successfully logged out."}
