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

/**
 * Resolves the backend API base URL.
 * Supports VITE_API_BASE_URL environment variable provided by Vercel or local .env.
 * Automatically cleans trailing slashes and ensures the '/api/v1' prefix is correctly formatted
 * without omission or duplication. Falls back to the verified Render production backend.
 */
export function resolveApiBaseUrl(rawBaseUrl?: string): string {
  const envUrl = (
    rawBaseUrl ??
    (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_BASE_URL : '') ??
    ''
  ).trim();

  // If unset or empty, default to the verified live Render backend URL
  const target = envUrl || 'https://thrive360-m7fe.onrender.com';

  // Remove trailing slashes
  const clean = target.replace(/\/+$/, '');

  // If the provided URL already ends with '/api/v1', keep it as is
  if (clean.endsWith('/api/v1')) {
    return clean;
  }

  // If the provided URL ends with '/api', append '/v1'
  if (clean.endsWith('/api')) {
    return `${clean}/v1`;
  }

  // Otherwise append '/api/v1'
  return `${clean}/api/v1`;
}

export const API_BASE = resolveApiBaseUrl();

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
    let errorData: any = {};
    try {
      errorData = await res.json();
    } catch {
      // Body may be plain text, HTML, or empty
    }

    if (res.status === 401) {
      // Clear expired session if 401 returned
      sessionStorage.removeItem('thrive360_session');
    }

    let detailMsg = '';
    if (typeof errorData?.detail === 'string') {
      detailMsg = errorData.detail;
    } else if (Array.isArray(errorData?.detail)) {
      // Format FastAPI/Pydantic validation error lists: [{loc: [...], msg: "..."}]
      detailMsg = errorData.detail
        .map((item: any) => (item?.msg ? `${item.loc ? item.loc.join('.') + ': ' : ''}${item.msg}` : JSON.stringify(item)))
        .join('; ');
    } else if (errorData?.detail && typeof errorData.detail === 'object') {
      detailMsg = JSON.stringify(errorData.detail);
    } else if (typeof errorData?.message === 'string') {
      detailMsg = errorData.message;
    } else if (typeof errorData?.error === 'string') {
      detailMsg = errorData.error;
    } else if (res.status === 404) {
      detailMsg = 'Requested resource or API endpoint not found on server.';
    } else {
      detailMsg = `Request failed with status ${res.status}`;
    }

    throw new Error(detailMsg);
  }

  if (res.status === 204) {
    return undefined as unknown as T;
  }

  try {
    return await res.json();
  } catch (err: any) {
    throw new Error(`Failed to parse server response as JSON (${err?.message || 'invalid JSON'}).`);
  }
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

    const queryString = query.toString();
    const url = queryString ? `${API_BASE}/students?${queryString}` : `${API_BASE}/students`;
    const res = await fetch(url, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse<StudentListResponse>(res);
  },

  getStudentDetail: async (studentId: string): Promise<UnifiedStudent> => {
    const res = await fetch(`${API_BASE}/students/${encodeURIComponent(studentId)}`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse<UnifiedStudent>(res);
  },

  getSegments: async (): Promise<StudentSegment[]> => {
    const res = await fetch(`${API_BASE}/analytics/segments`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse<StudentSegment[]>(res);
  },

  getRiskAnalytics: async (): Promise<{ department_heatmap: RiskHeatmapData[]; cross_risk_matrix: CrossRiskMatrix }> => {
    const res = await fetch(`${API_BASE}/analytics/risks`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse<{ department_heatmap: RiskHeatmapData[]; cross_risk_matrix: CrossRiskMatrix }>(res);
  },

  getMLMetrics: async (): Promise<MLModelMetrics> => {
    const res = await fetch(`${API_BASE}/analytics/ml-model`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse<MLModelMetrics>(res);
  },

  getMLIntelligence: async (): Promise<MLModelMetrics> => {
    const res = await fetch(`${API_BASE}/analytics/intelligence`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse<MLModelMetrics>(res);
  },

  getCrossSourceInsights: async (): Promise<CrossSourceInsight[]> => {
    const res = await fetch(`${API_BASE}/analytics/cross-insights`, {
      headers: { ...getAuthHeaders() }
    });
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
    const res = await fetch(`${API_BASE}/data-quality`, {
      headers: { ...getAuthHeaders() }
    });
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

    const queryString = query.toString();
    const url = queryString ? `${API_BASE}/interventions?${queryString}` : `${API_BASE}/interventions`;

    const res = await fetch(url, {
      headers: { ...getAuthHeaders() }
    });
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
    const res = await fetch(`${API_BASE}/students/${encodeURIComponent(studentId)}/simulate`, {
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
    const res = await fetch(`${API_BASE}/interventions/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(updates),
    });
    return handleResponse<Intervention>(res);
  },

  deleteIntervention: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/interventions/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    });
    await handleResponse<void>(res);
  },

  getScoringWeights: async (): Promise<ScoringWeights> => {
    const res = await fetch(`${API_BASE}/config/scoring-weights`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse<ScoringWeights>(res);
  },

  updateScoringWeights: async (weights: ScoringWeights): Promise<ScoringWeights> => {
    const res = await fetch(`${API_BASE}/config/scoring-weights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
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

    const queryString = query.toString();
    const url = queryString ? `${API_BASE}/faculty?${queryString}` : `${API_BASE}/faculty`;

    const res = await fetch(url, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse<FacultyListResponse>(res);
  },

  getFacultyStats: async (): Promise<FacultyStats> => {
    const res = await fetch(`${API_BASE}/faculty/stats`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse<FacultyStats>(res);
  },

  getFacultyDetail: async (facultyId: string): Promise<FacultyMember> => {
    const res = await fetch(`${API_BASE}/faculty/${encodeURIComponent(facultyId)}`, {
      headers: { ...getAuthHeaders() }
    });
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
      headers: { ...getAuthHeaders() },
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


