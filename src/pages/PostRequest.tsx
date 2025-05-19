
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import PostRequestForm from '@/components/request/PostRequestForm';
import UserRequestsList from '@/components/request/UserRequestsList';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Navigate, useNavigate } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { FileSearch } from 'lucide-react';

const PostRequest: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("new");
  
  // Check if the user is a service provider
  const { data: isServiceProvider } = useQuery({
    queryKey: ['isServiceProvider', user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase
        .from('service_providers')
        .select('id')
        .eq('user_id', user.id);
        
      if (error) {
        console.error('Error checking if user is service provider:', error);
        return false;
      }
      
      return data && data.length > 0;
    },
    enabled: !!user
  });
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return (
    <MainLayout>
      <div className="py-6">
        <div className="flex items-center justify-between max-w-3xl mx-auto px-4 mb-6">
          <h1 className="text-2xl font-bold">Service Requests</h1>
          <Button 
            variant="outline"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
        </div>
        
        <Tabs defaultValue="new" onValueChange={setActiveTab} className="max-w-3xl mx-auto px-4">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="new">Post New Request</TabsTrigger>
            <TabsTrigger value="past">View Past Requests</TabsTrigger>
          </TabsList>
          
          <TabsContent value="new">
            <PostRequestForm />
          </TabsContent>
          
          <TabsContent value="past">
            <UserRequestsList />
          </TabsContent>
        </Tabs>
        
        {isServiceProvider && (
          <div className="max-w-3xl mx-auto px-4 mt-8 pt-8 border-t">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-semibold">Are you a service provider?</h2>
                <p className="text-muted-foreground">View and respond to service requests that match your business categories</p>
              </div>
              <Button 
                onClick={() => navigate('/provider-requests')}
                className="flex items-center gap-2"
              >
                <FileSearch className="h-4 w-4" />
                View Provider Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default PostRequest;
