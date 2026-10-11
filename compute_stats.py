import pandas as pd
import json

files = {
    "students": "students_250_cleaned (1).csv",
    "lms": "students_lms_250.csv",
    "activities": "students_activities_250.csv",
    "placement": "students_placement_readiness_250.csv",
    "skills": "students_skill_assessments_250.csv",
    "feedback": "students_feedback_250.csv"
}

dfs = {k: pd.read_csv(v) for k, v in files.items()}

stats = {}
for k, df in dfs.items():
    stats[k] = {}
    num_cols = df.select_dtypes(include=['float64', 'int64']).columns
    for col in num_cols:
        stats[k][col] = {
            "min": float(df[col].min()),
            "max": float(df[col].max()),
            "mean": round(float(df[col].mean()), 2),
            "median": round(float(df[col].median()), 2)
        }

with open("scratch_stats.json", "w") as f:
    json.dump(stats, f, indent=2)

print("Stats extracted successfully.")
