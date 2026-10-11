import React from 'react';

interface RiskBadgeProps {
  level: 'High' | 'Medium' | 'Low' | string;
  type?: 'academic' | 'placement' | 'neutral';
  showLabel?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, type = 'neutral', showLabel = true }) => {
  const normalizedLevel = level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();

  const getColors = () => {
    switch (normalizedLevel) {
      case 'High':
        return 'bg-red-50 text-red-700 border-red-200 ring-1 ring-red-600/10';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-600/10';
      case 'Low':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-600/10';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getDotColor = () => {
    switch (normalizedLevel) {
      case 'High':
        return 'bg-red-500';
      case 'Medium':
        return 'bg-amber-500';
      case 'Low':
        return 'bg-emerald-500';
      default:
        return 'bg-slate-400';
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getColors()}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${getDotColor()}`} />
      {showLabel && (
        <span>
          {type !== 'neutral' ? `${type.charAt(0).toUpperCase() + type.slice(1)}: ` : ''}
          {normalizedLevel}
        </span>
      )}
    </span>
  );
};
