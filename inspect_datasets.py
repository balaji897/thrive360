import os
import pandas as pd
import json

base_dir = r"c:\Users\addan\OneDrive\Desktop\thrive360"
files = {
    "students": "students_250_cleaned (1).csv",
    "lms": "students_lms_250.csv",
    "activities": "students_activities_250.csv",
    "placement": "students_placement_readiness_250.csv",
    "skills": "students_skill_assessments_250.csv",
    "feedback": "students_feedback_250.csv"
}

dfs = {}
report = {}

for key, fname in files.items():
    fpath = os.path.join(base_dir, fname)
    if os.path.exists(fpath):
        df = pd.read_csv(fpath)
        dfs[key] = df
        report[key] = {
            "file": fname,
            "rows": len(df),
            "columns": list(df.columns),
            "missing_values": df.isnull().sum().to_dict(),
            "unique_students": df['Student_ID'].nunique() if 'Student_ID' in df.columns else 0,
            "sample": df.head(2).to_dict(orient="records")
        }
    else:
        report[key] = {"error": f"File not found: {fname}"}

# Check student ID matching across datasets
if all(k in dfs for k in files.keys()):
    base_ids = set(dfs["students"]["Student_ID"])
    report["id_matching"] = {}
    for k, df in dfs.items():
        if k == "students":
            continue
        ids = set(df["Student_ID"])
        report["id_matching"][k] = {
            "matches_base": len(base_ids.intersection(ids)),
            "missing_in_other": list(base_ids - ids),
            "extra_in_other": list(ids - base_ids)
        }

with open("scratch_inspection.json", "w") as f:
    json.dump(report, f, indent=2)

print("Inspection completed. Summary:")
for k, v in report.items():
    if k != "id_matching":
        print(f"[{k}] Rows: {v.get('rows')}, Cols: {len(v.get('columns', []))}, Unique STU: {v.get('unique_students')}")
    else:
        print("[id_matching]:", v)
