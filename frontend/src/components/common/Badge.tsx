import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'fatal' | 'severe' | 'minor' | 'primary' | 'neutral' | 'warning';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', className = '' }) => {
  const getStyles = () => {
    switch (variant) {
      case 'fatal':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'severe':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'minor':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'primary':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold border ${getStyles()} ${className}`}
    >
      {children}
    </span>
  );
};
