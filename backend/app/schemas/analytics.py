from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class ExecutiveSummary(BaseModel):
    total_students: int
    average_success_score: float
    academic_risk_counts: Dict[str, int]  # {"High": x, "Medium": y, "Low": z}
    placement_risk_counts: Dict[str, int]
    students_needing_immediate_attention: int
    average_cgpa: float
    average_attendance: float
    placement_readiness_avg: float
    department_metrics: List[Dict[str, Any]]
    year_metrics: List[Dict[str, Any]]
    top_urgent_students: List[Dict[str, Any]]

class StudentSegment(BaseModel):
    id: str
    name: str
    description: str
    criteria: str
    count: int
    percentage: float
    avg_success_score: float
    recommended_strategy: str
    student_ids: List[str]

class RiskHeatmapData(BaseModel):
    department: str
    academic_high: int
    academic_med: int
    academic_low: int
    placement_high: int
    placement_med: int
    placement_low: int
    total: int

class CrossRiskMatrix(BaseModel):
    academic_high_placement_high: int
    academic_high_placement_med: int
    academic_high_placement_low: int
    academic_med_placement_high: int
    academic_med_placement_med: int
    academic_med_placement_low: int
    academic_low_placement_high: int
    academic_low_placement_med: int
    academic_low_placement_low: int

class CrossSourceInsight(BaseModel):
    id: str
    pattern_name: str
    category: str
    description: str
    count: int
    percentage: float
    threshold_criteria: str
    silo_blindspot: str
    recommended_action: str
    sample_student_ids: List[str]

class TopAnomalousStudent(BaseModel):
    student_id: str
    name: str
    department: str
    year: int
    anomaly_score: float
    is_anomaly: bool
    anomaly_tier: str
    top_contributing_indicators: List[str]
    conflicting_signals: List[str]
    plain_language_explanation: str
    academic_risk_level: str
    placement_risk_level: str
    cgpa: float
    overall_attendance: float

class FeasibilityAuditSummary(BaseModel):
    total_records: int
    features_audited: int
    missing_values_count: int
    ground_truth_labels_found: bool
    outcome_labels_audited: List[str]
    audit_verdict: str
    recommendation: str

class MLModelMetrics(BaseModel):
    model_name: str
    target: str
    accuracy: float = 0.0
    f1_score: float = 0.0
    precision: float = 0.0
    recall: float = 0.0
    feature_importances: List[Dict[str, Any]]
    evaluation_notes: str
    model_type: str = "Unsupervised Multivariate Anomaly Detector"
    algorithm: str = "Isolation Forest (Ensemble Trees)"
    status: str = "Active & Calibrated"
    supervised_metrics_available: bool = False
    supervised_metrics_rationale: str = ""
    contamination_rate: float = 0.10
    detected_anomalies_count: int = 0
    total_students_evaluated: int = 0
    mean_anomaly_score: float = 0.0
    separation_ratio: float = 0.0
    audit_findings: Optional[FeasibilityAuditSummary] = None
    cross_source_insights: List[CrossSourceInsight] = []
    top_anomalous_students: List[TopAnomalousStudent] = []

