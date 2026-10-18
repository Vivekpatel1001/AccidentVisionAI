import React, { ReactNode } from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

interface AlertBannerProps {
  title?: string;
  children: ReactNode;
  type?: 'warning' | 'critical' | 'info' | 'success';
  className?: string;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  title,
  children,
  type = 'info',
  className = '',
}) => {
  const getBannerStyles = () => {
    switch (type) {
      case 'critical':
        return {
          container: 'bg-accent-critical/10 border-accent-critical/30 text-accent-critical',
          icon: AlertCircle,
          iconColor: 'text-accent-critical',
        };
      case 'warning':
        return {
          container: 'bg-accent-warning/10 border-accent-warning/30 text-amber-200',
          icon: AlertTriangle,
          iconColor: 'text-accent-warning',
        };
      case 'success':
        return {
          container: 'bg-accent-success/10 border-accent-success/30 text-emerald-200',
          icon: CheckCircle2,
          iconColor: 'text-accent-success',
        };
      case 'info':
      default:
        return {
          container: 'bg-accent-primary/10 border-accent-primary/30 text-sky-200',
          icon: Info,
          iconColor: 'text-accent-primary',
        };
    }
  };

  const { container, icon: Icon, iconColor } = getBannerStyles();

  return (
    <div className={`p-4 rounded-lg border flex items-start space-x-3.5 ${container} ${className}`}>
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
      <div className="flex-1 text-xs leading-relaxed space-y-1">
        {title && <div className="font-semibold text-sm tracking-wide text-text-main">{title}</div>}
        <div className="text-text-muted">{children}</div>
      </div>
    </div>
  );
};
