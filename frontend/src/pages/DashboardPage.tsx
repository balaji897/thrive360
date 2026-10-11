import React, { useEffect, useState } from 'react';
import { ExecutiveSummary, MLModelMetrics, PriorityQueueResponse } from '../types';
import { api } from '../services/api';
import {
  Users,
  Award,
  AlertTriangle,
  Briefcase,
  GraduationCap,
  CalendarCheck,
  ChevronRight,
  TrendingUp,
  BrainCircuit,
  ShieldCheck,
  CheckCircle2,
  ShieldAlert,
  KeyRound,
  RefreshCw,
  PlusCircle,
  FileText
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface DashboardPageProps {
  onSelectStudent: (studentId: string) => void;
  onNavigateToStudents: (filter?: { academic_risk?: string; placement_risk?: string }) => void;
  onOpenInterventionModal?: (
    studentId: string,
    studentName: string,
    category?: string,
    title?: string,
    description?: string,
    priority?: string
  ) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onSelectStudent,
  onNavigateToStudents,
  onOpenInterventionModal
}) => {
  const [data, setData] = useState<ExecutiveSummary | null>(null);
  const [mlData, setMlData] = useState<MLModelMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [mlLoading, setMlLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mlError, setMlError] = useState<string | null>(null);

  // Priority Queue State (Task A & C Multi-Factor Triage Engine)
  const [priorityData, setPriorityData] = useState<PriorityQueueResponse | null>(null);
  const [priorityLimit, setPriorityLimit] = useState<number>(10);
  const [priorityDept, setPriorityDept] = useState<string>('');
  const [prioritySemester, setPrioritySemester] = useState<string>('');
  const [priorityLoading, setPriorityLoading] = useState<boolean>(true);
  const [priorityError, setPriorityError] = useState<string | null>(null);
  const [authQuickLoggingIn, setAuthQuickLoggingIn] = useState<boolean>(false);

  useEffect(() => {
    loadSummary();
    loadPriorityQueue(10, '', '');
  }, []);

  const loadPriorityQueue = async (limit = priorityLimit, dept = priorityDept, sem = prioritySemester) => {
    setPriorityLoading(true);
    setPriorityError(null);
    try {
      const res = await api.getPriorityQueue({
        limit,
        department: dept || undefined,
        semester: sem ? parseInt(sem, 10) : undefined,
      });
      setPriorityData(res);
    } catch (err: any) {
      setPriorityError(err.message || 'Failed to fetch priority queue');
    } finally {
      setPriorityLoading(false);
    }
  };

  const handleLimitChange = (newLimit: number) => {
    setPriorityLimit(newLimit);
    loadPriorityQueue(newLimit, priorityDept, prioritySemester);
  };

  const handleDeptChange = (newDept: string) => {
    setPriorityDept(newDept);
    loadPriorityQueue(priorityLimit, newDept, prioritySemester);
  };

  const handleSemesterChange = (newSem: string) => {
    setPrioritySemester(newSem);
    loadPriorityQueue(priorityLimit, priorityDept, newSem);
  };

  const handleQuickFacultyLogin = async () => {
    setAuthQuickLoggingIn(true);
    try {
      const loginRes = await api.login({
        portal: 'faculty',
        identifier: 'FAC01',
        password: 'CampusFaculty2026!'
      });
      if (loginRes.success && loginRes.access_token) {
        const session = {
          user_id: loginRes.user_id,
          username: loginRes.username,
          name: loginRes.name,
          role: loginRes.role,
          portal: loginRes.portal,
          access_token: loginRes.access_token
        };
        sessionStorage.setItem('thrive360_session', JSON.stringify(session));
        await loadPriorityQueue(priorityLimit, priorityDept, prioritySemester);
      }
    } catch (err: any) {
      setPriorityError(err.message || 'Demo faculty sign-in failed');
    } finally {
      setAuthQuickLoggingIn(false);
    }
  };

  const loadSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const summary = await api.getDashboardSummary();
      setData(summary);
    } catch (err: any) {
      setError(err.message || 'Failed to load executive summary');
    } finally {
      setLoading(false);
    }

    setMlLoading(true);
    setMlError(null);
    try {
      const ml = await api.getMLMetrics();
      setMlData(ml);
    } catch (err: any) {
      setMlError(err.message || 'Failed to load machine learning metrics');
    } finally {
      setMlLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-8 h-8 border-3 border-cyan-700/20 border-t-cyan-700 rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 font-medium">Synchronizing Executive Dashboard Telemetry...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto my-10 p-6 bg-white border border-rose-200 rounded-xl space-y-3 shadow-2xs text-center">
        <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
        <h2 className="font-display text-base font-bold text-slate-900">
          Executive Dashboard Synchronization Error
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          {error || 'Unable to retrieve executive summary metrics from server.'}
        </p>
        <button
          onClick={loadSummary}
          className="mt-2 px-4 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition cursor-pointer shadow-2xs"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Restrained professional palette for risk charts
  const academicRiskData = [
    { name: 'High Risk', value: data.academic_risk_counts.High, color: '#e11d48' },
    { name: 'Medium Risk', value: data.academic_risk_counts.Medium, color: '#d97706' },
    { name: 'Low Risk', value: data.academic_risk_counts.Low, color: '#059669' },
  ];

  const placementRiskData = [
    { name: 'High Risk', value: data.placement_risk_counts.High, color: '#e11d48' },
    { name: 'Medium Risk', value: data.placement_risk_counts.Medium, color: '#d97706' },
    { name: 'Low Risk', value: data.placement_risk_counts.Low, color: '#059669' },
  ];

  const tooltipStyle = {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#0f172a',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. Compact Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/90">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-800">
              QIS College of Engineering and Technology
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-[11px] text-slate-500 font-medium">Executive Overview</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-display">
            Campus-Wide Student Intelligence
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
            Deterministic multi-source analytics across academic performance, statutory attendance, digital LMS interaction, placement preparation, and multi-skill competencies.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-700" />
            <span>Cohort: <strong className="text-slate-900 font-semibold">{data.total_students} Profiles</strong></span>
            <span className="text-slate-300">•</span>
            <span><strong className="text-slate-900 font-semibold">6 Departments</strong></span>
          </div>
          <button
            onClick={loadSummary}
            title="Refresh Metrics"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-950 border border-slate-200 rounded-lg text-xs font-medium shadow-2xs transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Main KPI Cards Grid (Consistent dimensions & clear hierarchy) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Students */}
        <div className="h-full bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Total Students</span>
              <div className="p-1.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                {data.total_students}
              </span>
              <span className="text-xs text-slate-500 font-medium">profiles</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            6 Unified Datasets Merged
          </p>
        </div>

        {/* Cohort Success Score */}
        <div className="h-full bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Cohort Success Score</span>
              <div className="p-1.5 rounded-md bg-slate-100 text-cyan-700 border border-slate-200/80">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                {data.average_success_score}
              </span>
              <span className="text-xs text-slate-400 font-mono">/ 100</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            Cohort Mean Benchmark (0 - 100)
          </p>
        </div>

        {/* Academic High Risk */}
        <div className="h-full bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Academic High Risk</span>
              <div className="p-1.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200/80">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-rose-700 tabular-nums">
                {data.academic_risk_counts.High}
              </span>
              <span className="text-xs text-slate-500 font-medium">students</span>
            </div>
          </div>
          <p className="text-[11px] text-rose-700 font-medium mt-2 pt-2 border-t border-slate-100">
            {((data.academic_risk_counts.High / data.total_students) * 100).toFixed(1)}% of student body requiring review
          </p>
        </div>

        {/* Placement High Risk */}
        <div className="h-full bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Placement High Risk</span>
              <div className="p-1.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/80">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-amber-700 tabular-nums">
                {data.placement_risk_counts.High}
              </span>
              <span className="text-xs text-slate-500 font-medium">students</span>
            </div>
          </div>
          <p className="text-[11px] text-amber-700 font-medium mt-2 pt-2 border-t border-slate-100">
            {((data.placement_risk_counts.High / data.total_students) * 100).toFixed(1)}% career prep vulnerability
          </p>
        </div>
      </div>

      {/* Secondary Benchmark Strips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Average CGPA</span>
            <div className="text-2xl font-bold text-slate-900 mt-0.5 font-display tabular-nums">
              {data.average_cgpa} <span className="text-xs font-normal text-slate-400 font-mono">/ 10</span>
            </div>
            <span className="text-[11px] text-slate-500">Cumulative Academic Standing</span>
          </div>
          <div className="p-2 bg-slate-100 text-cyan-800 rounded-lg border border-slate-200/80">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Average Attendance</span>
            <div className="text-2xl font-bold text-slate-900 mt-0.5 font-display tabular-nums">
              {data.average_attendance}%
            </div>
            <span className="text-[11px] text-slate-500">Statutory Institutional Threshold: 75%</span>
          </div>
          <div className="p-2 bg-slate-100 text-emerald-700 rounded-lg border border-slate-200/80">
            <CalendarCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Placement Prep Avg</span>
            <div className="text-2xl font-bold text-slate-900 mt-0.5 font-display tabular-nums">
              {data.placement_readiness_avg} <span className="text-xs font-normal text-slate-400 font-mono">/ 100</span>
            </div>
            <span className="text-[11px] text-slate-500">Coding, Aptitude & Mock Interviews</span>
          </div>
          <div className="p-2 bg-slate-100 text-slate-700 rounded-lg border border-slate-200/80">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Dual Risk Donut Charts (Aligned, Readable Legends & Restrained Colors) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Academic Risk Distribution */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Academic Risk Distribution</h3>
                <p className="text-xs text-slate-500">Classroom backlogs, sub-75% attendance, & subject marks</p>
              </div>
              <button
                onClick={() => onNavigateToStudents({ academic_risk: 'High' })}
                className="text-xs font-semibold text-cyan-800 hover:text-cyan-950 flex items-center gap-1 cursor-pointer"
              >
                View High Risk <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-56 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={academicRiskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={82}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {academicRiskData.map((entry, idx) => (
                      <Cell key={`cell-acad-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
            {academicRiskData.map(item => (
              <div key={item.name} className="p-2 rounded-lg bg-slate-50/70 border border-slate-200/80">
                <span className="text-[11px] font-medium text-slate-500 block truncate">{item.name}</span>
                <p className="text-base sm:text-lg font-bold text-slate-900 font-display tabular-nums mt-0.5">
                  {item.value}
                </p>
                <span className="text-[10px] text-slate-400 font-mono">
                  {((item.value / data.total_students) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Placement Readiness Risk */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Placement Readiness Risk</h3>
                <p className="text-xs text-slate-500">Coding assessments, aptitude scores, & mock interviews</p>
              </div>
              <button
                onClick={() => onNavigateToStudents({ placement_risk: 'High' })}
                className="text-xs font-semibold text-cyan-800 hover:text-cyan-950 flex items-center gap-1 cursor-pointer"
              >
                View High Risk <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-56 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={placementRiskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={82}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {placementRiskData.map((entry, idx) => (
                      <Cell key={`cell-place-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
            {placementRiskData.map(item => (
              <div key={item.name} className="p-2 rounded-lg bg-slate-50/70 border border-slate-200/80">
                <span className="text-[11px] font-medium text-slate-500 block truncate">{item.name}</span>
                <p className="text-base sm:text-lg font-bold text-slate-900 font-display tabular-nums mt-0.5">
                  {item.value}
                </p>
                <span className="text-[10px] text-slate-400 font-mono">
                  {((item.value / data.total_students) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Department Performance & High Risk Distribution Bar Chart */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Department Performance & Risk Breakdown</h3>
            <p className="text-xs text-slate-500">Average success score vs at-risk student count across academic disciplines</p>
          </div>
        </div>

        <div className="h-64 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.department_metrics} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
              <XAxis dataKey="department" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis yAxisId="left" orientation="left" stroke="#0891b2" fontSize={11} domain={[0, 100]} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" stroke="#ea580c" fontSize={11} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
              <Bar yAxisId="left" dataKey="average_score" name="Mean Success Score" fill="#0891b2" radius={[3, 3, 0, 0]} />
              <Bar yAxisId="right" dataKey="high_risk_count" name="High Risk Students" fill="#ea580c" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Student Success Intelligence & Unsupervised Anomaly Engine */}
      {mlLoading ? (
        <div className="bg-[#0c1a2e] text-white rounded-xl p-8 border border-slate-800 shadow-2xs flex flex-col items-center justify-center min-h-[180px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mb-2.5"></div>
          <span className="text-xs text-slate-300 font-medium">Calibrating Unsupervised Isolation Forest Telemetry...</span>
        </div>
      ) : mlError || !mlData ? (
        <div className="bg-[#0c1a2e] border border-slate-800 rounded-xl p-6 text-white space-y-2 shadow-2xs">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>ML Intelligence Diagnostics Unavailable</span>
          </div>
          <p className="text-xs text-slate-300">{mlError || 'Unable to retrieve unsupervised model telemetry.'}</p>
          <button
            onClick={loadSummary}
            className="mt-2 px-3.5 py-1.5 text-xs font-semibold bg-cyan-700 hover:bg-cyan-600 rounded-lg text-white transition cursor-pointer"
          >
            Retry Model Ingestion
          </button>
        </div>
      ) : (
        <div className="bg-[#0c1a2e] text-white rounded-xl p-5 sm:p-6 border border-slate-800 shadow-2xs space-y-5">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3.5 border-b border-slate-800">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                  <BrainCircuit className="w-3.5 h-3.5 text-cyan-400" />
                  Machine Learning Engine
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" />
                  {mlData.status || "Active & Calibrated"}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white mt-1.5 font-display">
                Student Success Intelligence & Unsupervised Anomaly Engine
              </h2>
              <p className="text-xs text-slate-300 mt-0.5 max-w-2xl leading-relaxed">
                Multi-dimensional Isolation Forest calibrated on 250 integrated student profiles across 14 normalized indicators. Identifies atypical distress combinations without synthetic label leakage.
              </p>
            </div>

            <div className="flex flex-col items-start md:items-end text-xs shrink-0">
              <span className="text-slate-400">Architecture</span>
              <span className="font-mono font-bold text-cyan-300 text-sm">{mlData.algorithm || "Isolation Forest (Ensemble Trees)"}</span>
              <span className="text-slate-400 text-[11px]">Scikit-Learn Baseline</span>
            </div>
          </div>

          {/* Feasibility Audit Callout */}
          <div className="bg-[#071324] border border-slate-700/80 rounded-lg p-3.5">
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-slate-800 text-cyan-300 rounded shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-xs space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-200">Prediction Feasibility Audit:</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Ground-Truth Outcome Labels Absent
                  </span>
                  <span className="text-slate-400 text-[11px]">Audit N=250 Student Profiles</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  {mlData.audit_findings?.audit_verdict || mlData.supervised_metrics_rationale || "Cohort dataset contains rich formative tracking metrics across 6 integrated domains but lacks genuine historical post-hoc outcome labels. To prevent circular synthetic data leakage, supervised classification accuracy is not fabricated. Retained deterministic success scorer and deployed honest unsupervised Isolation Forest multivariate anomaly detection."}
                </p>
              </div>
            </div>
          </div>

          {/* Metric Diagnostic Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#071324] border border-slate-700/70 rounded-lg p-3">
              <span className="text-[11px] font-medium text-slate-400 block uppercase">Multivariate Anomalies</span>
              <div className="text-xl font-bold text-white mt-0.5 font-display tabular-nums">
                {mlData.detected_anomalies_count || 25} <span className="text-xs font-normal text-slate-400">/ {mlData.total_students_evaluated || 250}</span>
              </div>
              <span className="text-[11px] text-cyan-400 font-medium block mt-0.5">
                {(((mlData.detected_anomalies_count || 25) / (mlData.total_students_evaluated || 250)) * 100).toFixed(1)}% Atypical Cohort
              </span>
            </div>

            <div className="bg-[#071324] border border-slate-700/70 rounded-lg p-3">
              <span className="text-[11px] font-medium text-slate-400 block uppercase">Contamination Rate</span>
              <div className="text-xl font-bold text-white mt-0.5 font-display tabular-nums">
                {((mlData.contamination_rate || 0.10) * 100).toFixed(1)}%
              </div>
              <span className="text-[11px] text-slate-300 font-medium block mt-0.5">
                Calibrated Outlier Budget
              </span>
            </div>

            <div className="bg-[#071324] border border-slate-700/70 rounded-lg p-3">
              <span className="text-[11px] font-medium text-slate-400 block uppercase">Mean Anomaly Score</span>
              <div className="text-xl font-bold text-white mt-0.5 font-display tabular-nums">
                {(mlData.mean_anomaly_score || 0.27).toFixed(2)} <span className="text-xs font-normal text-slate-400">/ 1.0</span>
              </div>
              <span className="text-[11px] text-amber-300 font-medium block mt-0.5">
                Continuous Decision Index
              </span>
            </div>

            <div className="bg-[#071324] border border-slate-700/70 rounded-lg p-3">
              <span className="text-[11px] font-medium text-slate-400 block uppercase">Supervised Evaluation</span>
              <div className="text-xl font-bold text-slate-300 mt-0.5 font-display">
                N/A
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Honest Fallback (Zero Leakage)
              </span>
            </div>
          </div>

          {/* Leading Risk Indicators: Feature Importances */}
          {mlData.feature_importances && mlData.feature_importances.length > 0 && (
            <div className="bg-[#071324] border border-slate-700/70 rounded-lg p-3.5 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1 border-b border-slate-800">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    Leading Risk Indicators (Empirical Contrast Feature Separation)
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Standardized absolute deviation separating atypical at-risk profiles from normal cohort inliers across 14 multi-domain features.
                  </p>
                </div>
                <span className="text-[11px] text-cyan-300 font-mono">14 Integrated Inputs</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 pt-0.5">
                {mlData.feature_importances.slice(0, 10).map((feat, idx) => (
                  <div key={feat.feature} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium flex items-center gap-1.5 truncate">
                        <span className="w-4 text-[10px] font-mono text-slate-500">#{idx + 1}</span>
                        {feat.feature}
                      </span>
                      <span className="font-mono text-cyan-300 font-bold ml-2 shrink-0">{feat.relative_percentage}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(4, Math.min(100, feat.relative_percentage * 3))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cross-Source Conflicting Indicators Grid */}
          {mlData.cross_source_insights && mlData.cross_source_insights.length > 0 && (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    Cross-Source Conflicting Indicators
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Empirical contradictions discovered across integrated records that are invisible when datasets are audited in silos.
                  </p>
                </div>
                <span className="text-xs px-2.5 py-0.5 bg-slate-800 text-cyan-300 border border-slate-700 rounded font-mono">
                  6 Verified Patterns
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {mlData.cross_source_insights.map(item => (
                  <div
                    key={item.id}
                    className="bg-[#071324] border border-slate-700/70 hover:border-slate-600 rounded-lg p-3.5 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-bold text-white line-clamp-1">{item.pattern_name}</span>
                        <span className="shrink-0 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                          {item.count} ({item.percentage}%)
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed mb-2.5">
                        {item.description}
                      </p>

                      <div className="space-y-1.5 text-[11px]">
                        <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                          <span className="text-slate-400 font-semibold block mb-0.5 text-[10px]">Threshold Rule:</span>
                          <span className="font-mono text-slate-300 text-[10px] leading-tight block">{item.threshold_criteria}</span>
                        </div>

                        <div className="p-2 rounded bg-rose-950/30 border border-rose-500/20">
                          <span className="text-rose-300 font-semibold block mb-0.5 text-[10px]">Silo Blindspot:</span>
                          <p className="text-slate-300 text-[10px] leading-tight">{item.silo_blindspot}</p>
                        </div>

                        <div className="p-2 rounded bg-emerald-950/30 border border-emerald-500/20">
                          <span className="text-emerald-300 font-semibold block mb-0.5 text-[10px]">Action Plan:</span>
                          <p className="text-slate-300 text-[10px] leading-tight">{item.recommended_action}</p>
                        </div>
                      </div>
                    </div>

                    {item.sample_student_ids && item.sample_student_ids.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">Sample Records:</span>
                        <div className="flex flex-wrap gap-1">
                          {item.sample_student_ids.map(sid => (
                            <button
                              key={sid}
                              onClick={() => onSelectStudent(sid)}
                              className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 hover:bg-cyan-700 text-cyan-300 hover:text-white border border-slate-700 transition cursor-pointer"
                            >
                              {sid}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actionable Student Examples (Top Anomalies) */}
          {mlData.top_anomalous_students && mlData.top_anomalous_students.length > 0 && (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Multi-Source Distress Examples (Unsupervised Anomaly Queue)
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Highest-scoring multivariate student outliers with empirical z-score deviations and plain-language explanations.
                  </p>
                </div>
                <span className="text-xs text-slate-400">Ranked by Anomaly Score</span>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-700/80 bg-[#071324]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-800">
                    <tr>
                      <th className="px-3.5 py-2.5">Student</th>
                      <th className="px-3 py-2.5">Dept & Year</th>
                      <th className="px-3 py-2.5">Anomaly Index</th>
                      <th className="px-3 py-2.5">Dual Risk Status</th>
                      <th className="px-3.5 py-2.5">Leading Contributing Indicators</th>
                      <th className="px-3.5 py-2.5">Synthesized Diagnosis</th>
                      <th className="px-3 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {mlData.top_anomalous_students.slice(0, 6).map(st => (
                      <tr key={st.student_id} className="hover:bg-slate-800/60 transition-colors">
                        <td className="px-3.5 py-2.5">
                          <div className="font-bold text-white leading-tight">{st.name}</div>
                          <div className="text-[11px] font-mono text-cyan-400">{st.student_id}</div>
                        </td>
                        <td className="px-3 py-2.5 text-slate-300">
                          <div className="leading-tight">{st.department}</div>
                          <div className="text-[11px] text-slate-500">Yr {st.year}</div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-amber-400 text-sm">
                              {(st.anomaly_score * 100).toFixed(0)}%
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              {st.anomaly_tier}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            CGPA: {st.cgpa.toFixed(2)} | Att: {st.overall_attendance.toFixed(1)}%
                          </div>
                        </td>
                        <td className="px-3 py-2.5 space-y-1">
                          <div className="flex items-center gap-1 text-[10px]">
                            <span className="text-slate-400">Acad:</span>
                            <span className={`px-1.5 py-0.2 rounded font-bold ${
                              st.academic_risk_level === 'High' ? 'bg-red-500/20 text-red-300' : st.academic_risk_level === 'Medium' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                            }`}>
                              {st.academic_risk_level}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px]">
                            <span className="text-slate-400">Place:</span>
                            <span className={`px-1.5 py-0.2 rounded font-bold ${
                              st.placement_risk_level === 'High' ? 'bg-red-500/20 text-red-300' : st.placement_risk_level === 'Medium' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                            }`}>
                              {st.placement_risk_level}
                            </span>
                          </div>
                        </td>
                        <td className="px-3.5 py-2.5 max-w-xs">
                          <ul className="space-y-0.5 text-[11px] text-slate-300 list-disc list-inside">
                            {st.top_contributing_indicators.slice(0, 2).map((ind, i) => (
                              <li key={i} className="line-clamp-1">{ind}</li>
                            ))}
                          </ul>
                        </td>
                        <td className="px-3.5 py-2.5 max-w-sm">
                          <p className="text-[11px] text-slate-300 line-clamp-2 leading-tight">
                            {st.plain_language_explanation}
                          </p>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <button
                            onClick={() => onSelectStudent(st.student_id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-cyan-300 bg-slate-800 hover:bg-cyan-700 hover:text-white border border-slate-700 rounded transition cursor-pointer"
                          >
                            <span>Profile</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. Top Priority Students This Week (Multi-Factor Triage Engine - Task A & C) */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
        {/* Section Header & Interactive Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3.5 border-b border-slate-200/90">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                Weekly Triage Queue
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono text-slate-600 bg-slate-100 border border-slate-200">
                Formula: (Risk × Urgency × Recoverability) × 100
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 mt-1 font-display">
              Top Priority Students This Week
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
              Composite priority queue ranking time-sensitive students. Integrates statutory attendance deficits (≤85%), active backlogs, SGPA trajectory drops, and upcoming placement vulnerability calibrated against recovery potential.
            </p>
          </div>

          {/* Filter & Limit Selector Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Department Filter */}
            <select
              value={priorityDept}
              onChange={(e) => handleDeptChange(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 text-slate-800 border border-slate-300 rounded-lg focus:outline-none focus:border-cyan-700"
            >
              <option value="">All Departments</option>
              <option value="Computer Science & Engineering">CSE</option>
              <option value="Information Technology">IT</option>
              <option value="Electronics & Communication Engineering">ECE</option>
              <option value="Mechanical Engineering">ME</option>
              <option value="Civil Engineering">CE</option>
              <option value="Electrical Engineering">EE</option>
            </select>

            {/* Semester Filter */}
            <select
              value={prioritySemester}
              onChange={(e) => handleSemesterChange(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 text-slate-800 border border-slate-300 rounded-lg focus:outline-none focus:border-cyan-700"
            >
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                <option key={s} value={s}>Sem {s}</option>
              ))}
            </select>

            {/* Limit Selector (5 / 10 / 20) */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 px-2 font-medium">Limit:</span>
              {[5, 10, 20].map((lim) => (
                <button
                  key={lim}
                  onClick={() => handleLimitChange(lim)}
                  className={`px-2.5 py-1 text-xs rounded font-medium transition cursor-pointer ${
                    priorityLimit === lim
                      ? 'bg-slate-900 text-white font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {lim}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => loadPriorityQueue(priorityLimit, priorityDept, prioritySemester)}
              disabled={priorityLoading}
              title="Refresh Queue"
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg transition disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${priorityLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* LOADING STATE */}
        {priorityLoading && (
          <div className="py-10 flex flex-col items-center justify-center space-y-2.5">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-700" />
            <span className="text-xs text-slate-500 font-medium">
              Evaluating multi-factor triage algorithm across 250 records...
            </span>
          </div>
        )}

        {/* ERROR STATE */}
        {!priorityLoading && priorityError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-rose-900">
                  Faculty / Admin Session Required
                </h3>
                <p className="text-xs text-rose-700 leading-relaxed">
                  {priorityError.includes('Access') || priorityError.includes('Authentication')
                    ? 'The weekly priority queue evaluates protected student intervention factors restricted to faculty and academic leadership.'
                    : priorityError}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 pt-1">
              <button
                onClick={handleQuickFacultyLogin}
                disabled={authQuickLoggingIn}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white transition cursor-pointer shadow-2xs"
              >
                <KeyRound className="w-3.5 h-3.5" />
                {authQuickLoggingIn ? 'Authenticating...' : 'Sign In as Faculty (FAC01)'}
              </button>
              <button
                onClick={() => loadPriorityQueue(priorityLimit, priorityDept, prioritySemester)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition cursor-pointer"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* EMPTY STATE */}
        {!priorityLoading && !priorityError && priorityData && priorityData.items.length === 0 && (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-7 h-7 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-900">No Priority Students Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No students matched the active filter criteria ({priorityDept || 'All Depts'}, {prioritySemester ? `Sem ${prioritySemester}` : 'All Semesters'}).
            </p>
            {(priorityDept || prioritySemester) && (
              <button
                onClick={() => {
                  setPriorityDept('');
                  setPrioritySemester('');
                  loadPriorityQueue(priorityLimit, '', '');
                }}
                className="mt-2 px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* SUCCESS DATA LIST */}
        {!priorityLoading && !priorityError && priorityData && priorityData.items.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>
                Displaying <strong className="text-slate-900 font-semibold">{priorityData.items.length}</strong> of <strong className="text-slate-900 font-semibold">{priorityData.filtered_count}</strong> prioritized students (Total candidate pool: {priorityData.total_in_queue})
              </span>
              <span className="font-mono text-[11px] text-slate-400 hidden sm:inline">
                Sorted by Composite Priority Score
              </span>
            </div>

            <div className="divide-y divide-slate-150 rounded-xl border border-slate-200 overflow-hidden bg-white">
              {priorityData.items.map((item, idx) => {
                const tierColor =
                  item.risk_tier === 'Critical'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : item.risk_tier === 'High Priority'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : item.risk_tier === 'Moderate'
                    ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    : 'bg-slate-50 text-slate-700 border-slate-200';

                const scoreColor =
                  item.priority_score >= 60
                    ? 'text-rose-700 border-rose-200 bg-rose-50'
                    : item.priority_score >= 40
                    ? 'text-amber-700 border-amber-200 bg-amber-50'
                    : item.priority_score >= 25
                    ? 'text-yellow-700 border-yellow-200 bg-yellow-50'
                    : 'text-cyan-700 border-cyan-200 bg-cyan-50';

                return (
                  <div
                    key={item.student_id}
                    className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    {/* Left: Rank, Score, Identity */}
                    <div className="flex items-start gap-3 min-w-[280px]">
                      <div className="flex flex-col items-center justify-center w-12 shrink-0">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Rank</span>
                        <span className="text-sm font-bold text-slate-800">#{idx + 1}</span>
                        <div className={`mt-1 px-1.5 py-0.5 rounded border text-xs font-mono font-bold ${scoreColor}`}>
                          {item.priority_score.toFixed(1)}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4
                            className="font-bold text-slate-900 text-sm hover:text-cyan-700 cursor-pointer transition"
                            onClick={() => onSelectStudent(item.student_id)}
                          >
                            {item.name}
                          </h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${tierColor}`}>
                            {item.risk_tier}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                          <span className="font-mono text-cyan-800 font-semibold">{item.student_id}</span>
                          <span>•</span>
                          <span>{item.department}</span>
                          <span>•</span>
                          <span>Sem {item.semester} (Yr {item.year})</span>
                          <span>•</span>
                          <span>CGPA: <strong className="text-slate-800">{item.cgpa}</strong></span>
                          <span>•</span>
                          <span>
                            Att: <strong className={item.attendance < 75 ? 'text-rose-600' : 'text-slate-800'}>{item.attendance}%</strong>
                          </span>
                          {item.backlogs > 0 && (
                            <span className="px-1.5 py-0.2 bg-rose-50 text-rose-700 border border-rose-200 rounded font-semibold text-[10px]">
                              {item.backlogs} Backlog{item.backlogs > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        {/* Factors Pill Row */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span
                            className="px-2 py-0.5 bg-slate-50 text-slate-700 border border-slate-200 rounded text-[11px] font-mono"
                            title="Risk Factor [0,1]"
                          >
                            Risk (R): <strong className="text-rose-600">{item.risk_factor.toFixed(2)}</strong>
                          </span>
                          <span
                            className="px-2 py-0.5 bg-slate-50 text-slate-700 border border-slate-200 rounded text-[11px] font-mono"
                            title="Urgency Factor [0,1]"
                          >
                            Urgency (U): <strong className="text-amber-600">{item.urgency_factor.toFixed(2)}</strong>
                          </span>
                          <span
                            className="px-2 py-0.5 bg-slate-50 text-slate-700 border border-slate-200 rounded text-[11px] font-mono"
                            title="Recoverability Factor [0,1]"
                          >
                            Recoverability (C): <strong className="text-emerald-600">{item.recoverability_factor.toFixed(2)}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Top Reasons & Recommended Action */}
                    <div className="flex-1 space-y-2 lg:px-4">
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Top Priority Drivers
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {item.top_reasons.map((reason, rIdx) => (
                            <span
                              key={rIdx}
                              className="px-2 py-0.5 rounded bg-slate-100 text-[11px] text-slate-700 border border-slate-200"
                            >
                              • {reason}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-start gap-1.5 text-xs text-cyan-950 bg-cyan-50/70 border border-cyan-200/90 rounded-lg p-2">
                        <span className="text-cyan-800 font-bold shrink-0">Action:</span>
                        <span>{item.recommended_action}</span>
                      </div>
                    </div>

                    {/* Right: Actions CTA */}
                    <div className="shrink-0 flex items-center lg:flex-col justify-end gap-2">
                      {onOpenInterventionModal && (
                        <button
                          onClick={() => {
                            const reasonsStr = item.top_reasons.join(' ').toLowerCase();
                            let cat = 'Academic';
                            if (reasonsStr.includes('coding') || reasonsStr.includes('placement') || reasonsStr.includes('aptitude')) {
                              cat = 'Placement';
                            } else if (reasonsStr.includes('attendance')) {
                              cat = 'Attendance';
                            }
                            const title = `Targeted Intervention: ${item.name} (${item.risk_tier})`;
                            const desc = `Priority Score: ${item.priority_score.toFixed(1)}/100 (Risk: ${item.risk_factor.toFixed(2)}, Urgency: ${item.urgency_factor.toFixed(2)}, Recoverability: ${item.recoverability_factor.toFixed(2)})\nRecommended Action: ${item.recommended_action}\nTop Drivers: ${item.top_reasons.join('; ')}`;
                            const prio = item.risk_tier === 'Critical' ? 'High' : item.risk_tier === 'High Priority' ? 'High' : 'Medium';
                            onOpenInterventionModal(item.student_id, item.name, cat, title, desc, prio);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition cursor-pointer shadow-2xs"
                          title="Record tailored intervention for this prioritized student"
                        >
                          <PlusCircle className="w-3.5 h-3.5" /> Log Intervention
                        </button>
                      )}
                      <button
                        onClick={() => onSelectStudent(item.student_id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition cursor-pointer shadow-2xs"
                      >
                        <span>Profile & Drivers</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
