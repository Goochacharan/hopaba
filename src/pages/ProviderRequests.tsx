
import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import MainLayout from '@/components/MainLayout';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const ProviderRequests: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Redirect to the messages page with the provider tab active
  useEffect(() => {
    if (user) {
      navigate('/messages?tab=provider');
    }
  }, [user, navigate]);
  
  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  // Show loading while redirecting
  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Redirecting to service requests...</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProviderRequests;
