# Scoring & Risk Analytics Methodology

This document outlines the mathematical formulation, algorithmic rules, and explainability mechanisms utilized in **Smart Campus Analytics**.

---

## 1. Student Success Score (0 – 100)

The **Student Success Score** is an institutional composite metric designed to reflect a student's holistic performance, campus engagement, and future employability.

### 1.1 Weight Configuration

The platform implements the following baseline weights:

$$\text{Success Score} = \sum_{i=1}^7 W_i \times N_i$$

| Dimension | Default Weight ($W_i$) | Raw Indicators Included | Normalization Formula ($N_i$) |
|---|---|---|---|
| **Academic Performance** | 25% (0.25) | CGPA (0-10), Average Subject Marks (0-100), Backlogs (0-5) | $\max(0, \min(100, (5 \times \text{CGPA} + 0.5 \times \text{AvgMarks}) - 5 \times \text{Backlogs}))$ |
| **Attendance** | 20% (0.20) | Overall Attendance % (0-100) | $\text{Overall Attendance \%}$ |
| **LMS Participation** | 10% (0.10) | LMS Login Frequency | $\min(100, (\text{Logins} / 30) \times 100)$ |
| **Student Engagement** | 10% (0.10) | Events (0-10), Clubs (0-4), Hackathons (0-5), Certifications (0-4) | $\min(30, 6 \times \text{Events}) + \min(20, 10 \times \text{Clubs}) + \min(25, \text{Hackathon pts}) + \min(25, 12.5 \times \text{Certs})$ |
| **Placement Readiness** | 20% (0.20) | Aptitude (0-100), Coding (0-100), Mock Interviews (0-100) | $0.35 \times \text{Coding} + 0.35 \times \text{Aptitude} + 0.30 \times \text{MockAvg}$ *(or $50/50$ if 0 mocks)* |
| **Technical & Soft Skills**| 10% (0.10) | Technical Assessment (0-100), Soft Skills Average (0-100) | $0.50 \times \text{TechAssessment} + 0.50 \times \text{SoftSkillsAvg}$ |
| **Campus Feedback** | 5% (0.05) | Overall Institutional Satisfaction (1-5) | $(\text{Satisfaction} / 5.0) \times 100$ |

### 1.2 Dynamic Reconfiguration
Faculty and institutional leadership can update these weights dynamically through the UI and REST API (`POST /api/v1/config/scoring-weights`). The application enforces that weights strictly sum to 100% and recomputes cohort scores on demand.

---

## 2. Risk Detection Framework

The platform maintains two independent risk assessment pipelines to avoid conflating classroom failure with recruitment challenges.

### 2.1 Academic Risk Assessment
Academic risk evaluates whether a student is in danger of academic detention, course failure, or graduation delay.

- **High Academic Risk**:
  - CGPA $< 6.0$, **OR**
  - Uncleared Backlogs $\ge 2$, **OR**
  - Overall Attendance $< 75\%$ (statutory university minimum), **OR**
  - $\ge 2$ subject marks $< 40$ (immediate backlog fail).
- **Medium Academic Risk**:
  - $6.0 \le \text{CGPA} < 7.0$, **OR**
  - Active Backlogs $= 1$, **OR**
  - Attendance between $75\%$ and $80\%$, **OR**
  - Specific subject attendance shortfall.
- **Low Academic Risk**: Meets all institutional benchmarks.

### 2.2 Placement Risk Assessment
Placement risk assesses whether a student will face obstacles during on-campus recruitment and technical screening.

- **High Placement Risk**:
  - Coding Assessment Score $< 50 / 100$, **OR**
  - Quantitative Aptitude Score $< 50 / 100$, **OR**
  - Core Technical Assessment Score $< 50 / 100$.
- **Medium Placement Risk**:
  - Coding Score $50 - 65$, **OR**
  - Aptitude Score $50 - 65$, **OR**
  - Zero Mock Interviews completed, **OR**
  - Soft Skills Average $< 55 / 100$.
- **Low Placement Risk**: Proficient across algorithmic, aptitude, and interview indicators.

---

## 3. Student Segmentation Strategy

Students are categorized into six mutually exclusive, highly actionable cohorts:

1. **Critical Dual Risk**: High Academic Risk **AND** High Placement Risk. Requires urgent comprehensive intervention.
2. **High Academic / Low Placement Readiness**: Strong theoretical classroom performance (CGPA $\ge 7.5$) but weak practical coding or interview results. Requires coding bootcamps and mock interview coaching.
3. **Placement Ready / Academic Risk**: Practical coding talent (Coding $\ge 70$) jeopardized by backlogs or attendance shortfalls. Requires backlog clearance and attendance compliance to preserve campus placement eligibility.
4. **Low Engagement / Drifting**: Minimal LMS logins ($< 20$) and no club/event participation. Early warning of institutional detachment.
5. **All-Round Achievers**: Outstanding across academics (CGPA $\ge 8.0$), attendance ($\ge 85\%$), placement ($\ge 75\%$), and success score ($\ge 78\%$). Primed for tier-1 recruitment and honors.
6. **Steady Core Performers**: Consistent average progression meeting institutional standards.

---

## 4. Supervised Machine Learning Evaluation

To complement rule-based deterministic diagnostics, an empirical **Random Forest Classifier** is trained on 75% of the student cohort and validated against a 25% stratified holdout set:
- **Model Target**: High Academic Risk Classification.
- **Model Features**: CGPA, Backlogs, Overall Attendance, Subject Marks Average, LMS Logins, Technical Assessment Score, Soft Skills, Coding Score, Aptitude Score.
- **Metrics Reported**: Accuracy, Precision, Recall, F1-Score, and Gini Feature Importance rankings.
