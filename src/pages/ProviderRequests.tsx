
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const ProviderRequests: React.FC = () => {
  const { user } = useAuth();
  
  // If authenticated, redirect to the messages page with the provider tab active
  if (user) {
    return <Navigate to="/messages?tab=provider" replace />;
  }
  
  // If not authenticated, redirect to login
  return <Navigate to="/login" />;
};

export default ProviderRequests;
