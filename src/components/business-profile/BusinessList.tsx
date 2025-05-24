import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Building, MapPin, Phone, MessageSquare, Globe, Instagram, IndianRupee, Calendar, Languages, Award, Tag, Pencil, Trash } from 'lucide-react';
import { BusinessData } from './BusinessListingForm';

interface BusinessListProps {
  onEdit: (business: BusinessData) => void;
  refresh: boolean;
}

const BusinessList: React.FC<BusinessListProps> = ({ onEdit, refresh }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [businesses, setBusinesses] = useState<BusinessData[]>([]);
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
      setBusinesses(data as unknown as BusinessData[] || []);
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

  if (loading) {
    return <div className="text-center py-8">Loading your businesses...</div>;
  }

  if (businesses.length === 0) {
    return (
      <div className="text-center py-8 space-y-4">
        <p className="text-muted-foreground">You haven't added any businesses or services yet.</p>
        <p>Use the "Submit Business" button to add your first business or service!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {businesses.map((business) => (
          <Card key={business.id} className="overflow-hidden">
            <CardHeader className="bg-muted/30">
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  <CardTitle>{business.name}</CardTitle>
                </div>
                <Badge variant={business.approval_status === 'approved' ? "success" : "secondary"}>
                  {business.approval_status === 'approved' ? 'Approved' : 'Pending Approval'}
                </Badge>
              </div>
              <CardDescription className="line-clamp-2">{business.description}</CardDescription>
            </CardHeader>
            
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm">{business.address}, {business.area}, {business.city}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm">{business.contact_phone}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm">{business.whatsapp}</span>
                </div>
                
                {business.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm truncate">{business.website}</span>
                  </div>
                )}
                
                {business.instagram && (
                  <div className="flex items-center gap-2">
                    <Instagram className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm">{business.instagram}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm">
                    ₹{business.price_range_min || '—'} - ₹{business.price_range_max || '—'} {business.price_unit}
                  </span>
                </div>
                
                {business.availability && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm">{business.availability}</span>
                  </div>
                )}
                
                {business.languages && business.languages.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Languages className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm">{business.languages.join(', ')}</span>
                  </div>
                )}
                
                {business.experience && (
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm">{business.experience}</span>
                  </div>
                )}
              </div>
              
              {business.tags && business.tags.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Services/Items:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {business.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="bg-primary/5">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="border-t bg-muted/10 gap-2 justify-end py-3">
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
                onClick={() => confirmDelete(business.id!)}
                className="flex items-center gap-1"
              >
                <Trash className="h-4 w-4" />
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
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

export default BusinessList;
