import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import BusinessCard from './BusinessCard';
import { Loader2 } from 'lucide-react';
import { BusinessFormValues } from '@/components/business/BusinessForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BusinessesListProps {
  onEdit: (business: BusinessFormValues & { id: string }) => void;
  refresh: boolean;
}

const BusinessesList = ({ onEdit, refresh }: BusinessesListProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [businesses, setBusinesses] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const [businessToDelete, setBusinessToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const fetchBusinesses = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log("Fetching businesses for user:", user.id);
      const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      console.log("Fetched businesses:", data);
      setBusinesses(data || []);
      setRetryCount(0);
    } catch (error: any) {
      console.error('Error fetching businesses:', error);
      
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          fetchBusinesses();
        }, Math.min(1000 * Math.pow(2, retryCount), 10000)); // Exponential backoff
      } else {
        toast({
          title: 'Error',
          description: 'Unable to load your businesses. Please try again later.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBusinesses();
    }
  }, [user, refresh]);

  const handleDelete = async (id: string) => {
    try {
      console.log("Deleting business with ID:", id);
      const { error } = await supabase
        .from('service_providers')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);
      
      if (error) {
        console.error('Error deleting business:', error);
        throw error;
      }
      
      setBusinesses(businesses.filter(business => business.id !== id));
      toast({
        title: 'Success',
        description: 'Business listing deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting business:', error);
      toast({
        title: 'Error',
        description: 'There was a problem deleting your business listing.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const confirmDelete = (id: string) => {
    setBusinessToDelete(id);
    setIsDeleteDialogOpen(true);
  };
  
  const handleInstagramClick = (e: React.MouseEvent, instagram: string, businessName: string) => {
    e.stopPropagation();
    if (instagram) {
      window.open(instagram);
      toast({
        title: "Opening video content",
        description: `Visiting ${businessName}'s video content`,
        duration: 2000
      });
    } else {
      toast({
        title: "Video content not available",
        description: "This business has not provided any video links",
        variant: "destructive",
        duration: 2000
      });
    }
  };

  if (loading && businesses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading your businesses...</p>
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="text-center py-8 space-y-4">
        <p className="text-muted-foreground">You haven't added any businesses or services yet.</p>
        <p>Use the form above to add your first business or service!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-medium">Your Businesses and Services</h3>
      <div className="grid grid-cols-1 gap-6">
        {businesses.map((business) => (
          <BusinessCard
            key={business.id}
            business={business}
            onEdit={onEdit}
            onDelete={(id) => confirmDelete(id)}
          />
        ))}
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your business listing. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => businessToDelete && handleDelete(businessToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BusinessesList;
