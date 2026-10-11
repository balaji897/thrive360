import React, { useState, useEffect } from 'react';
import { StudentSummary } from '../types';
import { api } from '../services/api';
import {
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  AlertCircle,
  Users,
  X
} from 'lucide-react';

interface StudentsPageProps {
  onSelectStudent: (studentId: string) => void;
  initialFilter?: { academic_risk?: string; placement_risk?: string };
}

export const StudentsPage: React.FC<StudentsPageProps> = ({ onSelectStudent, initialFilter }) => {
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState<number | ''>('');
  const [academicRisk, setAcademicRisk] = useState(initialFilter?.academic_risk || '');
  const [placementRisk, setPlacementRisk] = useState(initialFilter?.placement_risk || '');
  const [hasBacklogs, setHasBacklogs] = useState<boolean | ''>('');
  const [sortBy, setSortBy] = useState('student_id');
  const [sortOrder, setSortOrder] = useState('asc');

  // React to initialFilter updates if passed from dashboard navigation
  useEffect(() => {
    if (initialFilter) {
      if (initialFilter.academic_risk !== undefined) {
        setAcademicRisk(initialFilter.academic_risk);
      }
      if (initialFilter.placement_risk !== undefined) {
        setPlacementRisk(initialFilter.placement_risk);
      }
      setPage(1);
    }
  }, [initialFilter]);

  useEffect(() => {
    fetchStudentList();
  }, [page, department, year, academicRisk, placementRisk, hasBacklogs, sortBy, sortOrder]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchStudentList();
    }, 280);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchStudentList = async () => {
    setLoading(true);
    try {
      const res = await api.getStudents({
        search: search || undefined,
        department: department || undefined,
        year: year !== '' ? Number(year) : undefined,
        academic_risk: academicRisk || undefined,
        placement_risk: placementRisk || undefined,
        has_backlogs: hasBacklogs !== '' ? Boolean(hasBacklogs) : undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        page,
        page_size: 15
      });
      setStudents(res.students);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setDepartment('');
    setYear('');
    setAcademicRisk('');
    setPlacementRisk('');
    setHasBacklogs('');
    setSortBy('student_id');
    setSortOrder('asc');
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    search || department || year !== '' || academicRisk || placementRisk || hasBacklogs !== '' || sortBy !== 'student_id' || sortOrder !== 'asc'
  );

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
            <span className="text-[11px] text-slate-500 font-medium">Cohort Directory</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-display">
            Student Analytics Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
            Search, filter, and audit unified diagnostic records across academic performance, attendance, risk strata, and placement preparation.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 shadow-2xs font-medium">
            <Users className="w-3.5 h-3.5 text-cyan-800" />
            <span>Showing <strong className="text-slate-900 font-bold">{students.length}</strong> of <strong className="text-slate-900 font-bold">{total}</strong> Students</span>
          </div>
        </div>
      </div>

      {/* 2. Structured Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
        {/* Primary Filter Row: Search & Key Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by student ID or name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8.5 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-700 focus:bg-white transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Department */}
          <select
            value={department}
            onChange={e => { setDepartment(e.target.value); setPage(1); }}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-cyan-700 focus:bg-white transition"
          >
            <option value="">All Departments</option>
            <option value="IT">IT (Information Technology)</option>
            <option value="CSE">CSE (Computer Science)</option>
            <option value="AI&DS">AI&DS (Artificial Intelligence)</option>
            <option value="ECE">ECE (Electronics & Comm)</option>
            <option value="MECH">MECH (Mechanical)</option>
            <option value="CIVIL">CIVIL (Civil Eng)</option>
          </select>

          {/* Academic Risk */}
          <select
            value={academicRisk}
            onChange={e => { setAcademicRisk(e.target.value); setPage(1); }}
            className={`w-full px-2.5 py-1.5 text-xs border rounded-lg focus:outline-none focus:border-cyan-700 focus:bg-white transition ${
              academicRisk === 'High'
                ? 'bg-rose-50/80 border-rose-300 text-rose-800 font-semibold'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <option value="">Academic Risk: All</option>
            <option value="High">Academic Risk: High</option>
            <option value="Medium">Academic Risk: Medium</option>
            <option value="Low">Academic Risk: Low</option>
          </select>

          {/* Placement Risk */}
          <select
            value={placementRisk}
            onChange={e => { setPlacementRisk(e.target.value); setPage(1); }}
            className={`w-full px-2.5 py-1.5 text-xs border rounded-lg focus:outline-none focus:border-cyan-700 focus:bg-white transition ${
              placementRisk === 'High'
                ? 'bg-amber-50/80 border-amber-300 text-amber-800 font-semibold'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <option value="">Placement Risk: All</option>
            <option value="High">Placement Risk: High</option>
            <option value="Medium">Placement Risk: Medium</option>
            <option value="Low">Placement Risk: Low</option>
          </select>
        </div>

        {/* Secondary Filter Row: Study Year, Backlogs, Sorting, and Reset */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={year}
              onChange={e => { setYear(e.target.value ? Number(e.target.value) : ''); setPage(1); }}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:border-cyan-700"
            >
              <option value="">All Study Years</option>
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
            </select>

            <select
              value={hasBacklogs === '' ? '' : hasBacklogs ? 'yes' : 'no'}
              onChange={e => {
                const v = e.target.value;
                setHasBacklogs(v === '' ? '' : v === 'yes');
                setPage(1);
              }}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:border-cyan-700"
            >
              <option value="">All Backlog Statuses</option>
              <option value="yes">With Active Backlogs</option>
              <option value="no">Zero Backlogs Only</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition font-medium cursor-pointer"
                title="Reset all filters to default"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium text-[11px]">Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none focus:border-cyan-700"
            >
              <option value="student_id">Student ID</option>
              <option value="success_score">Success Score</option>
              <option value="cgpa">CGPA</option>
              <option value="overall_attendance">Attendance</option>
              <option value="name">Name</option>
              <option value="academic_risk">Academic Risk</option>
              <option value="placement_risk">Placement Risk</option>
            </select>

            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600 font-bold transition cursor-pointer"
              title={`Toggle sort direction (Current: ${sortOrder.toUpperCase()})`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Clean Enterprise Data Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-2.5">
            <div className="w-8 h-8 border-3 border-cyan-700/20 border-t-cyan-700 rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500 font-medium">Filtering Cohort Directory...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-14 px-4 space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-800">No students match current filter criteria</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting search terms or resetting filters to audit all 250 verified profiles.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition shadow-2xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Student</th>
                  <th className="py-2.5 px-3 font-semibold">Department & Year</th>
                  <th className="py-2.5 px-3 text-center font-semibold">CGPA</th>
                  <th className="py-2.5 px-3 text-center font-semibold">Attendance</th>
                  <th className="py-2.5 px-3 text-center font-semibold">Success Score</th>
                  <th className="py-2.5 px-3 text-center font-semibold">Academic Risk</th>
                  <th className="py-2.5 px-3 text-center font-semibold">Placement Risk</th>
                  <th className="py-2.5 px-3 text-center font-semibold">Cohort Segment</th>
                  <th className="py-2.5 px-4 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map(st => {
                  const hasAttendanceDeficit = st.overall_attendance < 75;

                  return (
                    <tr
                      key={st.student_id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Student Identity */}
                      <td className="py-2.5 px-4">
                        <button
                          onClick={() => onSelectStudent(st.student_id)}
                          className="font-semibold text-slate-900 hover:text-cyan-800 transition text-left cursor-pointer leading-tight block"
                        >
                          {st.name}
                        </button>
                        <span className="font-mono text-[11px] text-cyan-800 font-semibold block">
                          {st.student_id}
                        </span>
                      </td>

                      {/* Department & Year */}
                      <td className="py-2.5 px-3 text-slate-600">
                        <div className="font-medium text-slate-800 leading-tight">{st.department}</div>
                        <div className="text-[11px] text-slate-400">Year {st.year}</div>
                      </td>

                      {/* CGPA */}
                      <td className="py-2.5 px-3 text-center font-mono">
                        <div className="font-semibold text-slate-800 tabular-nums">
                          {st.cgpa.toFixed(2)}
                        </div>
                        {st.has_backlogs && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200 mt-0.5">
                            {st.backlogs} Backlog{st.backlogs > 1 ? 's' : ''}
                          </span>
                        )}
                      </td>

                      {/* Attendance */}
                      <td className="py-2.5 px-3 text-center font-mono">
                        <div className="inline-flex items-center gap-1 tabular-nums">
                          <span className={hasAttendanceDeficit ? 'text-rose-700 font-bold' : 'text-slate-800 font-medium'}>
                            {st.overall_attendance.toFixed(1)}%
                          </span>
                          {hasAttendanceDeficit && (
                            <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              Deficit
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Success Score */}
                      <td className="py-2.5 px-3 text-center">
                        <span className="font-mono font-bold text-slate-900 text-sm tabular-nums">
                          {st.success_score}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono"> / 100</span>
                      </td>

                      {/* Academic Risk */}
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          st.academic_risk_level === 'High'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : st.academic_risk_level === 'Medium'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {st.academic_risk_level} Risk
                        </span>
                      </td>

                      {/* Placement Risk */}
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          st.placement_risk_level === 'High'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : st.placement_risk_level === 'Medium'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {st.placement_risk_level} Risk
                        </span>
                      </td>

                      {/* Cohort Segment */}
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex text-[11px] font-medium text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/80">
                          {st.primary_segment}
                        </span>
                      </td>

                      {/* Profile Action */}
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => onSelectStudent(st.student_id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-100 border border-slate-300 rounded-md transition cursor-pointer shadow-2xs"
                        >
                          <span>View profile</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Dense Pagination Bar */}
        <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
          <div>
            Showing Page <span className="font-semibold text-slate-900">{page}</span> of{' '}
            <span className="font-semibold text-slate-900">{totalPages}</span> ({total} Students Total)
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className={`px-2.5 py-1 rounded-md border flex items-center gap-1 font-medium text-xs transition cursor-pointer ${
                page <= 1
                  ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-100'
                  : 'border-slate-300 text-slate-700 hover:bg-white bg-slate-50 shadow-2xs'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>

            <span className="px-2 text-xs font-mono text-slate-500">
              {page} / {totalPages}
            </span>

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className={`px-2.5 py-1 rounded-md border flex items-center gap-1 font-medium text-xs transition cursor-pointer ${
                page >= totalPages
                  ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-100'
                  : 'border-slate-300 text-slate-700 hover:bg-white bg-slate-50 shadow-2xs'
              }`}
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
