import json
import urllib.request
import urllib.error
import tempfile
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.services.faculty_service import FacultyService

BASE_URL = "http://127.0.0.1:8000/api/v1"

def test_api(url):
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as resp:
        return resp.status, json.loads(resp.read().decode('utf-8'))

def run_verifications():
    results = {}
    failures = []

    print("--- 1. Testing GET /api/v1/faculty ---")
    status, data = test_api(f"{BASE_URL}/faculty?page=1&page_size=100")
    total_records = data.get("total")
    faculty_list = data.get("faculty", [])
    
    results["get_faculty_status"] = status
    results["actual_record_count"] = len(faculty_list)
    results["total_reported"] = total_records

    if len(faculty_list) != 50 or total_records != 50:
        failures.append(f"Expected 50 records, got total={total_records}, returned={len(faculty_list)}")

    # Check required fields
    required_fields = ["faculty_id", "faculty_name", "subject", "qualification", "designation"]
    missing_fields_per_rec = []
    faculty_ids = []
    account_security_violations = []

    for f in faculty_list:
        fid = f.get("faculty_id")
        faculty_ids.append(fid)
        for req in required_fields:
            if not f.get(req):
                missing_fields_per_rec.append(f"{fid} missing {req}")
        
        # Check account
        acc = f.get("account", {})
        if not acc.get("account_id") or not acc.get("role") or not acc.get("account_status"):
            missing_fields_per_rec.append(f"{fid} missing account structure")
        if acc.get("password_hash") is not None:
            account_security_violations.append(f"{fid} has non-null password_hash: {acc.get('password_hash')}")

    results["missing_required_fields_count"] = len(missing_fields_per_rec)
    results["account_security_violations_count"] = len(account_security_violations)
    if missing_fields_per_rec:
        failures.append(f"Missing required fields: {missing_fields_per_rec[:3]}")
    if account_security_violations:
        failures.append(f"Security violations: {account_security_violations[:3]}")

    # Check unique Faculty_ID values
    unique_ids = set(faculty_ids)
    results["unique_faculty_id_count"] = len(unique_ids)
    if len(unique_ids) != 50:
        failures.append(f"Faculty_IDs not unique: found {len(unique_ids)} unique out of {len(faculty_ids)}")

    print(f"Record Count: {len(faculty_list)}/50 | Unique IDs: {len(unique_ids)}/50")

    print("\n--- 2. Testing Duplicate-Import Behavior ---")
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_csv = Path(tmpdir) / "dup_faculty.csv"
        tmp_json = Path(tmpdir) / "dup_faculty.json"
        
        # Create CSV with duplicate ID
        dup_data = """Faculty_ID,Faculty_Name,Subject,Qualification,Designation
FAC01,Venkat Reddy,Maths,M.Sc Mathematics,Assistant Professor
FAC01,Duplicate Person,Maths,M.Sc Mathematics,Assistant Professor
FAC02,Dr. Ravi Teja,Maths,"M.Sc Mathematics, Ph.D",Associate Professor
"""
        tmp_csv.write_text(dup_data, encoding="utf-8")
        
        svc = FacultyService(raw_file=tmp_csv, processed_file=tmp_json)
        try:
            svc.load_and_persist()
            failures.append("Duplicate Faculty_ID import did not raise ValueError!")
            results["duplicate_handling"] = "FAILED: Did not detect duplicate"
        except ValueError as e:
            results["duplicate_handling"] = f"PASSED: Correctly caught duplicate with ValueError: {str(e)}"
            print("Duplicate detection verified:", str(e))

    print("\n--- 3. Testing Existing Student APIs & Dashboard ---")
    student_endpoints = [
        ("dashboard_summary", f"{BASE_URL}/dashboard/summary"),
        ("students_list", f"{BASE_URL}/students?page=1&page_size=5"),
        ("student_detail", f"{BASE_URL}/students/STU001"),
        ("analytics_segments", f"{BASE_URL}/analytics/segments"),
        ("analytics_risks", f"{BASE_URL}/analytics/risks"),
        ("analytics_ml", f"{BASE_URL}/analytics/ml-model"),
        ("interventions", f"{BASE_URL}/interventions"),
        ("data_quality", f"{BASE_URL}/data-quality"),
    ]

    for name, ep in student_endpoints:
        try:
            s, d = test_api(ep)
            if s == 200:
                results[name] = "200 OK"
                if name == "dashboard_summary":
                    st_count = d.get("total_students")
                    if st_count != 250:
                        failures.append(f"Dashboard total_students changed: {st_count} (expected 250)")
                if name == "students_list":
                    total_stu = d.get("total")
                    if total_stu != 250:
                        failures.append(f"Students list total changed: {total_stu} (expected 250)")
            else:
                failures.append(f"{name} returned HTTP {s}")
                results[name] = f"HTTP {s}"
        except Exception as err:
            failures.append(f"{name} failed with error: {str(err)}")
            results[name] = f"ERROR: {str(err)}"

    print("\n--- Verification Summary ---")
    print("Results:", json.dumps(results, indent=2))
    print("Failures:", failures)
    return len(failures) == 0, results, failures

if __name__ == "__main__":
    ok, res, fails = run_verifications()
    exit(0 if ok else 1)
