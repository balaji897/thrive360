import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  AlertTriangle,
  LifeBuoy,
  TrendingUp,
  LogOut,
  RefreshCw,
  Search,
  ChevronRight,
  CheckCircle2,
  X,
  Clock,
  Calendar as CalendarIcon,
  Plus,
  Bell,
  Sliders,
  Sparkles,
  ArrowUpRight,
  GraduationCap,
  ChevronLeft,
  Filter,
  Check
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import { FacultyDashboardData } from '../types';
import { api } from '../services/api';

interface FacultyDashboardPageProps {
  onLogout: () => void;
  onNavigateToStudentDetail?: (studentId: string) => void;
}

export const FacultyDashboardPage: React.FC<FacultyDashboardPageProps> = ({
  onLogout,
  onNavigateToStudentDetail
}) => {
  const [data, setData] = useState<FacultyDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [directoryFilter, setDirectoryFilter] = useState<'all' | 'high_risk' | 'low_attendance'>('all');
  const [calendarMonth, setCalendarMonth] = useState('October 2026');
  const [performanceView, setPerformanceView] = useState<'students' | 'attendance'>('students');
  const [financePeriod, setFinancePeriod] = useState<'monthly' | 'weekly'>('weekly');

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getFacultyDashboard();
      setData(res);
    } catch (err: any) {
      console.error('Failed to load faculty dashboard:', err);
      setError(err.message || 'Unable to load authorized faculty dashboard. Please log in again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const totalCount = data?.authorized_students.length || 0;
  const highRiskCount = useMemo(() => {
    return data?.authorized_students.filter(s => s.academic_risk === 'High').length || 0;
  }, [data]);
  const lowAttendanceCount = useMemo(() => {
    return data?.authorized_students.filter(s => s.attendance < 75).length || 0;
  }, [data]);

  const highAcademicRiskPct = useMemo(() => {
    if (!data?.cohort_total_students) return '0.0';
    return ((data.cohort_high_academic_risk / data.cohort_total_students) * 100).toFixed(1);
  }, [data]);

  const lowAttendancePct = useMemo(() => {
    if (!data?.authorized_students?.length) return '0.0';
    return ((lowAttendanceCount / data.authorized_students.length) * 100).toFixed(1);
  }, [data, lowAttendanceCount]);

  const riskDist = useMemo(() => {
    if (!data?.cohort_risk_distribution) {
      return { High: 0, Medium: 0, Low: 0, total: 0, highPct: '0.0', medPct: '0.0', lowPct: '0.0' };
    }
    const high = data.cohort_risk_distribution['High'] || 0;
    const med = data.cohort_risk_distribution['Medium'] || 0;
    const low = data.cohort_risk_distribution['Low'] || 0;
    const total = high + med + low || Math.max(1, data.cohort_total_students);
    return {
      High: high,
      Medium: med,
      Low: low,
      total,
      highPct: ((high / total) * 100).toFixed(1),
      medPct: ((med / total) * 100).toFixed(1),
      lowPct: ((low / total) * 100).toFixed(1),
    };
  }, [data]);

  // Dynamic trend data for the "School Performance" multi-line spline chart
  const performanceTrendData = useMemo(() => {
    const baseScore = data?.cohort_average_score || 72;
    return [
      { week: 'Week 01', students: Math.round(baseScore * 0.75), attendance: 78 },
      { week: 'Week 02', students: Math.round(baseScore * 0.88), attendance: 82 },
      { week: 'Week 03', students: Math.round(baseScore * 0.82), attendance: 75 },
      { week: 'Week 04', students: Math.round(baseScore * 0.95), attendance: 86 },
      { week: 'Week 05', students: Math.round(baseScore * 0.89), attendance: 80 },
      { week: 'Week 06', students: Math.round(baseScore * 1.02), attendance: 89 },
      { week: 'Week 07', students: Math.round(baseScore * 0.92), attendance: 84 },
      { week: 'Week 08', students: Math.round(baseScore), attendance: 88 },
    ];
  }, [data]);

  // Dynamic multi-wave data for the "School Analytics / Risk Trends" chart
  const weeklyRiskTrendData = useMemo(() => {
    return [
      { day: 'Sun', lowRisk: 62, highRisk: 22 },
      { day: 'Mon', lowRisk: 74, highRisk: 28 },
      { day: 'Tue', lowRisk: 69, highRisk: 24 },
      { day: 'Wed', lowRisk: 85, highRisk: 18 },
      { day: 'Thu', lowRisk: 78, highRisk: 22 },
      { day: 'Fri', lowRisk: 92, highRisk: 15 },
      { day: 'Sat', lowRisk: 88, highRisk: 17 },
    ];
  }, []);

  const filteredStudents = useMemo(() => {
    if (!data) return [];
    return data.authorized_students.filter(s => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.department.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (directoryFilter === 'high_risk') {
        return s.academic_risk === 'High';
      }
      if (directoryFilter === 'low_attendance') {
        return s.attendance < 75;
      }
      return true;
    });
  }, [data, searchTerm, directoryFilter]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-3 border-[#5B52E0]/20 border-t-[#5B52E0] rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500">
          Loading Edu-Center Workspace...
        </p>
      </div>
    );
  }

  if (error || !data) {
    const isAuthFailure =
      error?.toLowerCase().includes('not authenticated') ||
      error?.toLowerCase().includes('expired') ||
      error?.includes('401');

    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white border border-slate-100 rounded-3xl text-center space-y-4 shadow-xl">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="font-display text-lg font-bold text-[#1E1B4B]">
          {isAuthFailure ? 'Authentication Required' : 'Faculty Authorization Error'}
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          {isAuthFailure
            ? 'Your active session has expired or requires faculty credentials. Please sign in to access your cohort analytics.'
            : error?.toLowerCase().includes('not found')
            ? 'Faculty governance records or endpoint could not be located. Please verify faculty credentials.'
            : error}
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            onClick={fetchDashboard}
            className="px-4 py-2 bg-[#F4F5F9] hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry Request
          </button>
          <button
            onClick={onLogout}
            className="px-5 py-2 bg-[#5B52E0] hover:bg-[#4E46E5] text-white rounded-2xl text-xs font-bold transition shadow-md shadow-indigo-500/20 cursor-pointer"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Edu-Center Top Navigation Row (Search + Action Icons) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        {/* Search Bar (Edu-Center Model) */}
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3" />
          <input
            type="text"
            placeholder="Search here..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-[#F4F5F9] border border-transparent rounded-2xl text-xs text-[#1E1B4B] placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#5B52E0] transition"
          />
        </div>

        {/* Right Action Icons & User Mini-Profile */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button
            onClick={fetchDashboard}
            title="Refresh Analytics"
            className="w-9 h-9 rounded-2xl bg-[#F4F5F9] hover:bg-slate-200/70 flex items-center justify-center text-slate-500 hover:text-[#5B52E0] transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="relative">
            <button
              title="Notifications"
              className="w-9 h-9 rounded-2xl bg-[#F4F5F9] hover:bg-slate-200/70 flex items-center justify-center text-slate-500 hover:text-[#5B52E0] transition cursor-pointer"
            >
              <Bell className="w-4 h-4" />
            </button>
            <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-2 right-2 ring-2 ring-white" />
          </div>

          <div className="flex items-center gap-2 pl-2 pr-3 py-1 bg-[#F4F5F9] rounded-2xl">
            <div className="w-7 h-7 rounded-xl bg-[#5B52E0] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {data.faculty_name.charAt(0) || 'F'}
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-[#1E1B4B] leading-tight">
                {data.faculty_name}
              </p>
              <p className="text-[10px] text-slate-400 leading-tight">
                {data.designation}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Dashboard Header Banner Row (Title + Period Selector + New Action Plan) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-[#1E1B4B] tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Hi, Welcome to Thrive360 Edu-Center Dashboard.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Change Period Pill */}
          <div className="flex items-center gap-2 px-3.5 py-2 bg-[#F4F5F9] rounded-2xl text-xs text-slate-600 font-semibold cursor-pointer hover:bg-slate-200/70 transition">
            <CalendarIcon className="w-3.5 h-3.5 text-[#5B52E0]" />
            <span>Change Period: Fall 2026</span>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={() => {
              const el = document.getElementById('urgent-priority-queue');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#5B52E0] hover:bg-[#4E46E5] text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-500/25 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Action Plan</span>
          </button>
        </div>
      </div>

      {/* 3. Top Metrics Row: 4 Metric Cards + Knowledge/AI Promo Card (Edu-Center Model) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: 4 Metric Cards (8 columns) */}
        <div className="lg:col-span-7 xl:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: Total Students */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-2xl sm:text-3xl font-extrabold text-[#1E1B4B] tracking-tight">
                  {data.cohort_total_students}
                </p>
                <p className="text-xs font-semibold text-slate-400 mt-1">Total Students</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-[#5B52E0] flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-50 flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" /> +5.5%
              </span>
              <span className="text-[11px] text-slate-400">than last month</span>
            </div>
          </div>

          {/* Card 2: Cohort Mean Score */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-2xl sm:text-3xl font-extrabold text-[#1E1B4B] tracking-tight">
                  {data.cohort_average_score.toFixed(1)}
                  <span className="text-xs font-normal text-slate-400 ml-1">/ 100</span>
                </p>
                <p className="text-xs font-semibold text-slate-400 mt-1">Cohort Mean Score</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-50 flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" /> +2.1%
              </span>
              <span className="text-[11px] text-slate-400">than benchmark</span>
            </div>
          </div>

          {/* Card 3: High Academic Risk */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-2xl sm:text-3xl font-extrabold text-rose-600 tracking-tight">
                  {data.cohort_high_academic_risk}
                </p>
                <p className="text-xs font-semibold text-slate-400 mt-1">High Academic Risk</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-50 flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg">
                {highAcademicRiskPct}%
              </span>
              <span className="text-[11px] text-slate-400">requires triage</span>
            </div>
          </div>

          {/* Card 4: Active Action Plans */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-2xl sm:text-3xl font-extrabold text-[#5B52E0] tracking-tight">
                  {data.assigned_interventions.length}
                </p>
                <p className="text-xs font-semibold text-slate-400 mt-1">Active Action Plans</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-[#5B52E0] flex items-center justify-center shrink-0">
                <LifeBuoy className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-50 flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-[#5B52E0] bg-indigo-50 px-2 py-0.5 rounded-lg">
                Active
              </span>
              <span className="text-[11px] text-slate-400">mentor assigned</span>
            </div>
          </div>
        </div>

        {/* Right: Feature / Promo Banner (Edu-Center Model) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-gradient-to-br from-[#F5F4FE] via-[#ECEBFA] to-[#E2E0FA] rounded-3xl p-6 border border-[#DCD9F5] flex flex-col justify-between relative overflow-hidden shadow-xs">
          <div className="space-y-2 z-10 max-w-[260px]">
            <h3 className="font-display font-extrabold text-base text-[#1E1B4B] leading-snug">
              Increase your Knowledge By Learning!
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              We have integrated real-time ML risk predictors and deterministic governance to accelerate cohort outcomes.
            </p>
          </div>

          <div className="pt-4 z-10">
            <button
              onClick={() => {
                const el = document.getElementById('urgent-priority-queue');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-5 py-2.5 bg-[#5B52E0] hover:bg-[#4E46E5] text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-500/30 transition cursor-pointer"
            >
              Ok! Take me there
            </button>
          </div>

          {/* Decorative Illustration Graphic */}
          <div className="absolute right-3 -bottom-2 opacity-90 pointer-events-none">
            <div className="w-28 h-28 rounded-full bg-white/40 flex items-center justify-center p-3">
              <GraduationCap className="w-16 h-16 text-[#5B52E0]/40" />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Middle Section: School Performance Multi-Line Chart & Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: School Performance Chart (7 or 8 columns) */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-display text-sm font-extrabold text-[#1E1B4B]">
                School Performance
              </h2>
              <p className="text-[11px] text-slate-400">
                Cohort score trends & attendance fidelity
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 text-xs font-semibold">
                <button
                  onClick={() => setPerformanceView('students')}
                  className={`flex items-center gap-1.5 transition cursor-pointer ${
                    performanceView === 'students' ? 'text-[#1E1B4B]' : 'text-slate-400'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#5B52E0]" />
                  <span>Students</span>
                </button>
                <button
                  onClick={() => setPerformanceView('attendance')}
                  className={`flex items-center gap-1.5 transition cursor-pointer ${
                    performanceView === 'attendance' ? 'text-[#1E1B4B]' : 'text-slate-400'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                  <span>Attendance</span>
                </button>
              </div>

              <span className="text-xs px-3 py-1 bg-[#F4F5F9] text-slate-600 rounded-xl font-semibold">
                In a Month
              </span>
            </div>
          </div>

          {/* Smooth Spline Curve Chart */}
          <div className="h-56 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5B52E0" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#5B52E0" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="week"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  domain={[40, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E1B4B',
                    borderRadius: '16px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '11px',
                    padding: '8px 12px'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area
                  type="monotone"
                  dataKey="students"
                  stroke="#5B52E0"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#purpleGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="attendance"
                  stroke="#10B981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#tealGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Upcoming Events / Priority Alerts (4 or 5 columns) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-extrabold text-[#1E1B4B]">
              Upcoming Events
            </h2>
            <span className="text-[10px] font-bold text-[#5B52E0] bg-indigo-50 px-2 py-0.5 rounded-lg">
              Priority
            </span>
          </div>

          <div className="space-y-3">
            {/* Event Item 1 */}
            <div className="flex items-center gap-3.5 p-2.5 rounded-2xl bg-[#F8F9FD] border border-slate-100/80">
              <div className="w-12 h-12 rounded-2xl bg-[#5B52E0] text-white flex flex-col items-center justify-center shrink-0 shadow-xs">
                <span className="font-extrabold text-sm leading-none">3</span>
                <span className="text-[9px] uppercase tracking-wider font-semibold opacity-80 mt-0.5">Wed</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#1E1B4B] truncate">
                  Midterm Progress Audit
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                  10:00 AM • CSE Dept Room 104
                </p>
              </div>
            </div>

            {/* Event Item 2 */}
            <div className="flex items-center gap-3.5 p-2.5 rounded-2xl bg-[#F8F9FD] border border-slate-100/80">
              <div className="w-12 h-12 rounded-2xl bg-[#10B981] text-white flex flex-col items-center justify-center shrink-0 shadow-xs">
                <span className="font-extrabold text-sm leading-none">28</span>
                <span className="text-[9px] uppercase tracking-wider font-semibold opacity-80 mt-0.5">Fri</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#1E1B4B] truncate">
                  Remedial Doubt-Clearing
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                  02:30 PM • Academic Mentor Lab
                </p>
              </div>
            </div>

            {/* Event Item 3 (High-Risk Student Review Alert) */}
            <div className="flex items-center gap-3.5 p-2.5 rounded-2xl bg-[#FFF8F8] border border-rose-100">
              <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex flex-col items-center justify-center shrink-0 shadow-xs">
                <span className="font-extrabold text-sm leading-none">14</span>
                <span className="text-[9px] uppercase tracking-wider font-semibold opacity-80 mt-0.5">Mon</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-rose-800 truncate">
                  Priority Cohort Review
                </p>
                <p className="text-[10px] text-rose-600 mt-0.5 truncate">
                  {data.urgent_attention_students.length} students requiring review
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              const el = document.getElementById('urgent-priority-queue');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full py-2.5 bg-[#5B52E0] hover:bg-[#4E46E5] text-white rounded-2xl text-xs font-bold transition shadow-md shadow-indigo-500/20 text-center cursor-pointer"
          >
            + View Priority Queue
          </button>
        </div>
      </div>

      {/* 5. Bottom Section: School Event Calendar & School Analytics / Finance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: School Event Calendar (5 columns) */}
        <div className="lg:col-span-5 xl:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-sm font-extrabold text-[#1E1B4B]">
                School Event Calendar
              </h2>
              <p className="text-[11px] text-slate-400">Scheduled academic checkpoints</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#F4F5F9] rounded-xl text-xs font-bold text-[#1E1B4B]">
              <span>{calendarMonth}</span>
            </div>
          </div>

          {/* Interactive Visual Calendar Grid (Edu-Center Model) */}
          <div className="space-y-2">
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase">
              <span>S</span>
              <span>M</span>
              <span>T</span>
              <span>W</span>
              <span>T</span>
              <span>F</span>
              <span>S</span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-700">
              {/* Dummy month days with event dots */}
              {[
                { day: 1, dot: false },
                { day: 2, dot: false },
                { day: 3, dot: 'purple' },
                { day: 4, dot: false },
                { day: 5, dot: false },
                { day: 6, dot: false },
                { day: 7, dot: false },
                { day: 8, dot: false },
                { day: 9, dot: false },
                { day: 10, dot: false },
                { day: 11, dot: false },
                { day: 12, dot: 'teal' },
                { day: 13, dot: false },
                { day: 14, dot: 'rose' },
                { day: 15, dot: false },
                { day: 16, dot: false },
                { day: 17, dot: false },
                { day: 18, dot: false },
                { day: 19, dot: false },
                { day: 20, dot: false },
                { day: 21, dot: false },
                { day: 22, dot: false },
                { day: 23, dot: false },
                { day: 24, dot: false },
                { day: 25, dot: false },
                { day: 26, dot: false },
                { day: 27, dot: false },
                { day: 28, dot: 'teal' },
                { day: 29, dot: false },
                { day: 30, dot: false },
                { day: 31, dot: false },
              ].map(item => (
                <div
                  key={item.day}
                  className="py-1.5 rounded-xl hover:bg-[#F4F5F9] transition flex flex-col items-center justify-center cursor-pointer"
                >
                  <span className={item.day === 14 ? 'font-extrabold text-[#5B52E0]' : ''}>
                    {item.day}
                  </span>
                  {item.dot && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                        item.dot === 'purple'
                          ? 'bg-[#5B52E0]'
                          : item.dot === 'teal'
                          ? 'bg-[#10B981]'
                          : 'bg-rose-500'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: School Analytics / Risk Trends (styled after "School Finance" in Edu-Center) */}
        <div className="lg:col-span-7 xl:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-display text-sm font-extrabold text-[#1E1B4B]">
                School Risk & Performance Trends
              </h2>
              <p className="text-[11px] text-slate-400">Cohort triage distribution</p>
            </div>

            <div className="flex items-center gap-1 bg-[#F4F5F9] p-1 rounded-2xl text-xs font-semibold">
              <button
                onClick={() => setFinancePeriod('weekly')}
                className={`px-3 py-1 rounded-xl transition cursor-pointer ${
                  financePeriod === 'weekly' ? 'bg-white text-[#5B52E0] font-bold shadow-2xs' : 'text-slate-500'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setFinancePeriod('monthly')}
                className={`px-3 py-1 rounded-xl transition cursor-pointer ${
                  financePeriod === 'monthly' ? 'bg-white text-[#5B52E0] font-bold shadow-2xs' : 'text-slate-500'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          {/* Metric Badges (Green & Orange) */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 bg-[#F0FDF4] rounded-2xl border border-emerald-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-base font-extrabold text-emerald-900 leading-tight">
                  {riskDist.Low} Students
                </p>
                <p className="text-[10px] text-emerald-700 font-semibold truncate">
                  Low Risk Cohort ({riskDist.lowPct}%)
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#FFF7ED] rounded-2xl border border-amber-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-base font-extrabold text-amber-900 leading-tight">
                  {riskDist.High + riskDist.Medium} Students
                </p>
                <p className="text-[10px] text-amber-700 font-semibold truncate">
                  Attention Needed ({((100 - parseFloat(riskDist.lowPct)) || 0).toFixed(1)}%)
                </p>
              </div>
            </div>
          </div>

          {/* Multi-Wave Area Chart */}
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyRiskTrendData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E1B4B',
                    borderRadius: '16px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '11px',
                    padding: '8px 12px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="lowRisk"
                  stroke="#10B981"
                  strokeWidth={3}
                  fillOpacity={0.15}
                  fill="#10B981"
                />
                <Area
                  type="monotone"
                  dataKey="highRisk"
                  stroke="#F59E0B"
                  strokeWidth={3}
                  fillOpacity={0.15}
                  fill="#F59E0B"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 6. Urgent Cohort Priority Queue (Centerpiece Operational Table) */}
      <div id="urgent-priority-queue" className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-sm font-extrabold text-[#1E1B4B]">
                Urgent Cohort Priority Queue
              </h2>
              <p className="text-[11px] text-slate-400">
                Immediate academic & attendance recovery attention recommended
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 self-start sm:self-auto">
            {data.urgent_attention_students.length} Flagged Students
          </span>
        </div>

        {data.urgent_attention_students.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-[#10B981] mx-auto" />
            <p className="font-bold text-[#1E1B4B]">No urgent cohort flags detected</p>
            <p className="text-slate-400">All students currently meet statutory attendance and academic performance baselines.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F9FD] text-[11px] font-bold text-slate-400 uppercase tracking-wider rounded-2xl">
                <tr>
                  <th className="py-3 px-4 rounded-l-2xl">Student</th>
                  <th className="py-3 px-3">Department / Year</th>
                  <th className="py-3 px-3 text-center">Success Score</th>
                  <th className="py-3 px-3 text-center">Attendance</th>
                  <th className="py-3 px-3 text-center">Academic Risk</th>
                  <th className="py-3 px-4 text-right rounded-r-2xl">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.urgent_attention_students.map((stu, i) => {
                  const hasAttendanceDeficit = stu.attendance < 75;
                  return (
                    <tr
                      key={stu.student_id || i}
                      className="hover:bg-[#F8F9FD] transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#1E1B4B] leading-tight">{stu.name}</div>
                        <div className="font-mono text-[11px] text-[#5B52E0] font-semibold mt-0.5">
                          {stu.student_id}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        <div className="font-medium text-slate-800 leading-tight">{stu.department}</div>
                        <div className="text-[11px] text-slate-400">Year {stu.year}</div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center justify-center gap-2">
                          <span className="font-mono font-bold text-[#1E1B4B] text-xs">
                            {stu.success_score.toFixed(1)}
                          </span>
                          <div className="w-10 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                            <div
                              className="h-full rounded-full bg-[#5B52E0]"
                              style={{ width: `${Math.min(100, Math.max(10, stu.success_score))}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1.5 font-mono">
                          <span className={`text-xs ${hasAttendanceDeficit ? 'font-bold text-rose-600' : 'text-slate-700'}`}>
                            {stu.attendance.toFixed(0)}%
                          </span>
                          {hasAttendanceDeficit && (
                            <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                              Deficit
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-xl text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
                          High Risk
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onNavigateToStudentDetail?.(stu.student_id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#5B52E0] hover:text-white bg-[#5B52E0]/10 hover:bg-[#5B52E0] rounded-xl transition cursor-pointer"
                        >
                          <span>View profile</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 7. Assigned Mentorship Action Plans */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-[#5B52E0]" />
            <h3 className="font-display text-sm font-extrabold text-[#1E1B4B]">
              Assigned Mentorship Action Plans
            </h3>
          </div>
          <span className="text-xs font-bold text-[#5B52E0] bg-indigo-50 px-3 py-1 rounded-xl">
            {data.assigned_interventions.length} Active Items
          </span>
        </div>

        {data.assigned_interventions.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
            No active remedial interventions assigned to your profile.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.assigned_interventions.map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-4 rounded-2xl bg-[#F8F9FD] border border-slate-100 space-y-2 hover:border-[#5B52E0]/40 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => onNavigateToStudentDetail?.(item.student_id)}
                      className="font-mono text-xs text-[#5B52E0] font-bold hover:underline flex items-center gap-1 text-left cursor-pointer"
                    >
                      <span>{item.student_id}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-800 font-sans font-semibold truncate">
                        {item.student_name}
                      </span>
                    </button>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-xl font-bold ${
                      item.priority === 'High'
                        ? 'bg-rose-50 text-rose-700 border border-rose-100'
                        : item.priority === 'Medium'
                        ? 'bg-amber-50 text-amber-700 border border-amber-100'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {item.priority} Priority
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-[#1E1B4B] mt-1.5 leading-snug">
                    {item.title}
                  </h4>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-200/60 mt-1">
                  <span>Status: <strong className="text-slate-700 font-bold">{item.status}</strong></span>
                  <span className="flex items-center gap-1 font-mono text-slate-500">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Due: {item.due_date}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 8. Authorized Student Directory */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-display text-sm font-extrabold text-[#1E1B4B]">
              Authorized Student Directory
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprehensive student profiles in your academic oversight scope. Click any row to review deep diagnostics.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Quick Segment Filter Pills */}
            <div className="inline-flex rounded-2xl border border-slate-200/80 p-0.5 bg-[#F4F5F9] text-xs">
              <button
                onClick={() => setDirectoryFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  directoryFilter === 'all'
                    ? 'bg-white text-[#5B52E0] shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All ({totalCount})
              </button>
              <button
                onClick={() => setDirectoryFilter('high_risk')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  directoryFilter === 'high_risk'
                    ? 'bg-rose-50 text-rose-700 shadow-2xs'
                    : 'text-slate-500 hover:text-rose-600'
                }`}
              >
                High Risk ({highRiskCount})
              </button>
              <button
                onClick={() => setDirectoryFilter('low_attendance')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  directoryFilter === 'low_attendance'
                    ? 'bg-amber-50 text-amber-700 shadow-2xs'
                    : 'text-slate-500 hover:text-amber-600'
                }`}
              >
                Attendance &lt;75% ({lowAttendanceCount})
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F9FD] text-[11px] font-bold text-slate-400 uppercase tracking-wider rounded-2xl">
              <tr>
                <th className="py-3 px-3 rounded-l-2xl">Student ID</th>
                <th className="py-3 px-3">Name</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3 text-center">CGPA</th>
                <th className="py-3 px-3 text-center">Attendance</th>
                <th className="py-3 px-3 text-center">Success Score</th>
                <th className="py-3 px-3 text-center">Academic Risk</th>
                <th className="py-3 px-3 text-center">Placement Risk</th>
                <th className="py-3 px-3 text-right rounded-r-2xl">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No students match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, idx) => (
                  <tr
                    key={s.student_id || idx}
                    className="hover:bg-[#F8F9FD] transition-colors"
                  >
                    <td className="py-3 px-3 font-mono font-bold text-[#5B52E0]">{s.student_id}</td>
                    <td className="py-3 px-3 font-bold text-[#1E1B4B]">{s.name}</td>
                    <td className="py-3 px-3 text-slate-600">{s.department}</td>
                    <td className="py-3 px-3 text-center font-mono text-slate-800">{s.cgpa.toFixed(2)}</td>
                    <td className="py-3 px-3 text-center font-mono">
                      <span className={s.attendance < 75 ? 'text-rose-600 font-bold' : 'text-slate-800'}>
                        {s.attendance.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-[#1E1B4B]">{s.success_score.toFixed(1)}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-xl text-[10px] font-bold ${
                        s.academic_risk === 'High'
                          ? 'bg-rose-50 text-rose-700'
                          : s.academic_risk === 'Medium'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {s.academic_risk}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-xl text-[10px] font-bold ${
                        s.placement_risk === 'High'
                          ? 'bg-rose-50 text-rose-700'
                          : s.placement_risk === 'Medium'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {s.placement_risk}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onNavigateToStudentDetail?.(s.student_id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#5B52E0] hover:text-white bg-[#5B52E0]/10 hover:bg-[#5B52E0] rounded-xl transition cursor-pointer"
                      >
                        <span>View profile</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <span>Campus-wide student profile access enabled across authorized departments.</span>
          <span className="font-bold text-slate-600">Showing {filteredStudents.length} of {data.cohort_total_students} students</span>
        </div>
      </div>
    </div>
  );
};
