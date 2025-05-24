import React from 'react';
import { cn } from '@/lib/utils';

interface OnlineIndicatorProps {
  isOnline: boolean;
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const OnlineIndicator: React.FC<OnlineIndicatorProps> = ({
  isOnline,
  className,
  showText = true,
  size = 'md'
}) => {
  if (!isOnline) return null;

  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className={cn(
        'rounded-full bg-green-500 animate-pulse',
        sizeClasses[size]
      )} />
      {showText && (
        <span className={cn(
          'font-medium text-green-600 uppercase tracking-wide',
          textSizeClasses[size]
        )}>
          Online
        </span>
      )}
    </div>
  );
}; 