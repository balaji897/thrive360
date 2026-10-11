import hashlib
import hmac
import os
import secrets
import time
from typing import Optional, Dict, Any
import jwt
from app.core.config import settings

def hash_password(password: str, salt: Optional[bytes] = None, iterations: int = 100_000) -> str:
    """
    Secure password hashing using PBKDF2-HMAC-SHA256 with 100,000 iterations and a 16-byte cryptographic salt.
    Format: pbkdf2_sha256$iterations$salt_hex$hash_hex
    """
    if salt is None:
        salt = secrets.token_bytes(16)
    pwd_bytes = password.encode("utf-8")
    derived = hashlib.pbkdf2_hmac("sha256", pwd_bytes, salt, iterations)
    return f"pbkdf2_sha256${iterations}${salt.hex()}${derived.hex()}"

def verify_password(plain_password: str, hashed_password: Optional[str]) -> bool:
    """
    Constant-time password verification against PBKDF2-HMAC-SHA256 hashes.
    """
    if not plain_password or not hashed_password:
        return False
    try:
        parts = hashed_password.split("$")
        if len(parts) != 4 or parts[0] != "pbkdf2_sha256":
            return False
        iterations = int(parts[1])
        salt = bytes.fromhex(parts[2])
        expected_hash = parts[3]
        
        computed = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, iterations).hex()
        return hmac.compare_digest(computed, expected_hash)
    except Exception:
        return False

def create_access_token(payload: Dict[str, Any], expires_delta_seconds: Optional[int] = None) -> str:
    """
    Generate signed JWT bearer token.
    """
    token_data = payload.copy()
    now = time.time()
    exp_seconds = expires_delta_seconds or (settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    token_data["iat"] = now
    token_data["exp"] = now + exp_seconds
    return jwt.encode(token_data, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Validate and decode JWT bearer token.
    """
    return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
