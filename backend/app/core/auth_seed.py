import os
from typing import Dict, Any, Optional, List
from app.core.config import settings
from app.core.security import hash_password

class DevAccountRecord:
    def __init__(
        self,
        user_id: str,
        portal: str,
        role: str,
        name: str,
        username: str,
        email: str,
        password_hash: str,
        department: str
    ):
        self.user_id = user_id
        self.portal = portal
        self.role = role
        self.name = name
        self.username = username
        self.email = email
        self.password_hash = password_hash
        self.department = department
        self.is_dev_account = True

class DevSeedStore:
    """
    Development-only credential seed store.
    Contains exactly 3 student test accounts and 2 faculty test accounts linked to existing real records.
    Disabled when settings.DEV_ACCOUNTS_ENABLED is False (e.g. in production).
    """
    def __init__(self):
        self._accounts: Dict[str, DevAccountRecord] = {}
        self._initialized = False

    def initialize(self):
        if self._initialized:
            return

        # Fixed development-only passwords (can be overridden via environment variables)
        student_pwd = os.getenv("DEV_STUDENT_PASSWORD", "CampusStudent2026!")
        faculty_pwd = os.getenv("DEV_FACULTY_PASSWORD", "CampusFaculty2026!")
        admin_pwd = os.getenv("DEV_ADMIN_PASSWORD", "CampusAdmin2026!")

        # Exactly 3 Development-Only Student Accounts (linked to real students STU001, STU002, STU003)
        student_seed_data = [
            {
                "user_id": "STU001",
                "portal": "student",
                "role": "STUDENT",
                "name": "Aarav Sharma",
                "username": "aarav.sharma",
                "email": "aarav.sharma@student.campus.edu",
                "password": student_pwd,
                "department": "Computer Science & Engineering"
            },
            {
                "user_id": "STU002",
                "portal": "student",
                "role": "STUDENT",
                "name": "Priya Patel",
                "username": "priya.patel",
                "email": "priya.patel@student.campus.edu",
                "password": student_pwd,
                "department": "Electronics & Communication Engineering"
            },
            {
                "user_id": "STU003",
                "portal": "student",
                "role": "STUDENT",
                "name": "Rohan Verma",
                "username": "rohan.verma",
                "email": "rohan.verma@student.campus.edu",
                "password": student_pwd,
                "department": "Mechanical Engineering"
            }
        ]

        # Exactly 2 Development-Only Faculty Accounts (linked to real faculty FAC01, FAC21)
        faculty_seed_data = [
            {
                "user_id": "FAC01",
                "portal": "faculty",
                "role": "FACULTY",
                "name": "Venkat Reddy",
                "username": "venkat.reddy",
                "email": "venkat.reddy@campus.edu",
                "password": faculty_pwd,
                "department": "Mathematics"
            },
            {
                "user_id": "FAC21",
                "portal": "faculty",
                "role": "ADMIN",
                "name": "Dr. Bhavani Shankar",
                "username": "bhavani.shankar",
                "email": "bhavani.shankar@campus.edu",
                "password": admin_pwd,
                "department": "Computer Science & Engineering"
            }
        ]

        # Securely hash passwords with PBKDF2-HMAC-SHA256
        for item in student_seed_data:
            hashed = hash_password(item["password"])
            rec = DevAccountRecord(
                user_id=item["user_id"],
                portal=item["portal"],
                role=item["role"],
                name=item["name"],
                username=item["username"],
                email=item["email"],
                password_hash=hashed,
                department=item["department"]
            )
            self._accounts[rec.user_id.upper()] = rec
            self._accounts[rec.username.lower()] = rec
            self._accounts[rec.email.lower()] = rec

        for item in faculty_seed_data:
            hashed = hash_password(item["password"])
            rec = DevAccountRecord(
                user_id=item["user_id"],
                portal=item["portal"],
                role=item["role"],
                name=item["name"],
                username=item["username"],
                email=item["email"],
                password_hash=hashed,
                department=item["department"]
            )
            self._accounts[rec.user_id.upper()] = rec
            self._accounts[rec.username.lower()] = rec
            self._accounts[rec.email.lower()] = rec

        self._initialized = True

    def find_account(self, identifier: str, portal: str) -> Optional[DevAccountRecord]:
        """
        Look up a development test account by user_id, username, or email.
        Returns None if dev accounts are disabled or account is not found.
        """
        if not settings.DEV_ACCOUNTS_ENABLED:
            return None

        if not self._initialized:
            self.initialize()

        clean_id = identifier.strip()
        account = self._accounts.get(clean_id.upper()) or self._accounts.get(clean_id.lower())
        if account and account.portal == portal:
            return account
        return None

    def list_dev_accounts(self) -> List[Dict[str, Any]]:
        """
        Return safe metadata about development accounts (without hashes or passwords).
        """
        if not settings.DEV_ACCOUNTS_ENABLED:
            return []
        if not self._initialized:
            self.initialize()
            
        unique: Dict[str, Dict[str, Any]] = {}
        for acc in self._accounts.values():
            if acc.user_id not in unique:
                unique[acc.user_id] = {
                    "user_id": acc.user_id,
                    "portal": acc.portal,
                    "role": acc.role,
                    "name": acc.name,
                    "username": acc.username,
                    "email": acc.email,
                    "department": acc.department,
                    "is_dev_test_account": True
                }
        return list(unique.values())

dev_seed_store = DevSeedStore()
