import {
  ExecutiveSummary,
  StudentListResponse,
  UnifiedStudent,
  StudentSegment,
  RiskHeatmapData,
  CrossRiskMatrix,
  MLModelMetrics,
  Intervention,
  InterventionCreate,
  DataQualityReport,
  ScoringWeights,
  FacultyMember,
  FacultyListResponse,
  FacultyStats,
  LoginRequest,
  LoginResponse,
  UserSession,
  StudentDashboardData,
  FacultyDashboardData,
  CrossSourceInsight,
  PriorityQueueResponse,
  SimulationRequest,
  SimulationResult
} from '../types';

const API_BASE = '/api/v1';

export function getAuthHeaders(): Record<string, string> {
  try {
    const raw = sessionStorage.getItem('thrive360_session');
    if (raw) {
      const session = JSON.parse(raw);
      if (session?.access_token) {
        return { Authorization: `Bearer ${session.access_token}` };
      }
    }
  } catch {}
  return {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    if (res.status === 401) {
      // Clear expired session if 401 returned
      sessionStorage.removeItem('thrive360_session');
    }
    const detailMsg = errorData.detail || (res.status === 404 ? 'Requested resource or API endpoint not found on server.' : `Request failed with status ${res.status}`);
    throw new Error(detailMsg);
  }
  return res.json();
}

export const api = {
  getHealth: async () => {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse<{ status: string; students_loaded: number; data_integrated: boolean }>(res);
  },

  getDashboardSummary: async (): Promise<ExecutiveSummary> => {
    const res = await fetch(`${API_BASE}/dashboard/summary`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse<ExecutiveSummary>(res);
  },

  getExecutiveSummary: async (): Promise<ExecutiveSummary> => {
    const res = await fetch(`${API_BASE}/dashboard/summary`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse<ExecutiveSummary>(res);
  },

  getStudents: async (params: {
    search?: string;
    department?: string;
    year?: number;
    academic_risk?: string;
    placement_risk?: string;
    segment?: string;
    min_score?: number;
    max_score?: number;
    has_backlogs?: boolean;
    sort_by?: string;
    sort_order?: string;
    page?: number;
    page_size?: number;
  }): Promise<StudentListResponse> => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.department) query.append('department', params.department);
    if (params.year) query.append('year', params.year.toString());
    if (params.academic_risk) query.append('academic_risk', params.academic_risk);
    if (params.placement_risk) query.append('placement_risk', params.placement_risk);
    if (params.segment) query.append('segment', params.segment);
    if (params.min_score !== undefined) query.append('min_score', params.min_score.toString());
    if (params.max_score !== undefined) query.append('max_score', params.max_score.toString());
    if (params.has_backlogs !== undefined) query.append('has_backlogs', params.has_backlogs.toString());
    if (params.sort_by) query.append('sort_by', params.sort_by);
    if (params.sort_order) query.append('sort_order', params.sort_order);
    if (params.page) query.append('page', params.page.toString());
    if (params.page_size) query.append('page_size', params.page_size.toString());

    const res = await fetch(`${API_BASE}/students?${query.toString()}`);
    return handleResponse<StudentListResponse>(res);
  },

  getStudentDetail: async (studentId: string): Promise<UnifiedStudent> => {
    const res = await fetch(`${API_BASE}/students/${studentId}`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse<UnifiedStudent>(res);
  },

  getSegments: async (): Promise<StudentSegment[]> => {
    const res = await fetch(`${API_BASE}/analytics/segments`);
    return handleResponse<StudentSegment[]>(res);
  },

  getRiskAnalytics: async (): Promise<{ department_heatmap: RiskHeatmapData[]; cross_risk_matrix: CrossRiskMatrix }> => {
    const res = await fetch(`${API_BASE}/analytics/risks`);
    return handleResponse<{ department_heatmap: RiskHeatmapData[]; cross_risk_matrix: CrossRiskMatrix }>(res);
  },

  getMLMetrics: async (): Promise<MLModelMetrics> => {
    const res = await fetch(`${API_BASE}/analytics/ml-model`);
    return handleResponse<MLModelMetrics>(res);
  },

  getMLIntelligence: async (): Promise<MLModelMetrics> => {
    const res = await fetch(`${API_BASE}/analytics/intelligence`);
    return handleResponse<MLModelMetrics>(res);
  },

  getCrossSourceInsights: async (): Promise<CrossSourceInsight[]> => {
    const res = await fetch(`${API_BASE}/analytics/cross-insights`);
    return handleResponse<CrossSourceInsight[]>(res);
  },

  getPriorityQueue: async (params?: {
    department?: string;
    semester?: number;
    limit?: number;
  }): Promise<PriorityQueueResponse> => {
    const query = new URLSearchParams();
    if (params?.department) query.append('department', params.department);
    if (params?.semester !== undefined && params?.semester !== null) query.append('semester', params.semester.toString());
    if (params?.limit !== undefined && params?.limit !== null) query.append('limit', params.limit.toString());

    const queryString = query.toString();
    const url = queryString ? `${API_BASE}/priority-queue?${queryString}` : `${API_BASE}/priority-queue`;

    const res = await fetch(url, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse<PriorityQueueResponse>(res);
  },



  getDataQualityReport: async (): Promise<DataQualityReport> => {
    const res = await fetch(`${API_BASE}/data-quality`);
    return handleResponse<DataQualityReport>(res);
  },

  getInterventions: async (params?: {
    student_id?: string;
    status?: string;
    priority?: string;
    category?: string;
  }): Promise<Intervention[]> => {
    const query = new URLSearchParams();
    if (params?.student_id) query.append('student_id', params.student_id);
    if (params?.status) query.append('status', params.status);
    if (params?.priority) query.append('priority', params.priority);
    if (params?.category) query.append('category', params.category);

    const res = await fetch(`${API_BASE}/interventions?${query.toString()}`);
    return handleResponse<Intervention[]>(res);
  },

  createIntervention: async (data: InterventionCreate): Promise<Intervention> => {
    const res = await fetch(`${API_BASE}/interventions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(data),
    });
    return handleResponse<Intervention>(res);
  },

  simulateStudent: async (
    studentId: string,
    params: SimulationRequest
  ): Promise<SimulationResult> => {
    const res = await fetch(`${API_BASE}/students/${studentId}/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(params),
    });
    return handleResponse<SimulationResult>(res);
  },

  updateIntervention: async (id: string, updates: Partial<Intervention>): Promise<Intervention> => {
    const res = await fetch(`${API_BASE}/interventions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return handleResponse<Intervention>(res);
  },

  deleteIntervention: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/interventions/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error(`Failed to delete intervention with status ${res.status}`);
    }
  },

  getScoringWeights: async (): Promise<ScoringWeights> => {
    const res = await fetch(`${API_BASE}/config/scoring-weights`);
    return handleResponse<ScoringWeights>(res);
  },

  updateScoringWeights: async (weights: ScoringWeights): Promise<ScoringWeights> => {
    const res = await fetch(`${API_BASE}/config/scoring-weights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(weights),
    });
    return handleResponse<ScoringWeights>(res);
  },

  getFaculty: async (params?: {
    search?: string;
    subject?: string;
    designation?: string;
    role?: string;
    account_status?: string;
    page?: number;
    page_size?: number;
  }): Promise<FacultyListResponse> => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.subject) query.append('subject', params.subject);
    if (params?.designation) query.append('designation', params.designation);
    if (params?.role) query.append('role', params.role);
    if (params?.account_status) query.append('account_status', params.account_status);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.page_size) query.append('page_size', params.page_size.toString());

    const res = await fetch(`${API_BASE}/faculty?${query.toString()}`);
    return handleResponse<FacultyListResponse>(res);
  },

  getFacultyStats: async (): Promise<FacultyStats> => {
    const res = await fetch(`${API_BASE}/faculty/stats`);
    return handleResponse<FacultyStats>(res);
  },

  getFacultyDetail: async (facultyId: string): Promise<FacultyMember> => {
    const res = await fetch(`${API_BASE}/faculty/${facultyId}`);
    return handleResponse<FacultyMember>(res);
  },

  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return handleResponse<LoginResponse>(res);
  },

  getCurrentUser: async (token: string): Promise<UserSession> => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse<UserSession>(res);
  },

  logout: async (): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
    });
    sessionStorage.removeItem('thrive360_session');
    return handleResponse<{ success: boolean; message: string }>(res);
  },

  getStudentDashboard: async (): Promise<StudentDashboardData> => {
    const res = await fetch(`${API_BASE}/dashboard/student`, {
      credentials: 'include',
      headers: { ...getAuthHeaders() },
    });
    return handleResponse<StudentDashboardData>(res);
  },

  getFacultyDashboard: async (): Promise<FacultyDashboardData> => {
    const res = await fetch(`${API_BASE}/dashboard/faculty`, {
      credentials: 'include',
      headers: { ...getAuthHeaders() },
    });
    return handleResponse<FacultyDashboardData>(res);
  },
};


