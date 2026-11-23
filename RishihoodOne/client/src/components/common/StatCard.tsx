import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Badge } from './Badge';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: 'emerald' | 'amber' | 'rose' | 'indigo' | 'blue' | 'slate';
  trend?: string;
  trendPositive?: boolean;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  badgeColor = 'indigo',
  trend,
  trendPositive = true,
  className = '',
}) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-subtle hover:border-slate-300 transition-all duration-200 relative overflow-hidden group flex flex-col justify-between ${className}`}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] font-semibold text-[#778195] uppercase tracking-wider">
            {title}
          </p>
          <div className="p-2.5 bg-[#F7F8FA] group-hover:bg-[#5267D8]/10 rounded-xl text-[#172D45] group-hover:text-[#5267D8] transition-colors border border-slate-200/50 shrink-0">
            <Icon className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-2 flex items-baseline gap-2">
          <h3 className="text-2xl sm:text-3xl font-bold text-[#172D45] tracking-tight">
            {value}
          </h3>
          {trend && (
            <span
              className={`text-xs font-semibold flex items-center gap-0.5 ${
                trendPositive ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              <span>{trendPositive ? '↑' : '↓'}</span>
              <span>{trend}</span>
            </span>
          )}
        </div>

        {subtitle && (
          <p className="text-xs text-[#778195] mt-1 line-clamp-1 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {badge && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <Badge status={badge} variant={badgeColor === 'blue' ? 'indigo' : (badgeColor as any)} size="sm" />
          <span className="text-[10px] text-slate-400 font-medium">Real-time status</span>
        </div>
      )}
    </div>
  );
};
