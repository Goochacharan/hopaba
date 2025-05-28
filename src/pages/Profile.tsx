
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Settings as SettingsIcon, LogOut, Loader2, FileSearch } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BusinessFormSimple from '@/components/business/BusinessFormSimple';
import BusinessListSimple from '@/components/business/BusinessListSimple';
import { Business } from '@/components/business/BusinessForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Lazy load the AdminSection to improve performance and avoid initial loading issues
const AdminSection = lazy(() => import('@/components/admin/AdminSectionWrapper'));

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

  // Handle admin error to prevent profile page from crashing
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
    console.log("Business saved, refreshing list");
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

  const handleViewServiceRequests = () => {
    navigate('/provider-requests');
  };

  if (pageError) {
    return <MainLayout>
        <div className="container mx-auto py-8 px-4">
          <h1 className="text-3xl font-bold mb-4">Profile</h1>
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p>There was an error loading your profile: {pageError}</p>
              <Button className="mt-4" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>;
  }

  if (!user) {
    return <MainLayout>
        <div className="container mx-auto py-8 min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Authentication Required</CardTitle>
              <CardDescription>
                You need to be logged in to view your profile.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => navigate('/login')} className="w-full">
                Go to Login
              </Button>
            </CardFooter>
          </Card>
        </div>
      </MainLayout>;
  }

  return <MainLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col mb-8">
          <h1 className="text-3xl font-bold">Your Profile</h1>
          <p className="text-muted-foreground mb-3">
            {user.user_metadata?.full_name || user.email}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/settings')} className="flex items-center gap-2" size="sm">
              <SettingsIcon className="h-4 w-4" />
              Settings
            </Button>
            <Button variant="outline" onClick={logout} size="sm" className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Admin section with error handling and loading state */}
        {isAdmin && !adminLoading && (
          <Suspense fallback={
            <Card className="mb-8">
              <CardContent className="p-6 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2">Loading admin section...</span>
              </CardContent>
            </Card>
          }>
            <AdminSection />
          </Suspense>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="businesses">Your Businesses</TabsTrigger>
            <TabsTrigger value="service-requests" className="flex items-center gap-1">
              <FileSearch className="h-4 w-4" />
              Service Requests
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="businesses">
            {showAddBusinessForm ? (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>{editingBusiness ? 'Edit Business' : 'Add Business'}</CardTitle>
                  <CardDescription>
                    {editingBusiness ? 'Update your business information' : 'List your business or service'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BusinessFormSimple business={editingBusiness} onSaved={handleBusinessSaved} onCancel={handleCancelBusinessForm} />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Your Business Listings</h2>
                  <Button onClick={handleAddBusiness} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Business
                  </Button>
                </div>

                <BusinessListSimple onEdit={handleEditBusiness} refresh={refreshBusinesses} />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="service-requests">
            <Card>
              <CardHeader>
                <CardTitle>Service Provider Dashboard</CardTitle>
                <CardDescription>Manage service requests for your businesses</CardDescription>
              </CardHeader>
              <CardContent className="text-center py-8">
                <FileSearch className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">View and respond to service requests</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Check service requests from users that match your business categories and send them quotations.
                </p>
                <Button onClick={handleViewServiceRequests} className="flex items-center gap-2 mx-auto">
                  <FileSearch className="h-4 w-4" />
                  Open Service Requests Dashboard
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>;
};

export default Profile;
