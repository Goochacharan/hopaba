
import React, { useState } from 'react';
import MainLayout from '@/components/MainLayout';
import PostRequestForm from '@/components/request/PostRequestForm';
import UserRequestsList from '@/components/request/UserRequestsList';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Navigate, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PostRequest: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("new");
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return (
    <MainLayout>
      <div className="py-6">
        <div className="flex items-center justify-between max-w-3xl mx-auto px-4 mb-6">
          <Button 
            variant="outline"
            onClick={() => navigate(-1)}
            className="ml-auto"
          >
            Cancel
          </Button>
        </div>
        
        <Tabs defaultValue="new" onValueChange={setActiveTab} className="max-w-3xl mx-auto px-4">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="new">New Request</TabsTrigger>
            <TabsTrigger value="past">Past Requests</TabsTrigger>
          </TabsList>
          
          <TabsContent value="new">
            <PostRequestForm />
          </TabsContent>
          
          <TabsContent value="past">
            <UserRequestsList />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default PostRequest;
