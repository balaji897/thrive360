import requests
import json

base_url = "http://127.0.0.1:8000/api/v1"

endpoints = [
    ("/health", "GET", None),
    ("/dashboard/summary", "GET", None),
    ("/students?page=1&page_size=5", "GET", None),
    ("/students/STU001", "GET", None),
    ("/students/STU003", "GET", None),
    ("/analytics/segments", "GET", None),
    ("/analytics/risks", "GET", None),
    ("/analytics/ml-model", "GET", None),
    ("/data-quality", "GET", None),
    ("/interventions", "GET", None),
    ("/config/scoring-weights", "GET", None)
]

print("=== AUDITING BACKEND REST ENDPOINTS ===")

results = {}

for ep, method, payload in endpoints:
    url = f"{base_url}{ep}"
    try:
        if method == "GET":
            res = requests.get(url, timeout=5)
        else:
            res = requests.post(url, json=payload, timeout=5)
        
        status = res.status_code
        data = res.json()
        
        # Check if actual integrated data is present
        sample_check = "OK"
        if ep == "/health":
            sample_check = f"Students loaded: {data.get('students_loaded')}"
        elif ep == "/dashboard/summary":
            sample_check = f"Total: {data.get('total_students')}, Avg Score: {data.get('average_success_score')}"
        elif "/students?page" in ep:
            sample_check = f"Total: {data.get('total')}, Page count: {len(data.get('students', []))}"
        elif "/students/STU001" in ep:
            sample_check = f"Name: {data.get('name')}, CGPA: {data.get('academics', {}).get('cgpa')}, Score: {data.get('success_score')}"
        elif "/analytics/segments" in ep:
            sample_check = f"Segments count: {len(data)}, First: {data[0].get('name')}"
        elif "/data-quality" in ep:
            sample_check = f"Files: {data.get('total_source_files')}, Match: {data.get('id_match_rate_percentage')}%"

        results[ep] = {
            "status": status,
            "sample_check": sample_check
        }
        print(f"[{status}] {ep} -> {sample_check}")
    except Exception as e:
        results[ep] = {"error": str(e)}
        print(f"[FAIL] {ep} -> {e}")

with open("api_audit_summary.json", "w") as f:
    json.dump(results, f, indent=2)
