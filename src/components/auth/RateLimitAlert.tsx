
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface RateLimitAlertProps {
  isVisible: boolean;
}

export const RateLimitAlert: React.FC<RateLimitAlertProps> = ({ isVisible }) => {
  if (!isVisible) return null;
  
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Access temporarily blocked</AlertTitle>
      <AlertDescription>
        Too many login attempts detected. Please try again later.
      </AlertDescription>
    </Alert>
  );
};
