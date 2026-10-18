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
        return 'bg-accent-critical/15 text-accent-critical border-accent-critical/30';
      case 'severe':
        return 'bg-accent-warning/15 text-accent-warning border-accent-warning/30';
      case 'minor':
        return 'bg-accent-success/15 text-accent-success border-accent-success/30';
      case 'primary':
        return 'bg-accent-primary/15 text-accent-primary border-accent-primary/30';
      case 'warning':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      default:
        return 'bg-bg-surface text-text-muted border-border-dark';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${getStyles()} ${className}`}
    >
      {children}
    </span>
  );
};
