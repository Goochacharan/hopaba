import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';

interface PerformanceMonitorProps {
  label: string;
  isLoading: boolean;
  dataCount?: number;
  showInProduction?: boolean;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ 
  label, 
  isLoading, 
  dataCount,
  showInProduction = false 
}) => {
  const [startTime, setStartTime] = useState<number | null>(null);
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Only show in development or when explicitly enabled
  useEffect(() => {
    const isDevelopment = import.meta.env.DEV;
    setIsVisible(isDevelopment || showInProduction);
  }, [showInProduction]);

  useEffect(() => {
    if (isLoading && !startTime) {
      setStartTime(Date.now());
      setLoadTime(null);
    } else if (!isLoading && startTime) {
      const endTime = Date.now();
      setLoadTime(endTime - startTime);
      setStartTime(null);
    }
  }, [isLoading, startTime]);

  if (!isVisible) return null;

  const getPerformanceColor = (time: number) => {
    if (time < 500) return 'bg-green-100 text-green-800';
    if (time < 1000) return 'bg-yellow-100 text-yellow-800';
    if (time < 2000) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      <Badge variant="outline" className="bg-white/90 backdrop-blur-sm">
        {label}
      </Badge>
      
      {isLoading && (
        <Badge variant="outline" className="bg-blue-100 text-blue-800">
          Loading...
        </Badge>
      )}
      
      {loadTime !== null && (
        <Badge 
          variant="outline" 
          className={getPerformanceColor(loadTime)}
        >
          {loadTime}ms
        </Badge>
      )}
      
      {dataCount !== undefined && (
        <Badge variant="outline" className="bg-gray-100 text-gray-800">
          {dataCount} items
        </Badge>
      )}
    </div>
  );
};

export default PerformanceMonitor; 