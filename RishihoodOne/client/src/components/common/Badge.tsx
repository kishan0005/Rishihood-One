import React from 'react';

export interface BadgeProps {
  status: string;
  variant?: 'default' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'slate' | 'sky';
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  variant,
  size = 'sm',
  className = '',
  dot = true,
}) => {
  const norm = status ? String(status).toUpperCase() : '';

  let colors = 'bg-slate-100 text-slate-700 border-slate-200';

  if (variant) {
    colors = {
      emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      amber: 'bg-amber-50 text-amber-700 border-amber-200/80',
      rose: 'bg-rose-50 text-rose-700 border-rose-200/80',
      indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
      slate: 'bg-slate-100 text-slate-700 border-slate-200/80',
      sky: 'bg-sky-50 text-sky-700 border-sky-200/80',
      default: 'bg-slate-100 text-slate-700 border-slate-200/80',
    }[variant];
  } else {
    if (['APPROVED', 'PAID', 'RESOLVED', 'CLOSED', 'ACTIVE', 'GOOD', 'PRESENT', 'ELIGIBLE', 'COMPLETED', 'TOP 5%'].includes(norm)) {
      colors = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
    } else if (['PENDING', 'IN_PROGRESS', 'LATE', 'MEDIUM', 'ATTENTION', 'REVIEW', 'WARNING'].includes(norm)) {
      colors = 'bg-amber-50 text-amber-700 border-amber-200/80';
    } else if (['REJECTED', 'OVERDUE', 'URGENT', 'CRITICAL', 'ABSENT', 'MAINTENANCE', 'SHORTAGE', 'FAILED'].includes(norm)) {
      colors = 'bg-rose-50 text-rose-700 border-rose-200/80';
    } else if (['OPEN', 'HIGH'].includes(norm)) {
      colors = 'bg-orange-50 text-orange-700 border-orange-200/80';
    } else if (['AVAILABLE', 'SUBMITTED', 'GRADED', 'ACADEMIC', 'SPRING 2025', 'CHECK-IN ACTIVE', 'HIGH DEMAND'].includes(norm)) {
      colors = 'bg-indigo-50 text-indigo-700 border-indigo-200/80';
    } else if (['HOUSING', 'CAMPUS', 'NEW', 'UPCOMING'].includes(norm)) {
      colors = 'bg-sky-50 text-sky-700 border-sky-200/80';
    } else if (['FULL', 'VACATED', 'GENERAL', 'FEES'].includes(norm)) {
      colors = 'bg-slate-100 text-slate-600 border-slate-200/80';
    }
  }

  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';
  const label = norm.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${colors} ${sizeStyles} ${className}`}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70 shrink-0"></span>}
      <span className="truncate">{label}</span>
    </span>
  );
};
