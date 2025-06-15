import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Settings as SettingsIcon, LogOut, Loader2, FileSearch, Shield, Youtube } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BusinessFormSimple from '@/components/business/BusinessFormSimple';
import BusinessListSimple from '@/components/business/BusinessListSimple';
import { Business } from '@/components/business/BusinessFormSimple';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileHeader from '@/components/profile/ProfileHeader';
import BusinessesTab from '@/components/profile/BusinessesTab';
import ServiceRequestsTab from '@/components/profile/ServiceRequestsTab';
import ProfileAdminSection from '@/components/profile/ProfileAdminSection';
import ProfileErrorFallback from '@/components/profile/ProfileErrorFallback';
import ProfileLoginFallback from '@/components/profile/ProfileLoginFallback';

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isAdmin, loading: adminLoading, error: adminError } = useAdmin();
  const { toast } = useToast();
  const [refreshBusinesses, setRefreshBusinesses] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [showAddBusinessForm, setShowAddBusinessForm] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('businesses');

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (adminError) {
      console.error('Admin error:', adminError);
      toast({
        title: "Admin section error",
        description: "There was an issue loading the admin section. The rest of your profile is still available.",
        variant: "destructive"
      });
    }
  }, [adminError, toast]);

  const handleAddBusiness = () => {
    setEditingBusiness(null);
    setShowAddBusinessForm(true);
  };

  const handleEditBusiness = (business: Business) => {
    setEditingBusiness(business);
    setShowAddBusinessForm(true);
  };

  const handleBusinessSaved = () => {
    toast({
      title: "Success",
      description: editingBusiness ? "Business updated successfully" : "Business created successfully"
    });
    setEditingBusiness(null);
    setShowAddBusinessForm(false);
    setRefreshBusinesses(prev => !prev);
  };

  const handleCancelBusinessForm = () => {
    setEditingBusiness(null);
    setShowAddBusinessForm(false);
  };

  if (pageError) {
    return <ProfileErrorFallback pageError={pageError} />;
  }

  if (!user) {
    return <ProfileLoginFallback />;
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4">
        <ProfileHeader onLogout={logout} user={user} />
        {isAdmin && !adminLoading && <ProfileAdminSection />}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="businesses">Your Businesses</TabsTrigger>
            <TabsTrigger value="service-requests" className="flex items-center gap-1">
              Service Requests
            </TabsTrigger>
          </TabsList>
          <TabsContent value="businesses">
            <BusinessesTab
              showAddBusinessForm={showAddBusinessForm}
              editingBusiness={editingBusiness}
              onAddBusiness={handleAddBusiness}
              onEditBusiness={handleEditBusiness}
              onSaved={handleBusinessSaved}
              onCancel={handleCancelBusinessForm}
              refreshBusinesses={refreshBusinesses}
            />
          </TabsContent>
          <TabsContent value="service-requests">
            <ServiceRequestsTab />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Profile;
