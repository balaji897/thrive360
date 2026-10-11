from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class SourceFileQuality(BaseModel):
    filename: str
    purpose: str
    record_count: int
    column_count: int
    columns: List[str]
    missing_value_counts: Dict[str, int]
    duplicate_record_count: int
    unique_student_ids: int
    id_format_valid: bool
    status: str

class DataQualityReport(BaseModel):
    timestamp: str
    total_source_files: int
    total_raw_records: int
    integrated_student_count: int
    expected_student_count: int
    id_match_rate_percentage: float
    files: List[SourceFileQuality]
    unmatched_student_ids: List[str]
    category_coverage: Dict[str, Dict[str, Any]]
    data_quality_warnings: List[str]
    provenance_summary: str
