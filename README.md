# Smart Campus Analytics: Predict, Optimize & Improve Student Success

[![Backend Tests](https://img.shields.io/badge/pytest-18%20passed-emerald)](backend/tests/)
[![FastAPI](https://img.shields.io/badge/FastAPI-v0.110+-blue)](backend/)
[![React](https://img.shields.io/badge/React-18-blue)](frontend/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5-blue)](frontend/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v3.4-38bdf8)](frontend/)

An institutional student intelligence and early-intervention platform built for the **KPMG Hackathon Challenge**. 

The application integrates disparate campus data silos—academics, statutory attendance, digital LMS engagement, extracurricular participation, skill assessments, placement readiness, and student surveys—into unified 360° student profiles, provides explainable academic and placement risk detection, and equips faculty with actionable intervention workflows.

---

## 1. Problem Statement & Solution

Colleges maintain fragmented records across incompatible systems:
- ERP for marks and attendance
- LMS for digital activity logs
- Student affairs for clubs and certifications
- Training & Placement for aptitude, coding assessments, and mock interviews
- Quality assurance cells for student satisfaction surveys

**Smart Campus Analytics** unites these silos into a single, deterministic intelligence hub. It detects academic and placement vulnerabilities before they lead to course failure or missed campus recruitment opportunities.

---

## 2. Ingested Datasets & Provenance

The system ingests and validates six datasets containing **250 students (`STU001` through `STU250`)**:

| # | Dataset File | Rows | Domain & Indicators Included |
|---|---|---|---|
| 1 | `students_250_cleaned.csv` | 250 | CGPA, 5 subject marks (Maths, Physics, Programming, DBMS, OS), backlogs, subject & overall attendance |
| 2 | `students_lms_250.csv` | 250 | Monthly LMS login frequencies |
| 3 | `students_activities_250.csv` | 250 | Events attended, clubs joined, hackathons participated/won, verified certifications |
| 4 | `students_placement_readiness_250.csv` | 250 | Aptitude score, coding score, mock interviews attended & panel score |
| 5 | `students_skill_assessments_250.csv` | 250 | Standardized technical score, 5 soft skill dimensions (Communication, Teamwork, Leadership, Problem Solving, Time Mgmt) |
| 6 | `students_feedback_250.csv` | 250 | Institutional satisfaction, teaching quality, campus life, faculty ratings, college recommendation status |

**Data Integrity Guarantee**:
- **100.0% ID Match Rate** across all six files.
- **Zero record duplication** or synthetic student hallucination.
- Safe missing data handling (delimited fields like `Club_Names` parsed safely without discarding records).

---

## 3. Core Modules & User Interface

The application consists of 6 core modules:

### Module 1: Executive Dashboard
- **Campus KPIs**: Total Students (250), Cohort Success Score Mean, High Academic Risk Count, High Placement Risk Count, Average CGPA, Average Attendance.
- **Dual Risk Distribution**: Interactive Donut charts visualizing Academic Risk vs Placement Readiness Risk.
- **Department Performance**: Bar chart comparing average scores and high-risk student density across IT, CSE, AI&DS, ECE, MECH, and CIVIL.
- **Priority Attention List**: Urgency-indexed alert table highlighting students in critical need of faculty intervention.

### Module 2: Student Directory
- **Search**: Instant search across Student IDs and Names.
- **Multi-Faceted Filtering**: Department, Academic Year (1-4), Academic Risk Level, Placement Risk Level, Backlog status, and Score bounds.
- **Sorting**: Flexible sorting by Student Success Score, CGPA, Attendance, Risk, and Name.
- **Pagination**: Enterprise table layout (15 students per page, 17 pages total).

### Module 3: Student 360° Profile
- **Holistic Overview**: Department, Year, Primary Segment Cohort.
- **Explainable Success Score Breakdown**: Transparent breakdown table displaying raw values, normalized scores, configured weights, and exact points contributed to the composite score (0-100).
- **Academic Risk Diagnosis**: Contributing factors with quantified evidence and customized academic recovery recommendations.
- **Placement Readiness Diagnosis**: Quantified coding/aptitude gaps and recommended career preparation steps.
- **Interactive Visualizations**: Curriculum marks vs attendance bar chart, and 5-dimensional soft skills radar chart.
- **Intervention Trigger**: One-click action to record an intervention for the selected student.

### Module 4: Institutional Analytics & Segmentation
- **Cohort Segments**: Six mutually exclusive, actionable cohorts:
  1. *Critical Dual Risk* (Concurrent academic & placement vulnerability)
  2. *High Academic / Low Placement Readiness* (Theory strong, practical coding weak)
  3. *Placement Ready / Academic Risk* (Practical talent jeopardized by backlogs or attendance)
  4. *Low Engagement / Drifting* (Low LMS logins & minimal campus activities)
  5. *All-Round Achievers* (High performers across all indicators)
  6. *Steady Core Performers* (Consistent mainstream cohort)
- **Cross-Risk Bivariate Matrix**: 3x3 contingency matrix crossing Academic Risk vs Placement Risk.
- **Supervised ML Model Diagnostics**: Random Forest classifier trained on 75% cohort split and evaluated on 25% holdout set, reporting empirical Accuracy, Precision, Recall, F1-Score, and Gini Feature Importance rankings.

### Module 5: Faculty Intervention Management
- **Persistent Storage**: Interventions are stored in `backend/data/interventions.json`.
- **Full Lifecycle**: Filter by status (*Pending, In Progress, Completed, Cancelled*) and priority (*High, Medium, Low*).
- **Action Milestones**: Structured sub-tasks and due dates.
- **Faculty Observation Log**: Real-time logging of meeting notes and counseling observations.

### Module 6: Data Quality & Provenance Audit
- Ingestion verification status, file metadata, null analysis, and category completeness matrix.

---

## 4. Student Success Score Methodology

The Student Success Score is a deterministic composite ranging from 0 to 100:

$$\text{Success Score} = \sum_{i=1}^7 W_i \times N_i$$

Default heuristic weights:
- **Academic Performance**: 25% (CGPA, Subject Marks, Backlogs deduction)
- **Attendance Compliance**: 20% (Overall attendance %)
- **LMS Participation**: 10% (Normalized digital login frequency)
- **Student Engagement**: 10% (Events, clubs, hackathons, certifications)
- **Placement Readiness**: 20% (Coding, aptitude, and mock interviews)
- **Technical & Soft Skills**: 10% (Technical test + Soft skills average)
- **Student Satisfaction**: 5% (Campus survey rating)

**Dynamic Reconfigurability**: Administrators can adjust weights via the UI ("Score Weights" button in the header) or REST API (`POST /api/v1/config/scoring-weights`). The system validates that weights total 100% and recalculates all 250 profiles in real time.

---

## 5. Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Recharts, Lucide React
- **Backend**: Python 3.14 / 3.11+, FastAPI, Pandas, NumPy, Scikit-learn, Pydantic v2
- **Testing**: Pytest, Starlette TestClient (18 tests passing)
- **Data Storage**: Processed JSON/CSV in `backend/data/processed/`, persistent interventions in `backend/data/interventions.json`

---

## 6. How to Run the Application

### Prerequisites
- Python 3.11+
- Node.js 18+ (tested on v24) and npm

### Backend Setup & Launch
```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run unit and integration tests
python -m pytest tests/ -v

# 4. Start the FastAPI server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API will be live at `http://127.0.0.1:8000`.
Interactive API documentation is available at `http://127.0.0.1:8000/docs`.

### Frontend Setup & Launch
```bash
# 1. In a separate terminal, navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 7. Backend REST API Endpoints

- `GET /api/v1/health` — Service health & profile integration count
- `GET /api/v1/dashboard/summary` — Executive KPIs, distributions, department metrics, urgent attention list
- `GET /api/v1/students` — Filterable & paginated student directory
- `GET /api/v1/students/{id}` — Unified 360° profile with full diagnostic breakdown
- `GET /api/v1/analytics/segments` — Cohort segmentation analysis and strategy
- `GET /api/v1/analytics/risks` — Department risk heatmap and cross-risk matrix
- `GET /api/v1/analytics/ml-model` — Supervised ML performance and feature importances
- `GET /api/v1/data-quality` — Ingestion audit report and category coverage
- `GET /api/v1/interventions` — List faculty interventions
- `POST /api/v1/interventions` — Record a new intervention
- `PATCH /api/v1/interventions/{id}` — Update intervention status or notes
- `DELETE /api/v1/interventions/{id}` — Remove an intervention
- `GET /api/v1/config/scoring-weights` — Get active scoring weights
- `POST /api/v1/config/scoring-weights` — Update scoring weights and recalculate cohort scores
