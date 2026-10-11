from typing import List, Dict, Any, Optional
from app.services.data_integrator import DataIntegrator
from app.services.intervention_store import InterventionStore
from app.services.faculty_service import FacultyService
from app.analytics.ml_predictor import MLPredictor
from app.core.config import ScoringWeights, settings
from app.schemas.data_quality import DataQualityReport
from app.core.auth_seed import dev_seed_store

class AppState:
    def __init__(self):
        self.integrator = DataIntegrator()
        self.intervention_store = InterventionStore()
        self.faculty_service = FacultyService()
        self.ml_predictor = MLPredictor()
        self.students: List[Dict[str, Any]] = []
        self.data_quality_report: Optional[DataQualityReport] = None
        self.current_weights: ScoringWeights = ScoringWeights()
        self.ml_metrics = None

    def initialize(self):
        print("Initializing Smart Campus Analytics data pipeline...")
        self.students, self.data_quality_report = self.integrator.integrate(self.current_weights)
        self.intervention_store.seed_defaults_if_empty(self.students)
        self.ml_metrics = self.ml_predictor.train_and_evaluate(self.students)
        for s in self.students:
            intel = self.ml_predictor.get_student_intelligence(s["student_id"])
            if intel:
                s["intelligence"] = intel.model_dump()
        self.faculty_service.load_and_persist()
        dev_seed_store.initialize()
        print(f"Data pipeline ready! Integrated {len(self.students)} student profiles and {len(self.faculty_service.get_all())} faculty records.")

    def rescore(self, new_weights: ScoringWeights):
        self.current_weights = new_weights
        self.students, self.data_quality_report = self.integrator.integrate(new_weights)
        self.ml_metrics = self.ml_predictor.train_and_evaluate(self.students)
        for s in self.students:
            intel = self.ml_predictor.get_student_intelligence(s["student_id"])
            if intel:
                s["intelligence"] = intel.model_dump()

app_state = AppState()
