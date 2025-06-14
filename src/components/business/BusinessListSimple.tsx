import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Building, MapPin, Phone, MessageSquare, Globe, Instagram, IndianRupee, Pencil, Trash, Tag, Clock, Star, Image, FileSearch } from 'lucide-react';
import { Business } from './BusinessFormSimple';
import { useNavigate } from 'react-router-dom';

interface BusinessListProps {
  onEdit: (business: Business) => void;
  refresh?: boolean;
}

interface BusinessWithDetails extends Business {
  approval_status?: string;
  map_link?: string;
  hours?: string;
}

const BusinessListSimple: React.FC<BusinessListProps> = ({ onEdit, refresh }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<BusinessWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteBusinessId, setDeleteBusinessId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBusinesses();
    }
  }, [user, refresh]);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .eq('user_id', user?.id);
        
      if (error) {
        throw error;
      }
      
      console.log("Fetched businesses:", data);
      
      // Type cast the data to ensure it matches the Business interface
      const typedData: BusinessWithDetails[] = (data || []).map(item => ({
        ...item,
        // Add required properties that might be missing from the database
        address: `${item.area}, ${item.city}` || "",
        contact_phone: item.contact_phone || "+91",
        whatsapp: item.whatsapp || "+91",
        postal_code: item.postal_code || "",
        images: item.images || [],
        tags: item.tags || [],
      }));
      
      setBusinesses(typedData);
    } catch (error: any) {
      console.error('Error fetching businesses:', error);
      toast({
        title: "Error",
        description: "Failed to load your businesses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewRequests = () => {
    navigate('/provider-requests');
  };

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
      setShowDeleteDialog(false);
    }
  };

  const confirmDelete = (id: string) => {
    setDeleteBusinessId(id);
    setShowDeleteDialog(true);
  };

  if (loading) {
    return <div className="text-center py-8">Loading your businesses...</div>;
  }

  if (businesses.length === 0) {
    return (
      <div className="text-center py-8 space-y-4">
        <p className="text-muted-foreground">You haven't added any businesses or services yet.</p>
        <p>Use the "Add Business" button to add your first business or service!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {businesses.length > 0 && (
        <div className="flex justify-end">
          <Button 
            onClick={handleViewRequests}
            className="flex items-center gap-2"
          >
            <FileSearch className="h-4 w-4" />
            View Service Requests
          </Button>
        </div>
      )}

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
              {business.images && business.images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                  {business.images.slice(0, 5).map((image, index) => (
                    <div key={index} className="relative aspect-square rounded-md overflow-hidden">
                      <img 
                        src={image} 
                        alt={`${business.name} image ${index + 1}`}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ))}
                </div>
              )}
              
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
                
                {business.map_link && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <a href={business.map_link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline truncate">
                      Google Maps
                    </a>
                  </div>
                )}

                {business.availability && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm">{business.availability}</span>
                  </div>
                )}

                {business.hours && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm">{business.hours}</span>
                  </div>
                )}
              </div>
              
              {business.tags && business.tags.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Services/Items:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {business.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {business.experience && (
                <div className="mt-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Experience:</span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-6">{business.experience}</p>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="border-t bg-muted/10 gap-2 justify-between py-3">
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleViewRequests}
                className="flex items-center gap-1"
              >
                <FileSearch className="h-4 w-4" />
                Service Requests
              </Button>
              <div className="flex gap-2">
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
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
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
              onClick={() => deleteBusinessId && handleDelete(deleteBusinessId)}
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

export default BusinessListSimple;
