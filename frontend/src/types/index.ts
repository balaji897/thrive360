export interface ScoreContribution {
  category: string;
  weight: number;
  raw_value: number;
  normalized_score: number;
  weighted_contribution: number;
  description: string;
}

export interface RiskAssessment {
  level: 'High' | 'Medium' | 'Low';
  score: number;
  contributing_factors: string[];
  evidence: Record<string, any>;
  recommendations: string[];
}

export interface AcademicProfile {
  cgpa: number;
  maths_marks: number;
  physics_marks: number;
  programming_marks: number;
  dbms_marks: number;
  os_marks: number;
  avg_marks: number;
  backlogs: number;
  maths_attendance: number;
  physics_attendance: number;
  programming_attendance: number;
  dbms_attendance: number;
  os_attendance: number;
  overall_attendance: number;
}

export interface LMSProfile {
  login_frequency: number;
}

export interface ActivitiesProfile {
  events_participated: number;
  clubs_joined_count: number;
  club_names: string[];
  hackathons_participated: number;
  hackathons_won: number;
  certifications_count: number;
  certification_names: string[];
}

export interface PlacementProfile {
  aptitude_score: number;
  coding_score: number;
  mock_interviews_attended: number;
  mock_interview_avg_score: number;
}

export interface SkillsProfile {
  technical_assessment_score: number;
  technical_assessments_attempted: number;
  communication_skills: number;
  teamwork: number;
  leadership: number;
  problem_solving: number;
  time_management: number;
  soft_skills_avg: number;
}

export interface FeedbackProfile {
  overall_satisfaction: number;
  teaching_quality_satisfaction: number;
  infrastructure_satisfaction: number;
  campus_life_satisfaction: number;
  placement_support_satisfaction: number;
  faculty_subject_knowledge: number;
  faculty_communication: number;
  faculty_punctuality: number;
  faculty_doubt_clearing: number;
  faculty_feedback_avg: number;
  would_recommend_college: string;
}

export interface StudentSummary {
  student_id: string;
  name: string;
  department: string;
  year: number;
  cgpa: number;
  overall_attendance: number;
  success_score: number;
  academic_risk_level: 'High' | 'Medium' | 'Low';
  placement_risk_level: 'High' | 'Medium' | 'Low';
  primary_segment: string;
  has_backlogs: boolean;
  backlogs: number;
}

export interface UnifiedStudent {
  student_id: string;
  name: string;
  department: string;
  year: number;
  academics: AcademicProfile;
  lms: LMSProfile;
  activities: ActivitiesProfile;
  placement: PlacementProfile;
  skills: SkillsProfile;
  feedback: FeedbackProfile;
  success_score: number;
  score_breakdown: ScoreContribution[];
  academic_risk: RiskAssessment;
  placement_risk: RiskAssessment;
  primary_segment: string;
  missing_data_flags: string[];
  intelligence?: StudentIntelligenceProfile;
  drivers?: StudentDrivers;
  data_confidence?: StudentDataConfidence;
}

export interface IndicatorGroupConfidence {
  group_name: string;
  status: 'Complete' | 'Partial' | 'Missing';
  completeness_percentage: number;
  indicators_present: number;
  indicators_total: number;
  source_file: string;
  details: string;
}

export interface StudentDataConfidence {
  confidence_score: number;
  confidence_tier: string;
  indicator_groups: IndicatorGroupConfidence[];
  missing_indicators: string[];
  total_indicators_available: number;
  total_indicators_tracked: number;
  provenance_sources_count: number;
}

export interface ScoreDriver {
  category: string;
  indicator: string;
  weight: number;
  student_value: number;
  cohort_mean: number;
  deviation: number;
  impact_score: number;
  impact_type: 'positive' | 'negative';
  explanation: string;
}

export interface StudentDrivers {
  top_positive_drivers: ScoreDriver[];
  top_negative_drivers: ScoreDriver[];
  triggered_risk_rules: string[];
}

export interface PriorityFactorDetail {
  value: number;
  reasons: string[];
}

export interface PriorityQueueItem {
  student_id: string;
  name: string;
  department: string;
  year: number;
  semester: number;
  priority_score: number;
  risk_tier: string;
  risk_factor: number;
  urgency_factor: number;
  recoverability_factor: number;
  factors: {
    risk: PriorityFactorDetail;
    urgency: PriorityFactorDetail;
    recoverability: PriorityFactorDetail;
  };
  top_reasons: string[];
  recommended_action: string;
  academic_risk_level: string;
  placement_risk_level: string;
  cgpa: number;
  attendance: number;
  backlogs: number;
}

export interface PriorityQueueResponse {
  total_in_queue: number;
  filtered_count: number;
  limit: number;
  department_filter?: string | null;
  semester_filter?: number | null;
  items: PriorityQueueItem[];
}


export interface StudentListResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  students: StudentSummary[];
}

export interface ExecutiveSummary {
  total_students: number;
  average_success_score: number;
  academic_risk_counts: { High: number; Medium: number; Low: number };
  placement_risk_counts: { High: number; Medium: number; Low: number };
  students_needing_immediate_attention: number;
  average_cgpa: number;
  average_attendance: number;
  placement_readiness_avg: number;
  department_metrics: Array<{
    department: string;
    student_count: number;
    average_score: number;
    average_cgpa: number;
    average_attendance: number;
    high_risk_count: number;
    risk_percentage: number;
  }>;
  year_metrics: Array<{
    year: string;
    student_count: number;
    average_score: number;
    high_risk_count: number;
  }>;
  top_urgent_students: Array<{
    student_id: string;
    name: string;
    department: string;
    year: number;
    cgpa: number;
    overall_attendance: number;
    success_score: number;
    academic_risk_level: string;
    placement_risk_level: string;
    urgency_score: number;
    primary_reason: string;
  }>;
}

export interface StudentSegment {
  id: string;
  name: string;
  description: string;
  criteria: string;
  count: number;
  percentage: number;
  avg_success_score: number;
  recommended_strategy: string;
  student_ids: string[];
}

export interface RiskHeatmapData {
  department: string;
  academic_high: number;
  academic_med: number;
  academic_low: number;
  placement_high: number;
  placement_med: number;
  placement_low: number;
  total: number;
}

export interface CrossRiskMatrix {
  academic_high_placement_high: number;
  academic_high_placement_med: number;
  academic_high_placement_low: number;
  academic_med_placement_high: number;
  academic_med_placement_med: number;
  academic_med_placement_low: number;
  academic_low_placement_high: number;
  academic_low_placement_med: number;
  academic_low_placement_low: number;
}

export interface StudentIntelligenceProfile {
  anomaly_score: number;
  is_anomaly: boolean;
  anomaly_tier: string;
  top_contributing_indicators: string[];
  conflicting_signals: string[];
  plain_language_explanation: string;
}

export interface CrossSourceInsight {
  id: string;
  pattern_name: string;
  category: string;
  description: string;
  count: number;
  percentage: number;
  threshold_criteria: string;
  silo_blindspot: string;
  recommended_action: string;
  sample_student_ids: string[];
}

export interface TopAnomalousStudent {
  student_id: string;
  name: string;
  department: string;
  year: number;
  anomaly_score: number;
  is_anomaly: boolean;
  anomaly_tier: string;
  top_contributing_indicators: string[];
  conflicting_signals: string[];
  plain_language_explanation: string;
  academic_risk_level: string;
  placement_risk_level: string;
  cgpa: number;
  overall_attendance: number;
}

export interface FeasibilityAuditSummary {
  total_records: number;
  features_audited: number;
  missing_values_count: number;
  ground_truth_labels_found: boolean;
  outcome_labels_audited: string[];
  audit_verdict: string;
  recommendation: string;
}

export interface MLModelMetrics {
  model_name: string;
  target: string;
  accuracy: number;
  f1_score: number;
  precision: number;
  recall: number;
  feature_importances: Array<{
    feature: string;
    importance: number;
    relative_percentage: number;
  }>;
  evaluation_notes: string;
  model_type?: string;
  algorithm?: string;
  status?: string;
  supervised_metrics_available?: boolean;
  supervised_metrics_rationale?: string;
  contamination_rate?: number;
  detected_anomalies_count?: number;
  total_students_evaluated?: number;
  mean_anomaly_score?: number;
  separation_ratio?: number;
  audit_findings?: FeasibilityAuditSummary;
  cross_source_insights?: CrossSourceInsight[];
  top_anomalous_students?: TopAnomalousStudent[];
}

export interface Intervention {
  id: string;
  student_id: string;
  student_name: string;
  category: string;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  assigned_faculty: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  due_date: string;
  action_items: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
  outcome?: string;
}

export interface InterventionCreate {
  student_id: string;
  student_name: string;
  category: string;
  title: string;
  description: string;
  priority: string;
  assigned_faculty: string;
  status?: string;
  due_date: string;
  action_items?: string[];
  notes?: string;
}

export interface SourceFileQuality {
  filename: string;
  purpose: string;
  record_count: number;
  column_count: number;
  columns: string[];
  missing_value_counts: Record<string, number>;
  duplicate_record_count: number;
  unique_student_ids: number;
  id_format_valid: boolean;
  status: string;
}

export interface DataQualityReport {
  timestamp: string;
  total_source_files: number;
  total_raw_records: number;
  integrated_student_count: number;
  expected_student_count: number;
  id_match_rate_percentage: number;
  files: SourceFileQuality[];
  unmatched_student_ids: string[];
  category_coverage: Record<string, { available: boolean; source: string; field_count: number }>;
  data_quality_warnings: string[];
  provenance_summary: string;
}

export interface ScoringWeights {
  academic_performance: number;
  attendance: number;
  lms_participation: number;
  student_engagement: number;
  placement_readiness: number;
  technical_soft_skills: number;
  feedback_support: number;
}

export interface FacultyAccount {
  account_id: string;
  faculty_id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'FACULTY';
  account_status: 'ACTIVE' | 'PENDING_SETUP' | 'INACTIVE';
  password_hash?: string | null;
  last_login?: string | null;
  created_at: string;
}

export interface FacultyMember {
  faculty_id: string;
  faculty_name: string;
  subject: string;
  qualification: string;
  designation: string;
  has_phd: boolean;
  department: string;
  assigned_interventions_count: number;
  account: FacultyAccount;
}

export interface FacultyListResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  faculty: FacultyMember[];
}

export interface FacultyStats {
  total_faculty: number;
  professors: number;
  associate_professors: number;
  assistant_professors: number;
  phd_holders: number;
  subject_distribution: Record<string, number>;
  role_distribution: Record<string, number>;
  status_distribution: Record<string, number>;
}

export type AuthPortal = 'student' | 'faculty';

export interface LoginRequest {
  portal: AuthPortal;
  identifier: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  access_token?: string;
  token_type?: string;
  portal: AuthPortal;
  user_id: string;
  username: string;
  name: string;
  role: string;
  message: string;
}

export interface UserSession {
  user_id: string;
  username: string;
  name: string;
  role: string;
  portal: AuthPortal;
  access_token: string;
}

export interface StudentDashboardData {
  student_id: string;
  name: string;
  department: string;
  year: number;
  success_score: number;
  academic_risk: {
    level: 'High' | 'Medium' | 'Low';
    reasons?: string[];
  };
  placement_risk: {
    level: 'High' | 'Medium' | 'Low';
    reasons?: string[];
  };
  academics: {
    cgpa: number;
    overall_attendance: number;
    backlogs: number;
    semester_grades?: Record<string, number>;
  };
  lms: {
    login_frequency?: number;
    forum_posts?: number;
    resource_access_count?: number;
  };
  placement: {
    coding_score?: number;
    aptitude_score?: number;
    mock_interviews_cleared?: number;
    placement_status?: string;
  };
  activities: {
    events_participated?: number;
    clubs_joined?: number;
  };
  feedback: {
    faculty_support_needed?: boolean;
    sentiment?: string;
  };
  interventions: Array<{
    id: string;
    title: string;
    description: string;
    priority: string;
    status: string;
    assigned_faculty: string;
    due_date: string;
  }>;
  score_breakdown: Record<string, number>;
  recommendations: string[];
}

export interface FacultyDashboardData {
  faculty_id: string;
  faculty_name: string;
  subject: string;
  department: string;
  designation: string;
  role: string;
  is_admin: boolean;
  cohort_total_students: number;
  cohort_average_score: number;
  cohort_high_academic_risk: number;
  cohort_high_placement_risk: number;
  cohort_risk_distribution: Record<string, number>;
  assigned_interventions: Array<{
    id: string;
    student_id: string;
    student_name: string;
    title: string;
    priority: string;
    status: string;
    due_date: string;
  }>;
  authorized_students: Array<{
    student_id: string;
    name: string;
    department: string;
    year: number;
    cgpa: number;
    attendance: number;
    success_score: number;
    academic_risk: string;
    placement_risk: string;
  }>;
  urgent_attention_students: Array<{
    student_id: string;
    name: string;
    department: string;
    year: number;
    cgpa: number;
    attendance: number;
    success_score: number;
    academic_risk: string;
    placement_risk: string;
  }>;
}

export interface SimulationRequest {
  attendance?: number;
  assignment_completion?: number;
  coding_score?: number;
}

export interface SimulationBaseline {
  attendance: number;
  assignment_completion: number;
  coding_score: number;
  success_score: number;
  academic_risk_level: string;
  academic_risk_score: number;
  placement_risk_level: string;
  placement_risk_score: number;
}

export interface SimulationScenario {
  attendance: number;
  assignment_completion: number;
  coding_score: number;
  success_score: number;
  academic_risk_level: string;
  academic_risk_score: number;
  placement_risk_level: string;
  placement_risk_score: number;
}

export interface SimulationDeltas {
  success_score_delta: number;
  academic_risk_score_delta: number;
  placement_risk_score_delta: number;
  academic_tier_transition: string;
  placement_tier_transition: string;
  attendance_delta: number;
  assignment_delta: number;
  coding_delta: number;
}

export interface SimulationResult {
  student_id: string;
  student_name: string;
  baseline: SimulationBaseline;
  scenario: SimulationScenario;
  deltas: SimulationDeltas;
  explanations: string[];
  disclaimer: string;
}



