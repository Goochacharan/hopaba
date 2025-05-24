
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Pencil, Trash2, IndianRupee, Clock, MapPin, Phone, Instagram, Film, Tag } from 'lucide-react';
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
import { BusinessFormValues } from './AddBusinessForm';
import { Badge } from '@/components/ui/badge';

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
        console.error('Error fetching businesses:', error);
        throw error;
      }
      
      console.log("Fetched businesses:", data);
      setBusinesses(data || []);
    } catch (error: any) {
      console.error('Error fetching businesses:', error);
      toast({
        title: 'Error',
        description: 'Unable to load your businesses. Please try again later.',
        variant: 'destructive',
      });
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

  if (loading) {
    return <div className="text-center py-8">Loading your businesses...</div>;
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
          <Card key={business.id} className="overflow-hidden">
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex justify-between items-start">
                <span>{business.name}</span>
                <span className="text-sm font-normal text-muted-foreground px-2 py-1 bg-muted rounded-md">
                  {business.category}
                </span>
              </CardTitle>
              <CardDescription className="line-clamp-2">{business.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
                  <span>
                    ₹{business.price_range_min} - ₹{business.price_range_max} {business.price_unit}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{business.availability}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{business.area}, {business.city}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{business.contact_phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Instagram className="h-4 w-4 text-muted-foreground" />
                <span>{business.instagram}</span>
                {business.instagram && (
                  <button 
                    onClick={(e) => handleInstagramClick(e, business.instagram, business.name)}
                    title="Watch video content" 
                    className="bg-gradient-to-tr from-purple-500 via-pink-500 to-yellow-500 rounded-full hover:shadow-md transition-all ml-2 px-4 py-2"
                  >
                    <Film className="h-5 w-5 text-white" />
                  </button>
                )}
              </div>
              
              {business.tags && business.tags.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Popular Items/Services:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {business.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="bg-primary/10 text-primary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t bg-muted/10 gap-2 justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onEdit(business)}
                className="flex items-center gap-1"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => confirmDelete(business.id)}
                className="flex items-center gap-1"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </CardFooter>
          </Card>
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
