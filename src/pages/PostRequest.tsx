
import React from 'react';
import MainLayout from '@/components/MainLayout';
import PostRequestForm from '@/components/request/PostRequestForm';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Navigate, useNavigate } from 'react-router-dom';

const PostRequest: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return (
    <MainLayout>
      <div className="py-6">
        <div className="flex items-center justify-between max-w-3xl mx-auto px-4 mb-6">
          <h1 className="text-2xl font-bold">Post a Service Request</h1>
          <Button 
            variant="outline"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
        </div>
        <PostRequestForm />
      </div>
    </MainLayout>
  );
};

export default PostRequest;
