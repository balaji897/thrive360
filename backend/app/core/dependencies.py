from typing import Optional, Dict, Any
from fastapi import Request, Header, HTTPException, Depends, status
from app.core.security import decode_access_token

def get_token_from_request(
    request: Request,
    authorization: Optional[str] = Header(None)
) -> str:
    """
    Extract JWT token from Authorization header (Bearer) or HTTP-only cookie.
    Raises 401 if missing.
    """
    if authorization and authorization.startswith("Bearer "):
        return authorization.split(" ", 1)[1].strip()
    
    cookie_token = request.cookies.get("thrive360_access_token")
    if cookie_token:
        return cookie_token
        
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required. Please log in to access this resource."
    )

def get_optional_token(
    request: Request,
    authorization: Optional[str] = Header(None)
) -> Optional[str]:
    """
    Extract token if present, otherwise return None without raising error.
    """
    if authorization and authorization.startswith("Bearer "):
        return authorization.split(" ", 1)[1].strip()
    
    cookie_token = request.cookies.get("thrive360_access_token")
    if cookie_token:
        return cookie_token
        
    return None

def get_current_user_payload(token: str = Depends(get_token_from_request)) -> Dict[str, Any]:
    """
    Strictly verify and decode the active session token.
    """
    try:
        payload = decode_access_token(token)
        return payload
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Session invalid or expired. Please log in again."
        )

def get_optional_user_payload(token: Optional[str] = Depends(get_optional_token)) -> Optional[Dict[str, Any]]:
    """
    Optionally decode user token. If token is invalid or expired, raises 401.
    If no token is supplied, returns None (allowing public/unauthenticated requests where permitted).
    """
    if not token:
        return None
    try:
        return decode_access_token(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session invalid or expired. Please log in again."
        )

def require_student_user(payload: Dict[str, Any] = Depends(get_current_user_payload)) -> Dict[str, Any]:
    """
    Ensure the authenticated user has the STUDENT role.
    """
    if payload.get("role") != "STUDENT":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Protected student dashboard requires a valid Student account."
        )
    return payload

def require_faculty_user(payload: Dict[str, Any] = Depends(get_current_user_payload)) -> Dict[str, Any]:
    """
    Ensure the authenticated user has FACULTY or ADMIN role.
    """
    role = payload.get("role")
    if role not in ["FACULTY", "ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Protected faculty dashboard requires Faculty or Administrator credentials."
        )
    return payload

def require_admin_user(payload: Dict[str, Any] = Depends(get_current_user_payload)) -> Dict[str, Any]:
    """
    Ensure the authenticated user has administrative privileges.
    """
    if payload.get("role") != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Administrative privileges required."
        )
    return payload
