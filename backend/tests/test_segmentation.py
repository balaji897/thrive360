import pytest
from app.analytics.segmentation import SegmentationEngine
from app.core.state import app_state

def test_segmentation_assigns_all_students():
    engine = SegmentationEngine()
    students = app_state.students
    
    segments = engine.generate_segments(students)
    assert len(segments) == 6
    
    total_assigned = sum(s.count for s in segments)
    assert total_assigned == len(students)
    
    percentages_sum = sum(s.percentage for s in segments)
    assert 99.0 <= percentages_sum <= 101.0
