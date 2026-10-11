import pytest
from app.services.intervention_store import InterventionStore
from app.schemas.intervention import InterventionCreate, InterventionUpdate

def test_intervention_crud_lifecycle(tmp_path):
    store = InterventionStore(storage_file=tmp_path / "test_interventions.json")
    
    # 1. Create
    new_item = InterventionCreate(
        student_id="STU001",
        student_name="Karthik Babu",
        category="Academic",
        title="Weekly Mentoring",
        description="Check progress in DBMS and OS subjects.",
        priority="Medium",
        assigned_faculty="Prof. Ramanathan",
        due_date="2026-11-01",
        action_items=["Review unit 1", "Submit assignment 1"]
    )
    created = store.create(new_item)
    assert created.id.startswith("INT-")
    assert created.student_id == "STU001"
    assert created.status == "Pending"

    # 2. Read
    fetched = store.get_by_id(created.id)
    assert fetched is not None
    assert fetched.title == "Weekly Mentoring"

    # 3. Update
    updated = store.update(created.id, InterventionUpdate(status="In Progress", notes="Student attended first meeting."))
    assert updated.status == "In Progress"
    assert updated.notes == "Student attended first meeting."

    # 4. List
    all_items = store.list_all(student_id="STU001")
    assert len(all_items) == 1

    # 5. Delete
    deleted = store.delete(created.id)
    assert deleted is True
    assert store.get_by_id(created.id) is None
