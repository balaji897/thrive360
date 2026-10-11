import os
import shutil

src_dir = r"c:\Users\addan\OneDrive\Desktop\thrive360"
raw_dir = os.path.join(src_dir, "backend", "data", "raw")
processed_dir = os.path.join(src_dir, "backend", "data", "processed")
docs_dir = os.path.join(src_dir, "docs")

os.makedirs(raw_dir, exist_ok=True)
os.makedirs(processed_dir, exist_ok=True)
os.makedirs(docs_dir, exist_ok=True)

files_map = {
    "students_250_cleaned (1).csv": ["students_250_cleaned.csv", "students_250_cleaned (1).csv"],
    "students_lms_250.csv": ["students_lms_250.csv"],
    "students_activities_250.csv": ["students_activities_250.csv"],
    "students_placement_readiness_250.csv": ["students_placement_readiness_250.csv"],
    "students_skill_assessments_250.csv": ["students_skill_assessments_250.csv"],
    "students_feedback_250.csv": ["students_feedback_250.csv"]
}

for src_file, target_names in files_map.items():
    src_path = os.path.join(src_dir, src_file)
    if os.path.exists(src_path):
        for target_name in target_names:
            dst_path = os.path.join(raw_dir, target_name)
            shutil.copyfile(src_path, dst_path)
            print(f"Copied {src_file} -> {dst_path} ({os.path.getsize(dst_path)} bytes)")
    else:
        print(f"Warning: {src_path} not found")

print("Raw data copying complete.")
