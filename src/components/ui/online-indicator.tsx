
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
        'rounded-full',
        isOnline 
          ? 'bg-green-500 animate-pulse' 
          : 'bg-gray-400',
        sizeClasses[size]
      )} />
      {showText && (
        <span className={cn(
          'font-medium uppercase tracking-wide',
          isOnline 
            ? 'text-green-600' 
            : 'text-gray-500',
          textSizeClasses[size]
        )}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      )}
    </div>
  );
};
