# Project Architecture: Smart Campus Analytics

This document details the high-level system architecture, component interactions, data pipeline flow, and API design.

---

## 1. System Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                        React + Vite + TypeScript                       │
│                           Frontend Application                         │
│                                                                        │
│  ┌───────────────┐ ┌────────────────┐ ┌────────────────┐ ┌───────────┐  │
│  │ Executive     │ │ Student        │ │ Student        │ │ Analytics │  │
│  │ Dashboard     │ │ Directory      │ │ Profile 360°   │ │ & Segments│  │
│  └───────┬───────┘ └───────┬────────┘ └───────┬────────┘ └─────┬─────┘  │
│          │                 │                  │                │        │
│          └─────────────────┴────────┬─────────┴────────────────┘        │
│                                     │ Axios / API Client                │
└─────────────────────────────────────┼──────────────────────────────────┘
                                      │ HTTP / REST (JSON)
                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          FastAPI Backend                               │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     REST API Endpoints (/api/v1)                 │  │
│  │  /dashboard  /students  /analytics  /interventions  /data-quality│  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│  ┌──────────────────────────────────▼───────────────────────────────┐  │
│  │                     Core Analytics Engines                       │  │
│  │  • SuccessScorer (Configurable heuristic normalization)          │  │
│  │  • RiskDetector (Dual-pipeline: Academic & Placement)            │  │
│  │  • SegmentationEngine (6 Actionable Student Cohorts)             │  │
│  │  • MLPredictor (Supervised Random Forest & Feature Importances)  │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│  ┌──────────────────────────────────▼───────────────────────────────┐  │
│  │                  Data Integration & Storage Engine               │  │
│  │  • DataLoader (Validation & Provenance Audit)                    │  │
│  │  • DataIntegrator (6-way inner join on Student_ID)               │  │
│  │  • InterventionStore (Persistent JSON Storage)                   │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
└─────────────────────────────────────┼──────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          Data Ingestion Layer                          │
│                                                                        │
│  backend/data/raw/                                                     │
│   ├── students_250_cleaned.csv            (Academics & Attendance)     │
│   ├── students_lms_250.csv                (LMS Login Frequencies)      │
│   ├── students_activities_250.csv         (Campus Events & Clubs)      │
│   ├── students_placement_readiness_250.csv (Aptitude & Coding)         │
│   ├── students_skill_assessments_250.csv   (Technical & Soft Skills)   │
│   └── students_feedback_250.csv           (Faculty & Campus Feedback)  │
│                                                                        │
│  backend/data/processed/                                               │
│   ├── integrated_students_250.json        (Unified 360° Profiles)      │
│   ├── integrated_students_250.csv         (Tabular Merged Export)      │
│   └── data_quality_report.json            (Audit & Integrity Metrics)  │
│                                                                        │
│  backend/data/interventions.json          (Persistent Interventions)   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

### Frontend
- **Framework**: React 18 / Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS (light enterprise design system)
- **Icons**: Lucide React
- **Visualizations**: Recharts (Donut, Bar, Radar, Area, Matrix)
- **Routing**: Client-side tabbed and route navigation

### Backend
- **Framework**: FastAPI (high-performance asynchronous Python)
- **Runtime**: Python 3.14 / 3.11+
- **Data Processing**: Pandas, NumPy
- **Validation**: Pydantic v2
- **Machine Learning**: Scikit-learn (RandomForestClassifier, model evaluation)
- **Persistence**: File-based ACID JSON store with dynamic reloading
- **Testing**: Pytest & Starlette TestClient

---

## 3. REST API Specification

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Service health status and data integration indicator |
| `GET` | `/api/v1/dashboard/summary` | Executive KPIs, averages, department & year metrics |
| `GET` | `/api/v1/students` | Filterable, paginated student directory with search |
| `GET` | `/api/v1/students/{student_id}` | Full unified student profile with risk evidence |
| `GET` | `/api/v1/analytics/segments` | Cohort segmentation data and recommended strategies |
| `GET` | `/api/v1/analytics/risks` | Department risk heatmap and cross-risk matrix |
| `GET` | `/api/v1/analytics/ml-model` | Evaluated ML accuracy, F1, and feature importances |
| `GET` | `/api/v1/data-quality` | Data ingestion audit, match rates, and provenance |
| `GET` | `/api/v1/interventions` | List faculty interventions with status/priority filters |
| `POST` | `/api/v1/interventions` | Create a new student intervention record |
| `PATCH`| `/api/v1/interventions/{id}` | Update intervention status, notes, or outcomes |
| `DELETE`| `/api/v1/interventions/{id}`| Remove an intervention record |
| `GET` | `/api/v1/config/scoring-weights` | Retrieve active scoring weights |
| `POST`| `/api/v1/config/scoring-weights` | Update weights and trigger instant re-scoring |
