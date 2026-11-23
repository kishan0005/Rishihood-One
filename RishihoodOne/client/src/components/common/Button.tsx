import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 select-none disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5 h-8',
    md: 'text-xs sm:text-sm px-4 py-2 rounded-xl gap-2 h-9 sm:h-10',
    lg: 'text-sm sm:text-base px-5 py-2.5 rounded-xl gap-2.5 h-11',
  }[size];

  const variantStyles = {
    primary: 'bg-[#172D45] text-white hover:bg-[#1E3550] active:bg-[#122336] shadow-xs focus:ring-[#172D45]/30',
    accent: 'bg-[#5267D8] text-white hover:bg-[#4355BE] active:bg-[#3543A4] shadow-xs focus:ring-[#5267D8]/30',
    secondary: 'bg-white text-[#202938] border border-slate-200/90 hover:bg-slate-50 hover:border-slate-300 shadow-xs focus:ring-slate-300',
    outline: 'border border-[#5267D8] text-[#5267D8] hover:bg-[#5267D8]/5 focus:ring-[#5267D8]/20',
    ghost: 'text-[#778195] hover:text-[#202938] hover:bg-slate-100 focus:ring-slate-200',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-xs focus:ring-rose-500/30',
  }[variant];

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
      {!loading && icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
    </button>
  );
};

