
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/MainLayout';
import AdminPanelTabs from '@/components/admin/AdminPanelTabs';
import { useAdmin } from '@/hooks/useAdmin';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SellerListingLimits from '@/components/admin/SellerListingLimits';
import HighLimitSellers from '@/components/admin/HighLimitSellers';
import CategoryReviewCriteria from '@/components/admin/CategoryReviewCriteria';

const AdminPanel = () => {
  const { isAdmin, loading, error } = useAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin && !error) {
      navigate('/profile');
    }
  }, [isAdmin, loading, navigate, error]);

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8 px-4">
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="animate-pulse text-center">
              <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-64 mx-auto"></div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8 px-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </MainLayout>
    );
  }

  if (!isAdmin) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8 px-4">
          <div className="text-center py-12 space-y-4">
            <ShieldAlert className="h-16 w-16 text-muted-foreground mx-auto" />
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground">You do not have admin privileges to access this page.</p>
            <Button onClick={() => navigate('/profile')}>Back to Profile</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">Manage and approve content across the platform</p>
        </div>
        
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <SellerListingLimits />
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <HighLimitSellers />
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <CategoryReviewCriteria />
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <AdminPanelTabs />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminPanel;
