import json
import os
import sys
sys.path.append("backend")
from app.services.intervention_store import InterventionStore
from app.schemas.intervention import InterventionCreate, InterventionUpdate

print("=== VERIFYING INTERVENTION PERSISTENCE ===")

store_file = r"c:\Users\addan\OneDrive\Desktop\thrive360\backend\data\interventions.json"
store = InterventionStore()

# 1. Verify file exists
assert os.path.exists(store_file), "Interventions file does not exist!"

# 2. Create intervention
test_item = InterventionCreate(
    student_id="STU003",
    student_name="Divya Goud",
    category="Academic",
    title="Audit Verification Remedial Mentoring",
    description="Test intervention to verify ACID JSON file persistence.",
    priority="High",
    assigned_faculty="Auditor Professor",
    due_date="2026-11-15",
    action_items=["Persistence check 1", "Persistence check 2"],
    notes="Initial audit entry"
)

created = store.create(test_item)
created_id = created.id
print(f"Created intervention: {created_id}")

# 3. Read directly from disk file (bypassing any cached memory)
with open(store_file, "r", encoding="utf-8") as f:
    raw_disk_data = json.load(f)

disk_record = next((r for r in raw_disk_data if r["id"] == created_id), None)
assert disk_record is not None, "Failed to find created record on disk!"
assert disk_record["title"] == "Audit Verification Remedial Mentoring"
print("[SUCCESS] Verified created record successfully persisted to disk.")

# 4. Update status and notes
new_store_instance = InterventionStore() # new instance
updated = new_store_instance.update(created_id, InterventionUpdate(status="Completed", outcome="Successfully verified"))
assert updated.status == "Completed"

with open(store_file, "r", encoding="utf-8") as f:
    raw_disk_data2 = json.load(f)

disk_record2 = next((r for r in raw_disk_data2 if r["id"] == created_id), None)
assert disk_record2["status"] == "Completed"
assert disk_record2["outcome"] == "Successfully verified"
print("[SUCCESS] Verified update successfully persisted to disk.")

# 5. Delete and verify removal from disk
new_store_instance.delete(created_id)
with open(store_file, "r", encoding="utf-8") as f:
    raw_disk_data3 = json.load(f)

assert not any(r["id"] == created_id for r in raw_disk_data3), "Record was not deleted from disk!"
print("[SUCCESS] Verified deletion successfully persisted to disk.")
print("=== INTERVENTION PERSISTENCE FULLY VERIFIED ===")
