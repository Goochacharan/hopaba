
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
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-400/80 to-green-400/30 blur-md animate-pulse-soft" />
      <div className="absolute inset-0 rounded-full bg-white/80 backdrop-blur-sm" />
      <div className="relative z-10 flex items-center justify-center w-full h-full">
        <img 
          src="/lovable-uploads/92aaa562-a180-460d-9f71-3b12d541c349.png" 
          alt="Hopaba Logo" 
          className="w-[85%] h-[85%] object-contain" 
        />
      </div>
    </div>
  );
};

export default AnimatedLogo;
