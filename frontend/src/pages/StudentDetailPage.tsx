import React, { useEffect, useState } from 'react';
import { UnifiedStudent, SimulationResult } from '../types';
import { api } from '../services/api';
import {
  GraduationCap,
  Briefcase,
  AlertTriangle,
  PlusCircle,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Compass,
  Info,
  Sliders,
  Play,
  RotateCcw,
  Check,
  Clock,
  Award,
  Layers,
  HelpCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

interface StudentDetailPageProps {
  studentId: string;
  onBack: () => void;
  onOpenInterventionModal: (
    studentId: string,
    studentName: string,
    category?: string,
    title?: string,
    description?: string,
    priority?: string
  ) => void;
  onSwitchStudent: (newId: string) => void;
}

export const StudentDetailPage: React.FC<StudentDetailPageProps> = ({
  studentId,
  onBack,
  onOpenInterventionModal,
  onSwitchStudent
}) => {
  const [student, setStudent] = useState<UnifiedStudent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // What-If Simulator States
  const [simAttendance, setSimAttendance] = useState<number>(0);
  const [simAssignment, setSimAssignment] = useState<number>(0);
  const [simCoding, setSimCoding] = useState<number>(0);
  const [simLoading, setSimLoading] = useState<boolean>(false);
  const [simError, setSimError] = useState<string | null>(null);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);

  useEffect(() => {
    loadStudent(studentId);
  }, [studentId]);

  const loadStudent = async (id: string) => {
    setLoading(true);
    setError(null);
    setStudent(null);
    try {
      const data = await api.getStudentDetail(id);
      setStudent(data);
      if (data) {
        setSimAttendance(Math.round(data.academics.overall_attendance * 10) / 10);
        setSimAssignment(Math.round(data.academics.avg_marks * 10) / 10);
        setSimCoding(Math.round(data.placement.coding_score * 10) / 10);
        setSimResult(null);
        setSimError(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load student profile');
    } finally {
      setLoading(false);
    }
  };

  const handleRunSimulation = async () => {
    if (!student) return;
    setSimLoading(true);
    setSimError(null);
    try {
      const res = await api.simulateStudent(student.student_id, {
        attendance: simAttendance,
        assignment_completion: simAssignment,
        coding_score: simCoding
      });
      setSimResult(res);
    } catch (err: any) {
      setSimError(err.message || 'Simulation execution failed');
    } finally {
      setSimLoading(false);
    }
  };

  const handlePreset = (preset: 'compliance' | 'coding' | 'academic' | 'reset') => {
    if (!student) return;
    if (preset === 'compliance') {
      setSimAttendance(85.0);
    } else if (preset === 'coding') {
      setSimCoding(80.0);
    } else if (preset === 'academic') {
      setSimAssignment(90.0);
      setSimAttendance(85.0);
    } else if (preset === 'reset') {
      setSimAttendance(Math.round(student.academics.overall_attendance * 10) / 10);
      setSimAssignment(Math.round(student.academics.avg_marks * 10) / 10);
      setSimCoding(Math.round(student.placement.coding_score * 10) / 10);
      setSimResult(null);
      setSimError(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-8 h-8 border-3 border-cyan-700/20 border-t-cyan-700 rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 font-medium">Loading Student 360° Diagnostic Dossier...</p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="max-w-xl mx-auto my-10 p-6 bg-white border border-rose-200 rounded-xl space-y-3 shadow-2xs text-center">
        <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
        <h2 className="font-display text-base font-bold text-slate-900">Student Profile Not Found</h2>
        <p className="text-xs text-slate-600 leading-relaxed">{error || 'Unable to load profile data.'}</p>
        <div className="pt-2 flex items-center justify-center gap-2">
          <button
            onClick={() => loadStudent(studentId)}
            className="px-3.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
          >
            Retry Loading
          </button>
          <button
            onClick={onBack}
            className="px-3.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg transition cursor-pointer"
          >
            Back to Directory
          </button>
        </div>
      </div>
    );
  }

  // Soft skills radar data
  const softSkillsRadar = [
    { skill: 'Communication', score: student.skills.communication_skills },
    { skill: 'Teamwork', score: student.skills.teamwork },
    { skill: 'Leadership', score: student.skills.leadership },
    { skill: 'Problem Solving', score: student.skills.problem_solving },
    { skill: 'Time Mgmt', score: student.skills.time_management },
  ];

  // Subject marks bar data
  const subjectsData = [
    { subject: 'Maths', marks: student.academics.maths_marks, attendance: student.academics.maths_attendance },
    { subject: 'Physics', marks: student.academics.physics_marks, attendance: student.academics.physics_attendance },
    { subject: 'Programming', marks: student.academics.programming_marks, attendance: student.academics.programming_attendance },
    { subject: 'DBMS', marks: student.academics.dbms_marks, attendance: student.academics.dbms_attendance },
    { subject: 'OS', marks: student.academics.os_marks, attendance: student.academics.os_attendance },
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
      {/* 1. Compact Header & Identity Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/90">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition shadow-2xs cursor-pointer"
            title="Back to Student Directory"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 font-display truncate">
                {student.name}
              </h1>
              <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 text-cyan-800 rounded border border-slate-200 font-bold">
                {student.student_id}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-50 text-slate-700 border border-slate-200">
                {student.primary_segment}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
              <span>{student.department}</span>
              <span className="text-slate-400">•</span>
              <span>Year {student.year}</span>
              <span className="text-slate-400">•</span>
              <span>Student 360° Decision-Support Profile</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {/* Quick Switcher */}
          <select
            value={student.student_id}
            onChange={e => onSwitchStudent(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono font-medium text-slate-700 shadow-2xs focus:outline-none focus:border-cyan-700"
          >
            {Array.from({ length: 250 }, (_, i) => {
              const id = `STU${String(i + 1).padStart(3, '0')}`;
              return <option key={id} value={id}>{id}</option>;
            })}
          </select>

          {/* Log Intervention Action */}
          <button
            onClick={() => {
              const isAcadHigh = student.academic_risk.level === 'High';
              const isPlaceHigh = student.placement_risk.level === 'High';
              const cat = isAcadHigh ? 'Academic' : isPlaceHigh ? 'Placement' : 'Academic';
              const title = `Institutional Intervention: ${student.name} (${cat})`;
              const reasons = [
                ...student.academic_risk.contributing_factors.slice(0, 2),
                ...student.placement_risk.contributing_factors.slice(0, 1)
              ].join('; ');
              const desc = `Success Score: ${student.success_score}/100. Academic Risk: ${student.academic_risk.level} (${student.academic_risk.score}/100), Placement Risk: ${student.placement_risk.level} (${student.placement_risk.score}/100).\nKey Diagnostic Indicators: ${reasons}`;
              const prio = (isAcadHigh || isPlaceHigh) ? 'High' : 'Medium';
              onOpenInterventionModal(student.student_id, student.name, cat, title, desc, prio);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-2xs transition cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Log Intervention</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 Core KPI Hierarchy */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Success Score */}
        <div className="h-full bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Success Score</span>
              <div className="p-1.5 rounded-md bg-slate-100 text-cyan-800 border border-slate-200/80">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                {student.success_score}
              </span>
              <span className="text-xs text-slate-400 font-mono">/ 100</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            Weighted composite across 7 institutional dimensions
          </p>
        </div>

        {/* Academic Risk */}
        <div className="h-full bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Academic Risk</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                student.academic_risk.level === 'High'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : student.academic_risk.level === 'Medium'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {student.academic_risk.level} Risk
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
                CGPA {student.academics.cgpa.toFixed(2)}
              </span>
              <span className="text-xs text-slate-500">
                • {student.academics.overall_attendance}% Att
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            Backlogs: <strong className={student.academics.backlogs > 0 ? 'text-rose-700' : 'text-slate-700'}>{student.academics.backlogs}</strong> • Risk Index: {student.academic_risk.score}/100
          </p>
        </div>

        {/* Placement Risk */}
        <div className="h-full bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Placement Risk</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                student.placement_risk.level === 'High'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : student.placement_risk.level === 'Medium'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {student.placement_risk.level} Risk
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
                Coding {student.placement.coding_score.toFixed(0)}
              </span>
              <span className="text-xs text-slate-500">
                • Apt: {student.placement.aptitude_score.toFixed(0)}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            Mock Interview: {student.placement.mock_interview_avg_score.toFixed(0)} • Risk Index: {student.placement_risk.score}/100
          </p>
        </div>

        {/* Engagement & Activity */}
        <div className="h-full bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Engagement & Skills</span>
              <div className="p-1.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80">
                <GraduationCap className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
                {student.lms.login_frequency} Logins
              </span>
              <span className="text-xs text-slate-500">
                • {student.activities.certifications_count} Certs
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            Events: {student.activities.events_participated} • Soft Skills: {student.skills.soft_skills_avg.toFixed(1)}/100
          </p>
        </div>
      </div>

      {/* 3. Data Trust & Indicator Confidence Scorecard */}
      {student.data_confidence ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-700" />
              <h3 className="text-sm font-bold text-slate-900">
                Data Trust & Indicator Confidence Scorecard
              </h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                student.data_confidence.confidence_tier === 'High Confidence'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {student.data_confidence.confidence_tier}
              </span>
            </div>
            <div className="text-xs font-mono text-slate-600">
              Coverage: <strong className="text-cyan-800 font-bold">{student.data_confidence.confidence_score.toFixed(1)}%</strong> ({student.data_confidence.total_indicators_available}/{student.data_confidence.total_indicators_tracked} Indicators)
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
            <Info className="w-4 h-4 text-cyan-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              <strong className="text-slate-800">Orthogonal Independence:</strong> Data Confidence reflects whether required records exist in campus datasets, not student performance. A student with low CGPA who has submitted all attendance logs achieves high data confidence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {student.data_confidence.indicator_groups.map((grp, idx) => (
              <div key={idx} className="p-3 bg-slate-50/70 border border-slate-200 rounded-lg space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900 truncate">{grp.group_name}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold font-mono ${
                    grp.status === 'Complete'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {grp.indicators_present}/{grp.indicators_total} ({grp.completeness_percentage}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${grp.status === 'Complete' ? 'bg-emerald-600' : 'bg-amber-500'}`}
                    style={{ width: `${grp.completeness_percentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-mono truncate">{grp.source_file}</span>
                  <span className="font-medium text-slate-600">{grp.status}</span>
                </div>
              </div>
            ))}
          </div>

          {student.data_confidence.missing_indicators.length > 0 && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span><strong>Unrecorded Indicators:</strong> {student.data_confidence.missing_indicators.join(' • ')}</span>
            </div>
          )}
        </div>
      ) : student.missing_data_flags.length > 0 ? (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs">
          <HelpCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <span className="font-bold text-amber-900">Dataset Observation Flags:</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {student.missing_data_flags.map((flag, idx) => (
                <span key={idx} className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-medium">
                  • {flag}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* 4. Explainable Score Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Transparent Success Score Breakdown
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Deterministic calculation showing exact point contribution of each dimension to total score ({student.success_score}/100)
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-2 px-3 font-semibold">Performance Dimension</th>
                <th className="py-2 px-3 font-semibold text-center">Configured Weight</th>
                <th className="py-2 px-3 font-semibold text-center">Normalized (0-100)</th>
                <th className="py-2 px-3 font-semibold text-center">Points Contributed</th>
                <th className="py-2 px-3 font-semibold">Evidence & Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {student.score_breakdown.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2 px-3 font-semibold text-slate-900">{row.category}</td>
                  <td className="py-2 px-3 font-mono text-center text-slate-600">{(row.weight * 100).toFixed(0)}%</td>
                  <td className="py-2 px-3 text-center">
                    <span className="font-mono font-bold text-slate-800">{row.normalized_score}</span>
                  </td>
                  <td className="py-2 px-3 font-mono font-bold text-cyan-800 text-center">+{row.weighted_contribution}</td>
                  <td className="py-2 px-3 text-slate-500">{row.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Explainable Score Drivers vs Cohort */}
      {student.drivers && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Explainable Cohort Score Drivers
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  {student.department} Year {student.year} Benchmark
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Empirical point impact computed as weight × (student indicator − relevant cohort mean).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Positive Drivers */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Top Positive Score Drivers (Cohort Advantages)</span>
              </div>
              <div className="space-y-2">
                {student.drivers.top_positive_drivers.map((drv, idx) => (
                  <div key={idx} className="p-3 bg-emerald-50/60 border border-emerald-200/70 rounded-lg space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-900">{drv.category}</span>
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded text-[11px]">
                        +{drv.impact_score.toFixed(2)} pts
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-emerald-800">
                      <span>Student: {drv.student_value.toFixed(1)}</span>
                      <span>•</span>
                      <span>Cohort Avg: {drv.cohort_mean.toFixed(1)}</span>
                      <span>•</span>
                      <span>Dev: +{drv.deviation.toFixed(1)}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed pt-0.5">{drv.explanation}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Negative Drivers */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                <TrendingDown className="w-4 h-4 text-rose-600" />
                <span>Top Negative Score Drivers (Cohort Vulnerabilities)</span>
              </div>
              <div className="space-y-2">
                {student.drivers.top_negative_drivers.map((drv, idx) => (
                  <div key={idx} className="p-3 bg-rose-50/60 border border-rose-200/70 rounded-lg space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-rose-900">{drv.category}</span>
                      <span className="font-mono font-bold text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded text-[11px]">
                        {drv.impact_score.toFixed(2)} pts
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-rose-800">
                      <span>Student: {drv.student_value.toFixed(1)}</span>
                      <span>•</span>
                      <span>Cohort Avg: {drv.cohort_mean.toFixed(1)}</span>
                      <span>•</span>
                      <span>Dev: {drv.deviation.toFixed(1)}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed pt-0.5">{drv.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Institutional Risk Rules Triggered */}
          {student.drivers.triggered_risk_rules.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-800 block mb-2">
                Institutional Risk Rules Triggered ({student.drivers.triggered_risk_rules.length}):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {student.drivers.triggered_risk_rules.map((rule, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                    <span className="text-amber-600 font-bold shrink-0">•</span>
                    <span className="leading-snug">{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. What-If Scenario Simulator & Intervention Projector */}
      <div className="bg-[#0c1a2e] text-white rounded-xl p-5 sm:p-6 border border-slate-800 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-800 text-cyan-300 rounded-lg border border-slate-700 shrink-0">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-white text-sm">What-If Scenario Simulator</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Simulation only — non-destructive
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Simulate hypothetical adjustments to attendance, coursework, and coding. Recomputes composite score and risk rules in real-time.
              </p>
            </div>
          </div>

          <button
            onClick={() => handlePreset('reset')}
            className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            title="Reset to student baseline metrics"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Baseline</span>
          </button>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 text-[11px] font-medium mr-1">Presets:</span>
          <button
            onClick={() => handlePreset('compliance')}
            className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-slate-700 transition text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-cyan-400" /> Statutory 85% Attendance
          </button>
          <button
            onClick={() => handlePreset('coding')}
            className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-slate-700 transition text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-cyan-400" /> Placement Coding 80 pts
          </button>
          <button
            onClick={() => handlePreset('academic')}
            className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-slate-700 transition text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-cyan-400" /> Coursework 90%
          </button>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#071324] p-4 rounded-xl border border-slate-800">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Attendance Rate</span>
              <span className="font-mono text-cyan-300 font-bold">{simAttendance}%</span>
            </div>
            <input
              type="range"
              min="40"
              max="100"
              step="1"
              value={simAttendance}
              onChange={e => setSimAttendance(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Coursework Avg</span>
              <span className="font-mono text-cyan-300 font-bold">{simAssignment}%</span>
            </div>
            <input
              type="range"
              min="30"
              max="100"
              step="1"
              value={simAssignment}
              onChange={e => setSimAssignment(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Coding Score</span>
              <span className="font-mono text-cyan-300 font-bold">{simCoding} pts</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="1"
              value={simCoding}
              onChange={e => setSimCoding(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            onClick={handleRunSimulation}
            disabled={simLoading}
            className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${simLoading ? 'animate-spin' : ''}`} />
            <span>{simLoading ? 'Projecting Outcomes...' : 'Run Simulation'}</span>
          </button>
        </div>

        {simError && (
          <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-lg text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{simError}</span>
          </div>
        )}

        {/* Simulation Results */}
        {simResult && (
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Success Score */}
              <div className="p-3.5 bg-[#071324] border border-slate-700 rounded-lg space-y-1">
                <span className="text-[11px] text-slate-400 uppercase font-semibold block">Composite Score</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-bold font-mono text-white">
                    {simResult.scenario.success_score.toFixed(1)} / 100
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                    simResult.deltas.success_score_delta >= 0
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {simResult.deltas.success_score_delta >= 0 ? '+' : ''}
                    {simResult.deltas.success_score_delta.toFixed(2)} pts
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800 flex justify-between">
                  <span>Baseline: {simResult.baseline.success_score.toFixed(1)}</span>
                  <span>Scenario: {simResult.scenario.success_score.toFixed(1)}</span>
                </div>
              </div>

              {/* Academic Risk */}
              <div className="p-3.5 bg-[#071324] border border-slate-700 rounded-lg space-y-1">
                <span className="text-[11px] text-slate-400 uppercase font-semibold block">Academic Risk</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-bold font-mono text-white">
                    {simResult.scenario.academic_risk_score.toFixed(1)}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                    simResult.deltas.academic_risk_score_delta <= 0
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {simResult.deltas.academic_risk_score_delta <= 0 ? '' : '+'}
                    {simResult.deltas.academic_risk_score_delta.toFixed(1)} pts
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 pt-1 border-t border-slate-800 flex justify-between">
                  <span>Tier Shift:</span>
                  <span className="font-semibold text-cyan-300">{simResult.deltas.academic_tier_transition}</span>
                </div>
              </div>

              {/* Placement Risk */}
              <div className="p-3.5 bg-[#071324] border border-slate-700 rounded-lg space-y-1">
                <span className="text-[11px] text-slate-400 uppercase font-semibold block">Placement Risk</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-bold font-mono text-white">
                    {simResult.scenario.placement_risk_score.toFixed(1)}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                    simResult.deltas.placement_risk_score_delta <= 0
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {simResult.deltas.placement_risk_score_delta <= 0 ? '' : '+'}
                    {simResult.deltas.placement_risk_score_delta.toFixed(1)} pts
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 pt-1 border-t border-slate-800 flex justify-between">
                  <span>Tier Shift:</span>
                  <span className="font-semibold text-cyan-300">{simResult.deltas.placement_tier_transition}</span>
                </div>
              </div>
            </div>

            {/* Causal Explanations */}
            <div className="p-3.5 bg-[#071324] border border-slate-800 rounded-lg space-y-1">
              <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider block">
                Diagnostic & Causal Explanations:
              </span>
              <ul className="space-y-0.5 text-xs text-slate-300">
                {simResult.explanations.map((exp, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span>{exp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* 7. Diagnostic Deep-Dives: Academic vs Placement Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Academic Risk Diagnostic */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-cyan-700" />
              <h3 className="font-bold text-slate-900 text-sm">Academic Risk Diagnosis</h3>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
              student.academic_risk.level === 'High'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : student.academic_risk.level === 'Medium'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {student.academic_risk.level} Risk
            </span>
          </div>

          <div>
            <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Contributing Factors</h4>
            <ul className="space-y-1">
              {student.academic_risk.contributing_factors.map((f, i) => (
                <li key={i} className="text-xs text-slate-700 flex items-start gap-2 bg-slate-50 p-2 rounded-lg">
                  <span className="text-rose-600 font-bold">•</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Recommended Faculty Interventions</h4>
            <ul className="space-y-1">
              {student.academic_risk.recommendations.map((rec, i) => (
                <li key={i} className="text-xs text-emerald-800 flex items-start gap-2 bg-emerald-50 p-2 rounded-lg">
                  <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Placement Risk Diagnostic */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-slate-700" />
              <h3 className="font-bold text-slate-900 text-sm">Placement Readiness Diagnosis</h3>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
              student.placement_risk.level === 'High'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : student.placement_risk.level === 'Medium'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {student.placement_risk.level} Risk
            </span>
          </div>

          <div>
            <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Contributing Factors</h4>
            <ul className="space-y-1">
              {student.placement_risk.contributing_factors.map((f, i) => (
                <li key={i} className="text-xs text-slate-700 flex items-start gap-2 bg-slate-50 p-2 rounded-lg">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Recommended Career & Skill Actions</h4>
            <ul className="space-y-1">
              {student.placement_risk.recommendations.map((rec, i) => (
                <li key={i} className="text-xs text-cyan-900 flex items-start gap-2 bg-cyan-50 p-2 rounded-lg">
                  <Check className="w-3.5 h-3.5 text-cyan-700 mt-0.5 shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 8. Visual Analytics: Marks vs Attendance & Soft Skills Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Subject Marks vs Attendance */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
          <h3 className="font-bold text-slate-900 text-sm mb-0.5">Curriculum Marks vs Attendance</h3>
          <p className="text-xs text-slate-500 mb-3">Exam marks (0-100) and subject attendance (%) across 5 curriculum subjects</p>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectsData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                <XAxis dataKey="subject" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="marks" name="Exam Marks" fill="#0891b2" radius={[3, 3, 0, 0]} />
                <Bar dataKey="attendance" name="Attendance %" fill="#059669" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Soft Skills Radar */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
          <h3 className="font-bold text-slate-900 text-sm mb-0.5">Soft Skills Competency Radar</h3>
          <p className="text-xs text-slate-500 mb-3">5-dimensional behavioral evaluation (Composite Avg: {student.skills.soft_skills_avg.toFixed(1)}/100)</p>

          <div className="h-60 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={softSkillsRadar}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="skill" stroke="#64748b" fontSize={10} />
                <PolarRadiusAxis domain={[0, 100]} stroke="#cbd5e1" fontSize={9} />
                <Radar name="Score" dataKey="score" stroke="#0891b2" fill="#0891b2" fillOpacity={0.3} />
                <Tooltip contentStyle={tooltipStyle} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 9. Activities, Certifications & Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Extracurriculars */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
          <h3 className="font-bold text-slate-900 text-sm">Activities & Certifications</h3>
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-500 block">Events Participated:</span>
              <span className="text-base font-bold text-slate-900">{student.activities.events_participated}</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-500 block">Hackathons Participated:</span>
              <span className="text-base font-bold text-slate-900">
                {student.activities.hackathons_participated} ({student.activities.hackathons_won} Won)
              </span>
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-700 block mb-1">Active Clubs:</span>
            {student.activities.club_names.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {student.activities.club_names.map((c, i) => (
                  <span key={i} className="text-xs bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded font-medium">
                    {c}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-slate-400 italic">No clubs registered</span>
            )}
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-700 block mb-1">Verified Certifications:</span>
            {student.activities.certification_names.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {student.activities.certification_names.map((c, i) => (
                  <span key={i} className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-medium">
                    {c}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-slate-400 italic">No certifications registered</span>
            )}
          </div>
        </div>

        {/* Institutional Feedback */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
          <h3 className="font-bold text-slate-900 text-sm">Student Experience & Feedback Survey</h3>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-2 bg-slate-50 rounded-lg text-center border border-slate-100">
              <span className="text-[11px] text-slate-500 block">Overall Sat.</span>
              <span className="text-base font-bold text-slate-900">{student.feedback.overall_satisfaction} / 5.0</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg text-center border border-slate-100">
              <span className="text-[11px] text-slate-500 block">Teaching Sat.</span>
              <span className="text-base font-bold text-slate-900">{student.feedback.teaching_quality_satisfaction} / 5.0</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg text-center border border-slate-100">
              <span className="text-[11px] text-slate-500 block">Placement Sat.</span>
              <span className="text-base font-bold text-slate-900">{student.feedback.placement_support_satisfaction} / 5.0</span>
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-lg flex items-center justify-between text-xs border border-slate-100">
            <span className="text-slate-600 font-medium">Would Recommend College to Peers:</span>
            <span className={`px-2 py-0.5 rounded font-bold text-xs ${
              student.feedback.would_recommend_college.toLowerCase() === 'yes'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-200 text-slate-700'
            }`}>
              {student.feedback.would_recommend_college}
            </span>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-lg text-xs text-slate-600 space-y-1.5 border border-slate-100">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-800">Faculty Feedback Composite:</span>
              <span className="font-bold text-cyan-800">{student.feedback.faculty_feedback_avg.toFixed(2)} / 5.0</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1 border-t border-slate-200/80">
              <div className="flex justify-between">
                <span className="text-slate-500">Subject Knowledge:</span>
                <span className="font-semibold text-slate-800">{student.feedback.faculty_subject_knowledge}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Communication:</span>
                <span className="font-semibold text-slate-800">{student.feedback.faculty_communication}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Punctuality:</span>
                <span className="font-semibold text-slate-800">{student.feedback.faculty_punctuality}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Doubt Clearing:</span>
                <span className="font-semibold text-slate-800">{student.feedback.faculty_doubt_clearing}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
