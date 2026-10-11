import React, { useState, useEffect } from 'react';
import {
  Award,
  Calendar,
  BookOpen,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  LifeBuoy,
  LogOut,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { StudentDashboardData } from '../types';
import { api } from '../services/api';

interface StudentDashboardPageProps {
  onLogout: () => void;
}

export const StudentDashboardPage: React.FC<StudentDashboardPageProps> = ({ onLogout }) => {
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getStudentDashboard();
      setData(res);
    } catch (err: any) {
      console.error('Failed to load student dashboard:', err);
      setError(err.message || 'Unable to load private student dashboard. Please log in again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-cyan-700/20 border-t-cyan-700 rounded-full animate-spin" />
        <p className="text-xs font-medium text-slate-500">
          Loading Student 360° Profile...
        </p>
      </div>
    );
  }

  if (error || !data) {
    const isAuthFailure = error?.toLowerCase().includes('not authenticated') ||
      error?.toLowerCase().includes('expired') ||
      error?.includes('401');

    return (
      <div className="max-w-xl mx-auto my-12 p-6 bg-white border border-rose-200 rounded-xl text-center space-y-3 shadow-xs">
        <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto" />
        <h2 className="font-display text-lg font-bold text-slate-900">
          {isAuthFailure ? 'Authentication Required' : 'Access Verification Error'}
        </h2>
        <p className="text-xs text-rose-700 leading-relaxed">
          {isAuthFailure
            ? 'Your active session has expired or requires authentication. Please log in to view your verified student profile.'
            : (error?.toLowerCase().includes('not found')
                ? 'Student profile records or verification service could not be located. Please verify your student registration.'
                : error)}
        </p>
        <div className="pt-2 flex items-center justify-center gap-2.5">
          <button
            onClick={fetchDashboard}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry Request
          </button>
          <button
            onClick={onLogout}
            className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'High':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      default:
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Student Banner Card */}
      <div className="rounded-xl bg-[#0c1a2e] text-white border border-slate-800 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                {data.student_id}
              </span>
              <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Verified Student Session
              </span>
            </div>

            <h1 className="font-display text-2xl font-bold text-white tracking-tight">
              Welcome back, {data.name}
            </h1>

            <p className="text-xs text-slate-400 flex items-center gap-2">
              <span className="text-slate-300 font-medium">{data.department}</span>
              <span className="text-slate-600">•</span>
              <span>Academic Year {data.year}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchDashboard}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onLogout}
              className="px-3.5 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Success Score Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider">Success Score</span>
            <div className="p-2 rounded-lg bg-slate-100 text-cyan-700 border border-slate-200">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
              {data.success_score.toFixed(1)}
            </span>
            <span className="text-xs text-slate-500 font-mono">/ 100</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Normalized across 6 integrated domains
          </p>
        </div>

        {/* CGPA */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider">Academic CGPA</span>
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
              {data.academics.cgpa.toFixed(2)}
            </span>
            <span className="text-xs text-slate-500 font-mono">/ 10.0</span>
          </div>
          <p className="text-[11px] text-slate-500">Cumulative Grade Point Average</p>
        </div>

        {/* Attendance */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider">Lecture Attendance</span>
            <div className="p-2 rounded-lg bg-slate-100 text-emerald-700 border border-slate-200">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
              {data.academics.overall_attendance.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            {data.academics.overall_attendance >= 75 ? (
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Minimum 75% met
              </span>
            ) : (
              <span className="text-rose-700 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Below 75% requirement
              </span>
            )}
          </div>
        </div>

        {/* Backlogs */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider">Active Backlogs</span>
            <div className="p-2 rounded-lg bg-slate-100 text-amber-700 border border-slate-200">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`font-display text-2xl sm:text-3xl font-bold ${
              data.academics.backlogs > 0 ? 'text-rose-700' : 'text-slate-900'
            }`}>
              {data.academics.backlogs}
            </span>
            <span className="text-xs text-slate-500">subjects</span>
          </div>
          <p className="text-[11px] text-slate-500">
            {data.academics.backlogs === 0 ? 'Zero pending backlogs' : 'Clearance exam required'}
          </p>
        </div>
      </div>

      {/* Dual Risk Diagnostic Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Academic Risk */}
        <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-700" /> Academic Risk Assessment
            </h3>
            <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${getRiskBadge(data.academic_risk.level)}`}>
              {data.academic_risk.level} Risk
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Evaluates backlog burden, lecture attendance patterns, and semester GPA variance.
          </p>
          {data.academic_risk.reasons && data.academic_risk.reasons.length > 0 && (
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Detected Factors:</span>
              <ul className="text-xs text-slate-700 space-y-1">
                {data.academic_risk.reasons.map((r, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-700" /> {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Placement Readiness Risk */}
        <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Laptop className="w-4 h-4 text-cyan-700" /> Placement & Coding Readiness
            </h3>
            <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${getRiskBadge(data.placement_risk.level)}`}>
              {data.placement_risk.level} Risk
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Evaluates technical programming assessments, aptitude mock performance, and recruiter criteria.
          </p>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs text-slate-700">
            <div className="p-2 rounded bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Coding Assessment:</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{data.placement.coding_score ?? 'N/A'}/100</span>
            </div>
            <div className="p-2 rounded bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Aptitude Score:</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{data.placement.aptitude_score ?? 'N/A'}/100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Engagement & LMS Telemetry */}
      <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-3 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
          <Laptop className="w-4 h-4 text-slate-700" /> LMS & Campus Participation Telemetry
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500 block text-[11px]">LMS Login Freq</span>
            <span className="text-lg font-bold text-slate-900 font-mono">{data.lms.login_frequency ?? 0}</span>
            <span className="text-[10px] text-slate-400 block">sessions / month</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500 block text-[11px]">Forum Discussions</span>
            <span className="text-lg font-bold text-slate-900 font-mono">{data.lms.forum_posts ?? 0}</span>
            <span className="text-[10px] text-slate-400 block">posts & replies</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500 block text-[11px]">Campus Events</span>
            <span className="text-lg font-bold text-slate-900 font-mono">{data.activities.events_participated ?? 0}</span>
            <span className="text-[10px] text-slate-400 block">hackathons & seminars</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500 block text-[11px]">Active Clubs</span>
            <span className="text-lg font-bold text-slate-900 font-mono">{data.activities.clubs_joined ?? 0}</span>
            <span className="text-[10px] text-slate-400 block">societies joined</span>
          </div>
        </div>
      </div>

      {/* Interventions & Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Active Interventions */}
        <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <LifeBuoy className="w-4 h-4 text-emerald-600" /> Active Support & Interventions
            </h3>
            <span className="text-xs text-slate-500 font-mono">{data.interventions.length} Assigned</span>
          </div>

          {data.interventions.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
              No active remedial interventions assigned. Academic trajectory is stable.
            </div>
          ) : (
            <div className="space-y-2.5">
              {data.interventions.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 text-xs">{item.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      item.priority === 'High' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {item.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">{item.description}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                    <span>Mentor: <strong className="text-slate-700">{item.assigned_faculty}</strong></span>
                    <span>Due: {item.due_date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Personalized Recommendations */}
        <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-3 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Sparkles className="w-4 h-4 text-amber-600" /> Academic Diagnostic Recommendations
          </h3>

          <div className="space-y-2">
            {data.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <ArrowRight className="w-4 h-4 text-cyan-700 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{rec}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-700" />
            <span>Authenticated Student View: Restricted to Student ID {data.student_id}.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
