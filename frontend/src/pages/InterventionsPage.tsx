import React, { useEffect, useState } from 'react';
import { Intervention } from '../types';
import { api } from '../services/api';
import { CreateInterventionModal } from '../components/interventions/CreateInterventionModal';
import {
  LifeBuoy,
  PlusCircle,
  Search,
  RotateCcw,
  Clock,
  Trash2,
  ChevronRight,
  MessageSquare,
  Check,
  AlertCircle,
  X
} from 'lucide-react';

interface InterventionsPageProps {
  onSelectStudent: (studentId: string) => void;
}

export const InterventionsPage: React.FC<InterventionsPageProps> = ({ onSelectStudent }) => {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [activeNotesId, setActiveNotesId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    loadInterventions();
  }, [statusFilter, priorityFilter, categoryFilter]);

  const loadInterventions = async () => {
    setLoading(true);
    try {
      const data = await api.getInterventions({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        category: categoryFilter || undefined,
      });
      setInterventions(data);
    } catch (err) {
      console.error('Failed to load interventions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.updateIntervention(id, { status: newStatus as any });
      loadInterventions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveNote = async (id: string) => {
    if (!noteText.trim()) return;
    try {
      const current = interventions.find(i => i.id === id);
      const existing = current?.notes ? `${current.notes}\n` : '';
      const timestamp = new Date().toLocaleDateString();
      const updatedNotes = `${existing}[${timestamp}] ${noteText.trim()}`;
      await api.updateIntervention(id, { notes: updatedNotes });
      setNoteText('');
      setActiveNotesId(null);
      loadInterventions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this intervention record?')) {
      try {
        await api.deleteIntervention(id);
        loadInterventions();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleResetFilters = () => {
    setStatusFilter('');
    setPriorityFilter('');
    setCategoryFilter('');
    setSearch('');
  };

  const filteredInterventions = interventions.filter(i => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      i.student_id.toLowerCase().includes(q) ||
      i.student_name.toLowerCase().includes(q) ||
      i.title.toLowerCase().includes(q)
    );
  });

  const hasActiveFilters = Boolean(statusFilter || priorityFilter || categoryFilter || search);

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
            <span className="text-[11px] text-slate-500 font-medium">Academic Remediation</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-display">
            Intervention Tracking & Action Plans
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
            Record actionable recovery milestones, faculty mentor assignments, statutory follow-up timelines, and student outcome progression.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-2xs transition cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Record New Intervention</span>
        </button>
      </div>

      {/* 2. Structured Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search student or plan title..."
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

          {/* Category */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-cyan-700 focus:bg-white transition"
          >
            <option value="">All Categories</option>
            <option value="Academic">Academic Support</option>
            <option value="Attendance">Attendance Statutory</option>
            <option value="Placement">Placement Readiness</option>
            <option value="Mentorship">Faculty Mentorship</option>
            <option value="Skill Development">Skill Development</option>
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-cyan-700 focus:bg-white transition"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending Review</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {/* Priority */}
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-cyan-700 focus:bg-white transition"
          >
            <option value="">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Showing <strong className="text-slate-900">{filteredInterventions.length}</strong> of <strong className="text-slate-900">{interventions.length}</strong> plans
            </span>
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* 3. Dense Enterprise Data Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-2.5">
            <div className="w-8 h-8 border-3 border-cyan-700/20 border-t-cyan-700 rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500 font-medium">Filtering Active Intervention Plans...</p>
          </div>
        ) : filteredInterventions.length === 0 ? (
          <div className="text-center py-14 px-4 space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-800">No intervention records match current criteria</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Record a new structured intervention or adjust active filters to display logged remediation plans.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition shadow-2xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Record New Intervention
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Student</th>
                  <th className="py-2.5 px-4 font-semibold">Intervention Plan</th>
                  <th className="py-2.5 px-3 text-center font-semibold">Priority</th>
                  <th className="py-2.5 px-3 text-center font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold">Assigned Mentor & Due</th>
                  <th className="py-2.5 px-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInterventions.map(item => (
                  <React.Fragment key={item.id}>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      {/* Student */}
                      <td className="py-2.5 px-4">
                        <button
                          onClick={() => onSelectStudent(item.student_id)}
                          className="font-semibold text-slate-900 hover:text-cyan-800 transition text-left cursor-pointer leading-tight block"
                        >
                          {item.student_name}
                        </button>
                        <span className="font-mono text-[11px] text-cyan-800 font-semibold block">
                          {item.student_id}
                        </span>
                      </td>

                      {/* Intervention Plan */}
                      <td className="py-2.5 px-4 max-w-xs sm:max-w-md">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 leading-snug">{item.title}</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 leading-normal">
                          {item.description}
                        </p>
                      </td>

                      {/* Priority */}
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          item.priority.toLowerCase() === 'high'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : item.priority.toLowerCase() === 'medium'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}>
                          {item.priority}
                        </span>
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-2.5 px-3 text-center">
                        <select
                          value={item.status}
                          onChange={e => handleStatusChange(item.id, e.target.value)}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border focus:outline-none cursor-pointer ${
                            item.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : item.status === 'In Progress'
                              ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                              : item.status === 'Cancelled'
                              ? 'bg-slate-100 text-slate-500 border-slate-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>

                      {/* Mentor & Due Date */}
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-800 leading-tight">{item.assigned_faculty}</div>
                        <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>Due {item.due_date}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setActiveNotesId(activeNotesId === item.id ? null : item.id)}
                            className={`p-1.5 rounded-md border text-xs transition cursor-pointer ${
                              activeNotesId === item.id
                                ? 'bg-cyan-50 text-cyan-800 border-cyan-300'
                                : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
                            }`}
                            title="Add / View Progress Notes"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onSelectStudent(item.student_id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-100 border border-slate-300 rounded-md transition shadow-2xs cursor-pointer"
                          >
                            <span>Profile</span>
                            <ChevronRight className="w-3 h-3 text-slate-400" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                            title="Delete Intervention"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Notes Row */}
                    {activeNotesId === item.id && (
                      <tr className="bg-slate-50/70">
                        <td colSpan={6} className="p-3.5 border-t border-slate-200/80">
                          <div className="max-w-2xl space-y-2">
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                              Intervention Case Notes & Longitudinal Progress:
                            </span>
                            {item.notes ? (
                              <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed">
                                {item.notes}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400 italic">No notes recorded yet.</p>
                            )}
                            <div className="flex items-center gap-2 pt-1">
                              <input
                                type="text"
                                placeholder="Add progress log note..."
                                value={noteText}
                                onChange={e => setNoteText(e.target.value)}
                                className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-700"
                              />
                              <button
                                onClick={() => handleSaveNote(item.id)}
                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
                              >
                                Save Note
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <CreateInterventionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            loadInterventions();
          }}
        />
      )}
    </div>
  );
};
