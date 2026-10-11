import os
import pandas as pd
import json

base_dir = r"c:\Users\addan\OneDrive\Desktop\thrive360\backend\data\raw"

files = {
    "students": "students_250_cleaned.csv",
    "lms": "students_lms_250.csv",
    "activities": "students_activities_250.csv",
    "placement": "students_placement_readiness_250.csv",
    "skills": "students_skill_assessments_250.csv",
    "feedback": "students_feedback_250.csv"
}

audit = {}

for key, fname in files.items():
    fpath = os.path.join(base_dir, fname)
    if not os.path.exists(fpath):
        audit[key] = {"error": f"FILE NOT FOUND: {fpath}"}
        continue
    
    df = pd.read_csv(fpath)
    audit[key] = {
        "filename": fname,
        "rows": len(df),
        "columns": list(df.columns),
        "col_count": len(df.columns),
        "unique_students": int(df['Student_ID'].nunique()) if 'Student_ID' in df.columns else 0,
        "duplicates": int(df.duplicated(subset=['Student_ID']).sum()) if 'Student_ID' in df.columns else 0,
        "missing_values": {k: int(v) for k, v in df.isnull().sum().items() if v > 0},
        "all_null_counts": {k: int(v) for k, v in df.isnull().sum().items()},
        "dtypes": {k: str(v) for k, v in df.dtypes.items()}
    }

# Check Join Coverage
dfs = {k: pd.read_csv(os.path.join(base_dir, v)) for k, v in files.items()}
base_ids = set(dfs['students']['Student_ID'].str.strip().str.upper())
join_audit = {}
for k, df in dfs.items():
    if k == 'students':
        continue
    curr_ids = set(df['Student_ID'].str.strip().str.upper())
    join_audit[k] = {
        "matches_students_base": len(base_ids.intersection(curr_ids)),
        "missing_from_file": list(base_ids - curr_ids),
        "extra_in_file": list(curr_ids - base_ids)
    }

audit["join_coverage"] = join_audit

# Check field mapping against integrated dataset
integrated_path = r"c:\Users\addan\OneDrive\Desktop\thrive360\backend\data\processed\integrated_students_250.json"
with open(integrated_path, "r", encoding="utf-8") as f:
    integrated = json.load(f)

audit["integrated_count"] = len(integrated)
sample = integrated[0]
audit["sample_keys"] = list(sample.keys())

with open("audit_datasets_result.json", "w", encoding="utf-8") as f:
    json.dump(audit, f, indent=2)

print("DATASET AUDIT COMPLETE.")
