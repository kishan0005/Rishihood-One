import React from 'react';

export interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  showPercentage?: boolean;
  size?: 'xs' | 'sm' | 'md';
  variant?: 'primary' | 'accent' | 'emerald' | 'amber' | 'rose' | 'auto';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showPercentage = true,
  size = 'sm',
  variant = 'auto',
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  // Auto variant determines color based on attendance / compliance threshold
  const resolvedVariant = variant === 'auto'
    ? percentage >= 75
      ? 'emerald'
      : percentage >= 65
      ? 'amber'
      : 'rose'
    : variant;

  const barColors = {
    primary: 'bg-[#172D45]',
    accent: 'bg-[#5267D8]',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
  }[resolvedVariant];

  const heightStyles = {
    xs: 'h-1.5',
    sm: 'h-2',
    md: 'h-3',
  }[size];

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-xs mb-1.5 font-medium text-[#778195]">
          {label && <span className="truncate">{label}</span>}
          {showPercentage && <span className="text-[#202938] font-semibold">{percentage}%</span>}
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${heightStyles}`}>
        <div
          className={`${heightStyles} ${barColors} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

