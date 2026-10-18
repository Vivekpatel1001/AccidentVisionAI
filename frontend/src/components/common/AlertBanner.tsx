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
          container: 'bg-red-50 border-red-200 text-red-900',
          icon: AlertCircle,
          iconColor: 'text-red-600',
          subtext: 'text-red-700',
        };
      case 'warning':
        return {
          container: 'bg-amber-50 border-amber-200 text-amber-900',
          icon: AlertTriangle,
          iconColor: 'text-amber-600',
          subtext: 'text-amber-700',
        };
      case 'success':
        return {
          container: 'bg-emerald-50 border-emerald-200 text-emerald-900',
          icon: CheckCircle2,
          iconColor: 'text-emerald-600',
          subtext: 'text-emerald-700',
        };
      case 'info':
      default:
        return {
          container: 'bg-blue-50 border-blue-200 text-blue-900',
          icon: Info,
          iconColor: 'text-blue-600',
          subtext: 'text-blue-700',
        };
    }
  };

  const { container, icon: Icon, iconColor, subtext } = getBannerStyles();

  return (
    <div className={`p-4 rounded-xl border flex items-start space-x-3.5 shadow-sm ${container} ${className}`}>
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
      <div className="flex-1 text-xs leading-relaxed space-y-1">
        {title && <div className="font-bold text-sm tracking-wide">{title}</div>}
        <div className={`text-xs ${subtext}`}>{children}</div>
      </div>
    </div>
  );
};
