import React, { useState, useEffect } from 'react';
import { FacultyMember, FacultyStats, FacultyListResponse } from '../types';
import { api } from '../services/api';
import {
  GraduationCap,
  Search,
  Filter,
  UserCheck,
  Shield,
  BookOpen,
  Award,
  Mail,
  User,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Lock,
  Building,
  Eye,
  X,
  CheckCircle2,
  Clock
} from 'lucide-react';

export const FacultyPage: React.FC = () => {
  const [facultyList, setFacultyList] = useState<FacultyMember[]>([]);
  const [stats, setStats] = useState<FacultyStats | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [designation, setDesignation] = useState('');
  const [accountStatus, setAccountStatus] = useState('');
  const [role, setRole] = useState('');

  // Selected faculty modal
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyMember | null>(null);

  useEffect(() => {
    loadFacultyData();
  }, [page, subject, designation, accountStatus, role]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadFacultyData();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadFacultyData = async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        api.getFaculty({
          search: search || undefined,
          subject: subject || undefined,
          designation: designation || undefined,
          role: role || undefined,
          account_status: accountStatus || undefined,
          page,
          page_size: 12
        }),
        api.getFacultyStats()
      ]);
      setFacultyList(listRes.faculty);
      setTotal(listRes.total);
      setTotalPages(listRes.total_pages);
      setStats(statsRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setSubject('');
    setDesignation('');
    setAccountStatus('');
    setRole('');
    setPage(1);
  };

  const getSubjectColor = (subj: string) => {
    switch (subj.toLowerCase()) {
      case 'maths':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'physics':
        return 'bg-violet-50 text-violet-700 border-violet-200';
      case 'programming':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'dbms':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'os':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getDesignationBadge = (desig: string) => {
    switch (desig) {
      case 'Professor':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Associate Professor':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Assistant Professor':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'ACTIVE':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          label: 'Active Account'
        };
      case 'PENDING_SETUP':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
          label: 'Pending Setup'
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-600 border-slate-200',
          dot: 'bg-slate-400',
          label: st
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Faculty Directory</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              50 Academic Records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Institutional roster of instructional staff, subject specialization, qualifications, and prepared governance accounts.
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-600" />
          <span>Account Security: Password Provisioning Deferred</span>
        </div>
      </div>

      {/* Top Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
              <span>Total Faculty</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <GraduationCap className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{stats.total_faculty}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">5 Core Academic Disciplines</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
              <span>Doctoral Degree (Ph.D.)</span>
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              {stats.phd_holders}
              <span className="text-xs text-slate-400 font-normal ml-1.5">
                ({((stats.phd_holders / stats.total_faculty) * 100).toFixed(0)}%)
              </span>
            </div>
            <p className="text-[11px] text-purple-700 font-medium mt-0.5">Ph.D. Qualified Professors</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
              <span>Professors & Associates</span>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              {stats.professors + stats.associate_professors}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {stats.professors} Full Professors • {stats.associate_professors} Associates
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
              <span>Prepared Accounts</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-600 mt-2">
              {stats.status_distribution['ACTIVE'] || 0} Active
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {stats.status_distribution['PENDING_SETUP'] || 0} Pending Credentials Setup
            </p>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Faculty Name, ID (FAC01), or Subject..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Subject Filter */}
          <select
            value={subject}
            onChange={e => { setSubject(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
          >
            <option value="">All Subjects</option>
            <option value="Maths">Mathematics (10)</option>
            <option value="Physics">Physics (10)</option>
            <option value="Programming">Programming (10)</option>
            <option value="DBMS">DBMS (10)</option>
            <option value="OS">Operating Systems (10)</option>
          </select>

          {/* Designation Filter */}
          <select
            value={designation}
            onChange={e => { setDesignation(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
          >
            <option value="">All Designations</option>
            <option value="Professor">Professor</option>
            <option value="Associate Professor">Associate Professor</option>
            <option value="Assistant Professor">Assistant Professor</option>
          </select>

          {/* Account Status Filter */}
          <select
            value={accountStatus}
            onChange={e => { setAccountStatus(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
          >
            <option value="">All Account Statuses</option>
            <option value="ACTIVE">ACTIVE Account</option>
            <option value="PENDING_SETUP">PENDING_SETUP Account</option>
          </select>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <select
              value={role}
              onChange={e => { setRole(e.target.value); setPage(1); }}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">ADMIN Role</option>
              <option value="FACULTY">FACULTY Role</option>
            </select>

            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
            </button>
          </div>

          <span className="text-slate-500 font-medium">
            Showing {facultyList.length} of {total} Faculty Records
          </span>
        </div>
      </div>

      {/* Faculty Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : facultyList.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No Faculty Records Found</h3>
          <p className="text-xs text-slate-500 mt-1">Try clearing filters or search query.</p>
          <button
            onClick={handleResetFilters}
            className="mt-3 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {facultyList.map(f => {
            const statusInfo = getStatusBadge(f.account.account_status);
            return (
              <div
                key={f.faculty_id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 hover:shadow-sm transition space-y-3 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: ID and Subject */}
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {f.faculty_id}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getSubjectColor(f.subject)}`}>
                      {f.subject}
                    </span>
                  </div>

                  {/* Name and Designation */}
                  <div className="mt-3">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{f.faculty_name}</h4>
                      {f.has_phd && (
                        <span className="shrink-0 text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                          Ph.D.
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getDesignationBadge(f.designation)}`}>
                        {f.designation}
                      </span>
                    </div>
                  </div>

                  {/* Qualification & Department */}
                  <div className="mt-3 space-y-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{f.qualification}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{f.department}</span>
                    </div>
                  </div>
                </div>

                {/* Account Preparation Details */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusInfo.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                      {statusInfo.label}
                    </span>

                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      f.account.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {f.account.role}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span className="truncate">{f.account.email}</span>
                    <button
                      onClick={() => setSelectedFaculty(f)}
                      className="text-xs font-sans font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 shrink-0 ml-2"
                    >
                      <Eye className="w-3.5 h-3.5" /> Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Bar */}
      <div className="bg-white rounded-xl border border-slate-200 px-5 py-3.5 flex items-center justify-between text-xs text-slate-600 shadow-xs">
        <div>
          Page <span className="font-semibold text-slate-900">{page}</span> of{' '}
          <span className="font-semibold text-slate-900">{totalPages}</span> ({total} Faculty Total)
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className={`p-1.5 rounded-lg border flex items-center gap-1 font-semibold transition ${
              page <= 1
                ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-100'
                : 'border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className={`p-1.5 rounded-lg border flex items-center gap-1 font-semibold transition ${
              page >= totalPages
                ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-100'
                : 'border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Faculty Profile Modal */}
      {selectedFaculty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{selectedFaculty.faculty_name}</h3>
                  <p className="text-xs text-slate-500 font-mono">ID: {selectedFaculty.faculty_id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFaculty(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Profile Details */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block">Subject:</span>
                  <span className="font-bold text-slate-900">{selectedFaculty.subject}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Designation:</span>
                  <span className="font-bold text-slate-900">{selectedFaculty.designation}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Qualification:</span>
                  <span className="font-bold text-slate-900">{selectedFaculty.qualification}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Department:</span>
                  <span className="font-bold text-slate-900">{selectedFaculty.department}</span>
                </div>
              </div>

              {/* Account Readiness Card */}
              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-blue-950">
                    <Shield className="w-4 h-4 text-blue-700" />
                    <span>Prepared Account Model</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(selectedFaculty.account.account_status).bg}`}>
                    {selectedFaculty.account.account_status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-700 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500 font-sans block text-[10px]">Account ID:</span>
                    <span>{selectedFaculty.account.account_id}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-sans block text-[10px]">Username:</span>
                    <span>{selectedFaculty.account.username}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 font-sans block text-[10px]">Institutional Email:</span>
                    <span>{selectedFaculty.account.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-sans block text-[10px]">Assigned Role:</span>
                    <span className="font-bold text-purple-700">{selectedFaculty.account.role}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-sans block text-[10px]">Credentials Status:</span>
                    <span className="text-amber-800">Pending Secure Setup</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-blue-200 flex items-center gap-2 text-[11px] text-blue-800">
                  <Lock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Password hashing & secure provisioning deferred for future release.</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedFaculty(null)}
                className="px-4 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
