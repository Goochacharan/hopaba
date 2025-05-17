
import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminSection } from './AdminSection';

const AdminSectionWrapper = () => {
  const [error, setError] = useState<string | null>(null);

  // Use error boundary pattern with React's error handling lifecycle
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Error in AdminSection:', event.error);
      setError('Failed to load admin section. Please try again later.');
      // Prevent the error from bubbling up and crashing the whole app
      event.preventDefault();
    };

    // Listen for errors that might occur in the AdminSection
    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  if (error) {
    return (
      <Card className="mb-8 border-destructive/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-destructive" />
            Admin Section Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  // Wrap the AdminSection in an error boundary
  try {
    return <AdminSection />;
  } catch (err) {
    console.error('Error rendering AdminSection:', err);
    return (
      <Card className="mb-8 border-destructive/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-destructive" />
            Admin Section Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Failed to load admin section. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }
};

export default AdminSectionWrapper;
