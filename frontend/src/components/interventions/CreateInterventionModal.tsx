import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { InterventionCreate } from '../../types';
import { X, Plus, AlertCircle, Check } from 'lucide-react';

interface CreateInterventionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  defaultStudentId?: string;
  defaultStudentName?: string;
  defaultCategory?: string;
  defaultTitle?: string;
  defaultDescription?: string;
  defaultPriority?: string;
}

export const CreateInterventionModal: React.FC<CreateInterventionModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  defaultStudentId = '',
  defaultStudentName = '',
  defaultCategory = 'Academic',
  defaultTitle = '',
  defaultDescription = '',
  defaultPriority = 'High'
}) => {
  const [studentId, setStudentId] = useState(defaultStudentId);
  const [studentName, setStudentName] = useState(defaultStudentName);
  const [category, setCategory] = useState(defaultCategory);
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription);
  const [priority, setPriority] = useState(defaultPriority);
  const [assignedFaculty, setAssignedFaculty] = useState('Dr. Arvind Sharma (HOD IT)');
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
  const [actionItemInput, setActionItemInput] = useState('');
  const [actionItems, setActionItems] = useState<string[]>([
    'Schedule initial 1-on-1 counseling session',
    'Review diagnostic weak areas and set milestones'
  ]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStudentId(defaultStudentId || '');
      setStudentName(defaultStudentName || '');
      setCategory(defaultCategory || 'Academic');
      setTitle(defaultTitle || '');
      setDescription(defaultDescription || '');
      setPriority(defaultPriority || 'High');
      setError(null);
    }
  }, [isOpen, defaultStudentId, defaultStudentName, defaultCategory, defaultTitle, defaultDescription, defaultPriority]);

  if (!isOpen) return null;

  const handleAddActionItem = () => {
    if (actionItemInput.trim()) {
      setActionItems(prev => [...prev, actionItemInput.trim()]);
      setActionItemInput('');
    }
  };

  const handleRemoveActionItem = (idx: number) => {
    setActionItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim() || !title.trim()) {
      setError('Student ID and Title are required.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload: InterventionCreate = {
        student_id: studentId.trim().toUpperCase(),
        student_name: studentName.trim() || studentId.trim().toUpperCase(),
        category,
        title,
        description,
        priority,
        assigned_faculty: assignedFaculty,
        status: 'In Progress',
        due_date: dueDate,
        action_items: actionItems,
        notes
      };
      await api.createIntervention(payload);
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record intervention');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-900">Record Institutional Intervention</h3>
            <p className="text-xs text-slate-500">Assign faculty mentor, define action items, and set follow-up</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Student ID *</label>
              <input
                type="text"
                placeholder="e.g. STU003"
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Student Name</label>
              <input
                type="text"
                placeholder="Autofilled from database"
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Intervention Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="Academic">Academic (Remedial & Backlogs)</option>
                <option value="Placement">Placement (Coding & Aptitude)</option>
                <option value="Attendance">Attendance Statutory Compliance</option>
                <option value="Engagement">LMS & Campus Engagement</option>
                <option value="Personal/Mentoring">Mentoring & Wellbeing</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Priority Level</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="High">High (Immediate Action)</option>
                <option value="Medium">Medium (Scheduled Support)</option>
                <option value="Low">Low (General Guidance)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Intervention Title *</label>
            <input
              type="text"
              placeholder="e.g. Remedial DSA Mentorship & Backlog Clearance Plan"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Action Description & Diagnosis</label>
            <textarea
              rows={2}
              placeholder="Detail reasons for intervention and required objectives..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Assigned Faculty Member</label>
              <input
                type="text"
                value={assignedFaculty}
                onChange={e => setAssignedFaculty(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Follow-Up Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Action Items List */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Structured Action Items</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Add milestone (e.g. Complete 30 LeetCode problems)"
                value={actionItemInput}
                onChange={e => setActionItemInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddActionItem(); }}}
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
              />
              <button
                type="button"
                onClick={handleAddActionItem}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 font-semibold rounded-lg"
              >
                Add
              </button>
            </div>
            <ul className="space-y-1">
              {actionItems.map((item, idx) => (
                <li key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200">
                  <span>• {item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveActionItem(idx)}
                    className="text-slate-400 hover:text-red-600 font-bold"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Initial Faculty Notes / Observations</label>
            <textarea
              rows={2}
              placeholder="Initial observations from meeting with student or department notes..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {saving ? 'Saving...' : 'Record Intervention'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
