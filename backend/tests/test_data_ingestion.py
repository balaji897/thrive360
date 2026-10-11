import pytest
from app.services.data_loader import DataLoader
from app.services.data_integrator import DataIntegrator

def test_data_loader_finds_all_six_files():
    loader = DataLoader()
    dfs, audits = loader.load_raw_datasets()
    
    assert len(dfs) == 6
    assert set(dfs.keys()) == {"students", "lms", "activities", "placement", "skills", "feedback"}
    
    # Check 250 records in each file
    for name, df in dfs.items():
        assert len(df) == 250, f"Expected 250 rows in {name}, found {len(df)}"
        assert df["Student_ID"].nunique() == 250, f"Expected 250 unique student IDs in {name}"

def test_data_integrator_builds_250_unified_profiles():
    integrator = DataIntegrator()
    students, report = integrator.integrate()
    
    assert len(students) == 250
    assert report.integrated_student_count == 250
    assert report.id_match_rate_percentage == 100.0
    assert len(report.unmatched_student_ids) == 0

    first = students[0]
    assert first["student_id"] == "STU001"
    assert "academics" in first
    assert "lms" in first
    assert "activities" in first
    assert "placement" in first
    assert "skills" in first
    assert "feedback" in first
    assert "success_score" in first
    assert "academic_risk" in first
    assert "placement_risk" in first
    assert "primary_segment" in first
