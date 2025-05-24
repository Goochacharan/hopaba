
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface SearchHeaderProps {
  query: string;
  searchQuery: string;
  category: string;
  resultsCount: {
    locations: number;
    events: number;
    marketplace: number;
  };
  loading: boolean;
  error: string | null;
  className?: string;
}

const SearchHeader: React.FC<SearchHeaderProps> = ({ 
  error,
  className
}) => {
  return (
    <div className={`mb-4 ${className || ''}`}>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default SearchHeader;
