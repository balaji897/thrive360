from collections import defaultdict
from typing import List, Dict, Any
from fastapi import APIRouter
from app.core.state import app_state
from app.schemas.analytics import (
    StudentSegment,
    RiskHeatmapData,
    CrossRiskMatrix,
    MLModelMetrics,
    CrossSourceInsight,
)


router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/segments", response_model=List[StudentSegment])
def get_student_segments():
    return app_state.integrator.segmentation.generate_segments(app_state.students)

@router.get("/risks")
@router.get("/risk-heatmap")
def get_risk_analytics():
    students = app_state.students

    # 1. Department Risk Heatmap
    dept_map = defaultdict(lambda: {
        "academic_high": 0, "academic_med": 0, "academic_low": 0,
        "placement_high": 0, "placement_med": 0, "placement_low": 0,
        "total": 0
    })

    # 2. Cross-Risk Matrix (Academic vs Placement)
    matrix = {
        "academic_high_placement_high": 0,
        "academic_high_placement_med": 0,
        "academic_high_placement_low": 0,
        "academic_med_placement_high": 0,
        "academic_med_placement_med": 0,
        "academic_med_placement_low": 0,
        "academic_low_placement_high": 0,
        "academic_low_placement_med": 0,
        "academic_low_placement_low": 0
    }

    for s in students:
        dept = s.get("department", "Unknown")
        acad_lvl = s.get("academic_risk", {}).get("level", "Low")
        place_lvl = s.get("placement_risk", {}).get("level", "Low")

        dept_map[dept]["total"] += 1
        if acad_lvl == "High":
            dept_map[dept]["academic_high"] += 1
        elif acad_lvl == "Medium":
            dept_map[dept]["academic_med"] += 1
        else:
            dept_map[dept]["academic_low"] += 1

        if place_lvl == "High":
            dept_map[dept]["placement_high"] += 1
        elif place_lvl == "Medium":
            dept_map[dept]["placement_med"] += 1
        else:
            dept_map[dept]["placement_low"] += 1

        # Cross key
        a_key = "academic_" + ("high" if acad_lvl == "High" else "med" if acad_lvl == "Medium" else "low")
        p_key = "placement_" + ("high" if place_lvl == "High" else "med" if place_lvl == "Medium" else "low")
        full_key = f"{a_key}_{p_key}"
        if full_key in matrix:
            matrix[full_key] += 1

    heatmap_list = []
    for dept, counts in sorted(dept_map.items()):
        heatmap_list.append(RiskHeatmapData(
            department=dept,
            academic_high=counts["academic_high"],
            academic_med=counts["academic_med"],
            academic_low=counts["academic_low"],
            placement_high=counts["placement_high"],
            placement_med=counts["placement_med"],
            placement_low=counts["placement_low"],
            total=counts["total"]
        ))

    return {
        "department_heatmap": heatmap_list,
        "cross_risk_matrix": CrossRiskMatrix(**matrix)
    }

@router.get("/ml-model", response_model=MLModelMetrics)
def get_ml_metrics():
    if app_state.ml_metrics:
        return app_state.ml_metrics
    app_state.ml_metrics = app_state.ml_predictor.train_and_evaluate(app_state.students)
    return app_state.ml_metrics

@router.get("/intelligence", response_model=MLModelMetrics)
def get_ml_intelligence():
    """Returns the full hybrid Student Success Intelligence Engine metrics, audit, and cross-source insights."""
    return get_ml_metrics()

@router.get("/cross-insights", response_model=List[CrossSourceInsight])
def get_cross_source_insights():
    """Returns empirical cross-source conflicting indicators with counts, percentages, and student examples."""
    metrics = get_ml_metrics()
    return metrics.cross_source_insights

