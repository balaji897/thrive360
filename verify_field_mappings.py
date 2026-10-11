import json
import pandas as pd

raw_files = {
    "students": "backend/data/raw/students_250_cleaned.csv",
    "lms": "backend/data/raw/students_lms_250.csv",
    "activities": "backend/data/raw/students_activities_250.csv",
    "placement": "backend/data/raw/students_placement_readiness_250.csv",
    "skills": "backend/data/raw/students_skill_assessments_250.csv",
    "feedback": "backend/data/raw/students_feedback_250.csv"
}

with open("backend/data/processed/integrated_students_250.json", "r", encoding="utf-8") as f:
    integrated = json.load(f)

first_student = integrated[0]

# Flatten integrated fields
def flatten_dict(d, parent_key='', sep='.'):
    items = []
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key, sep=sep).items())
        else:
            items.append((new_key, v))
    return dict(items)

flat_student = flatten_dict(first_student)

field_mapping_report = {}

for name, path in raw_files.items():
    df = pd.read_csv(path)
    field_mapping_report[name] = {
        "raw_columns": list(df.columns),
        "present_in_integrated": []
    }

print("Flat student keys:")
for k in sorted(flat_student.keys()):
    print(f"  {k}: {flat_student[k]}")
