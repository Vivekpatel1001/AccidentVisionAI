import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: string;
  variant?: 'primary' | 'warning' | 'critical' | 'success' | 'default';
  trend?: {
    text: string;
    positive?: boolean;
  };
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  variant = 'default',
  trend,
}) => {
  const getAccentBorder = () => {
    switch (variant) {
      case 'primary':
        return 'border-accent-primary/30 hover:border-accent-primary/60';
      case 'critical':
        return 'border-accent-critical/30 hover:border-accent-critical/60';
      case 'warning':
        return 'border-accent-warning/30 hover:border-accent-warning/60';
      case 'success':
        return 'border-accent-success/30 hover:border-accent-success/60';
      default:
        return 'border-border-dark hover:border-border-subtle';
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'primary':
        return 'text-accent-primary bg-accent-primary/10';
      case 'critical':
        return 'text-accent-critical bg-accent-critical/10';
      case 'warning':
        return 'text-accent-warning bg-accent-warning/10';
      case 'success':
        return 'text-accent-success bg-accent-success/10';
      default:
        return 'text-text-muted bg-bg-surface';
    }
  };

  return (
    <div
      className={`bg-bg-card rounded-lg p-5 border transition-all duration-200 shadow-card-dark flex flex-col justify-between ${getAccentBorder()}`}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-text-muted tracking-wide">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-md ${getIconColor()}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-2xl font-bold font-mono text-text-main tracking-tight">
          {value}
        </div>
        {badge && (
          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-bg-surface text-text-muted border border-border-dark">
            {badge}
          </span>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-2.5 flex items-center justify-between text-xs text-text-subtle pt-2 border-t border-border-dark/60">
          {subtitle && <span className="truncate">{subtitle}</span>}
          {trend && (
            <span
              className={`font-mono text-[11px] ${
                trend.positive ? 'text-accent-success' : 'text-accent-critical'
              }`}
            >
              {trend.text}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
