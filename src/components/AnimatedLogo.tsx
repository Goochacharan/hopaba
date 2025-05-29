
import React from 'react';
import { cn } from '@/lib/utils';

interface AnimatedLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const AnimatedLogo: React.FC<AnimatedLogoProps> = ({
  className,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className={cn('relative flex items-center justify-center', sizeClasses[size], className)}>
      <img 
        src="/lovable-uploads/c86a553b-b292-4a63-8de7-e97eee43a75e.png" 
        alt="Chowkashi Logo" 
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export default AnimatedLogo;
