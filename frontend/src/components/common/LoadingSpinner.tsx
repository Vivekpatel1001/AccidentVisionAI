import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Processing analytics telemetry...',
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center space-y-3 ${className}`}>
      <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
      <span className="text-xs font-mono text-text-muted">{message}</span>
    </div>
  );
};
