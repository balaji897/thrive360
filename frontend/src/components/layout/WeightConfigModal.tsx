import React, { useState, useEffect } from 'react';
import { ScoringWeights } from '../../types';
import { api } from '../../services/api';
import { Sliders, X, Check, RefreshCw, AlertCircle } from 'lucide-react';

interface WeightConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWeightsUpdated: () => void;
}

export const WeightConfigModal: React.FC<WeightConfigModalProps> = ({ isOpen, onClose, onWeightsUpdated }) => {
  const [weights, setWeights] = useState<ScoringWeights>({
    academic_performance: 0.25,
    attendance: 0.20,
    lms_participation: 0.10,
    student_engagement: 0.10,
    placement_readiness: 0.20,
    technical_soft_skills: 0.10,
    feedback_support: 0.05,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadWeights();
    }
  }, [isOpen]);

  const loadWeights = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getScoringWeights();
      setWeights(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load weights');
    } finally {
      setLoading(false);
    }
  };

  const handleSliderChange = (key: keyof ScoringWeights, val: number) => {
    setWeights(prev => ({ ...prev, [key]: Math.round(val) / 100 }));
  };

  const totalPercentage = Math.round(
    (weights.academic_performance +
      weights.attendance +
      weights.lms_participation +
      weights.student_engagement +
      weights.placement_readiness +
      weights.technical_soft_skills +
      weights.feedback_support) * 100
  );

  const isValid = totalPercentage === 100;

  const handleReset = () => {
    setWeights({
      academic_performance: 0.25,
      attendance: 0.20,
      lms_participation: 0.10,
      student_engagement: 0.10,
      placement_readiness: 0.20,
      technical_soft_skills: 0.10,
      feedback_support: 0.05,
    });
  };

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    setError(null);
    try {
      await api.updateScoringWeights(weights);
      onWeightsUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update weights');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const fields: Array<{ key: keyof ScoringWeights; label: string; desc: string }> = [
    { key: 'academic_performance', label: 'Academic Performance', desc: 'CGPA, subject marks average, and backlog penalties' },
    { key: 'attendance', label: 'Attendance Compliance', desc: 'Aggregate lecture and lab attendance percentage' },
    { key: 'lms_participation', label: 'LMS Digital Participation', desc: 'Online portal login frequency and digital engagement' },
    { key: 'student_engagement', label: 'Campus Activities & Certs', desc: 'Clubs, events, hackathons, and certified achievements' },
    { key: 'placement_readiness', label: 'Placement Readiness', desc: 'Coding scores, aptitude assessments, and mock interviews' },
    { key: 'technical_soft_skills', label: 'Technical & Soft Skills', desc: 'Domain testing and soft skill competencies' },
    { key: 'feedback_support', label: 'Student Perception & Feedback', desc: 'Overall institutional satisfaction rating' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Configure Success Score Weights</h3>
              <p className="text-xs text-slate-500">Heuristic scoring distribution (Must sum to 100%)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {fields.map(f => {
            const pct = Math.round(weights[f.key] * 100);
            return (
              <div key={f.key} className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center text-sm font-semibold text-slate-800">
                  <span>{f.label}</span>
                  <span className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{pct}%</span>
                </div>
                <p className="text-xs text-slate-500">{f.desc}</p>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={pct}
                  onChange={e => handleSliderChange(f.key, parseFloat(e.target.value))}
                  className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>
            );
          })}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-600">Total Sum:</span>
            <span className={`text-sm font-bold font-mono px-2 py-0.5 rounded ${
              isValid ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
            }`}>
              {totalPercentage}% {isValid ? '✓' : '(Must equal 100%)'}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Defaults
            </button>
            <button
              onClick={handleSave}
              disabled={!isValid || saving}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-sm transition ${
                isValid && !saving
                  ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                  : 'bg-slate-300 cursor-not-allowed text-slate-500'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              {saving ? 'Recalculating...' : 'Apply & Recalculate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
