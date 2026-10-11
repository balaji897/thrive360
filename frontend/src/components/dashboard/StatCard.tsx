import React, { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  highlightColor?: 'blue' | 'indigo' | 'emerald' | 'rose' | 'amber';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendType = 'neutral',
  highlightColor = 'blue'
}) => {
  const colorMap = {
    blue: 'bg-slate-100 text-cyan-700 border-slate-200',
    indigo: 'bg-slate-100 text-slate-800 border-slate-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  const trendColorMap = {
    positive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    negative: 'bg-rose-50 text-rose-700 border-rose-200',
    neutral: 'bg-slate-100 text-slate-600 border-slate-200'
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        <div className={`p-2 rounded-lg border ${colorMap[highlightColor]}`}>
          {icon}
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-display">{value}</div>
        {trend && (
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${trendColorMap[trendType]}`}>
            {trend}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1.5 text-xs text-slate-500 leading-normal">{subtitle}</p>}
    </div>
  );
};
