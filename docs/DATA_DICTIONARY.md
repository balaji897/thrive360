# Data Dictionary: Smart Campus Analytics

This document defines the schema, data types, constraints, and provenance for the six integrated source datasets and the unified student profile in the **Smart Campus Analytics** platform.

---

## 1. Source Datasets Overview

| # | Filename | Record Count | Unique Students | Purpose | Primary Key |
|---|---|---|---|---|---|
| 1 | `students_250_cleaned.csv` | 250 | 250 | Core academic marks, backlogs, attendance | `Student_ID` |
| 2 | `students_lms_250.csv` | 250 | 250 | Learning Management System login frequencies | `Student_ID` |
| 3 | `students_activities_250.csv` | 250 | 250 | Events, clubs, hackathons, and certifications | `Student_ID` |
| 4 | `students_placement_readiness_250.csv` | 250 | 250 | Aptitude, coding, and mock interview performance | `Student_ID` |
| 5 | `students_skill_assessments_250.csv` | 250 | 250 | Technical test results and 5 soft skill dimensions | `Student_ID` |
| 6 | `students_feedback_250.csv` | 250 | 250 | Institutional satisfaction and faculty appraisals | `Student_ID` |

---

## 2. Field Specifications by Source

### 2.1 Core Academic & Attendance (`students_250_cleaned.csv`)

| Field Name | Type | Range / Values | Description |
|---|---|---|---|
| `Student_ID` | String | `STU001` - `STU250` | Unique student institutional identifier |
| `Name` | String | UTF-8 Text | Full name of the student |
| `Department` | String | `IT`, `CSE`, `ECE`, `MECH`, `CIVIL`, `AI&DS` | Academic department affiliation |
| `Year` | Integer | 1, 2, 3, 4 | Current year of study |
| `CGPA` | Float | 0.00 – 10.00 | Cumulative Grade Point Average |
| `Maths_Marks` | Integer | 0 – 100 | Mathematics exam score |
| `Physics_Marks` | Integer | 0 – 100 | Physics exam score |
| `Programming_Marks`| Integer | 0 – 100 | Core Programming exam score |
| `DBMS_Marks` | Integer | 0 – 100 | Database Management Systems exam score |
| `OS_Marks` | Integer | 0 – 100 | Operating Systems exam score |
| `Backlogs` | Integer | 0 – 5 | Number of active uncleared academic backlogs |
| `Maths_Attendance_%`| Float | 0.0 – 100.0 | Subject attendance percentage for Mathematics |
| `Physics_Attendance_%`| Float | 0.0 – 100.0 | Subject attendance percentage for Physics |
| `Programming_Attendance_%`| Float | 0.0 – 100.0 | Subject attendance percentage for Programming |
| `DBMS_Attendance_%`| Float | 0.0 – 100.0 | Subject attendance percentage for DBMS |
| `OS_Attendance_%` | Float | 0.0 – 100.0 | Subject attendance percentage for OS |
| `Overall_Attendance_%`| Float | 0.0 – 100.0 | Aggregate institutional attendance percentage |

### 2.2 LMS Participation (`students_lms_250.csv`)

| Field Name | Type | Range / Values | Description |
|---|---|---|---|
| `Student_ID` | String | `STU001` - `STU250` | Unique student identifier |
| `Name` | String | Text | Student name |
| `LMS_Login_Frequency` | Integer | 10 – 35 | Number of digital LMS logins in evaluated tracking cycle |

### 2.3 Campus Engagement & Activities (`students_activities_250.csv`)

| Field Name | Type | Range / Values | Description |
|---|---|---|---|
| `Events_Participated` | Integer | 0 – 10 | Campus co-curricular events participated |
| `Clubs_Joined_Count` | Integer | 0 – 4 | Total clubs joined |
| `Club_Names` | String / Null | Semicolon-delimited | Names of joined clubs (e.g. `Coding Club; NSS`) |
| `Hackathons_Participated`| Integer | 0 – 5 | Technical hackathons attended |
| `Hackathons_Won` | Integer | 0 – 3 | Technical hackathons won |
| `Certifications_Count`| Integer | 0 – 4 | Verified technical certifications earned |
| `Certification_Names`| String / Null | Semicolon-delimited | Certification titles (e.g. `Coursera ML; NPTEL`) |

### 2.4 Placement Readiness (`students_placement_readiness_250.csv`)

| Field Name | Type | Range / Values | Description |
|---|---|---|---|
| `Aptitude_Score` | Float | 0 – 100 | Quantitative, logical, and verbal aptitude score |
| `Coding_Score` | Float | 0 – 100 | Algorithmic and practical coding benchmark score |
| `Mock_Interviews_Attended` | Integer | 0 – 5 | Institutional mock interviews completed |
| `Mock_Interview_Avg_Score` | Float | 0 – 100 | Average panel score in mock technical/HR rounds |

### 2.5 Skill Assessments (`students_skill_assessments_250.csv`)

| Field Name | Type | Range / Values | Description |
|---|---|---|---|
| `Technical_Assessment_Score` | Float | 0 – 100 | Standardized computer science technical assessment score |
| `Technical_Assessments_Attempted` | Integer | 1 – 10 | Total practice assessment modules attempted |
| `Communication_Skills` | Float | 0 – 100 | Assessed verbal and written communication ability |
| `Teamwork` | Float | 0 – 100 | Peer & project collaboration competency rating |
| `Leadership` | Float | 0 – 100 | Initiative and team leadership competency rating |
| `Problem_Solving` | Float | 0 – 100 | Analytical problem solving competency rating |
| `Time_Management` | Float | 0 – 100 | Task planning and deadline adherence competency rating |
| `Soft_Skills_Avg` | Float | 0 – 100 | Composite average of the 5 soft skill dimensions |

### 2.6 Student Feedback & Perception (`students_feedback_250.csv`)

| Field Name | Type | Range / Values | Description |
|---|---|---|---|
| `Overall_Satisfaction` | Float | 1.0 – 5.0 | Overall institutional satisfaction rating |
| `Teaching_Quality_Satisfaction` | Float | 1.0 – 5.0 | Satisfaction with pedagogy and instruction |
| `Infrastructure_Satisfaction` | Float | 1.0 – 5.0 | Satisfaction with labs, library, campus amenities |
| `Campus_Life_Satisfaction` | Float | 1.0 – 5.0 | Satisfaction with cultural and extracurricular life |
| `Placement_Support_Satisfaction`| Float | 1.0 – 5.0 | Rating of training and placement cell guidance |
| `Faculty_Subject_Knowledge` | Float | 1.0 – 5.0 | Faculty technical competence score |
| `Faculty_Communication` | Float | 1.0 – 5.0 | Faculty delivery and clarity score |
| `Faculty_Punctuality` | Float | 1.0 – 5.0 | Faculty regularity and punctuality score |
| `Faculty_Doubt_Clearing` | Float | 1.0 – 5.0 | Faculty accessibility and doubt clearing score |
| `Faculty_Feedback_Avg` | Float | 1.0 – 5.0 | Composite average of faculty assessment criteria |
| `Would_Recommend_College` | String | `Yes`, `No` | Institutional promoter recommendation status |

---

## 3. Data Integration & Validation Rules

1. **Identifier Normalization**: All incoming `Student_ID` keys are trimmed of leading/trailing whitespace, capitalized (`STU001`), and regex validated (`^STU\d+$`).
2. **Missing Value Policy**:
   - `Club_Names` and `Certification_Names` with null/blank entries are legitimately parsed as empty arrays `[]`.
   - Students with `Mock_Interviews_Attended = 0` are not penalized with an artificial zero score; their placement readiness is computed via balanced coding & aptitude weighting with a mock interview alert.
3. **Record Deduplication**: Strict single-record primary key matching guarantees zero duplication across all 250 profiles.
