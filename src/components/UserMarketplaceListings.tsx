import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserMarketplaceListings } from '@/hooks/useUserMarketplaceListings';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Edit2, Eye, Loader2, Plus, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { MarketplaceListing } from '@/hooks/useMarketplaceListings';
import MarketplaceListingForm from './MarketplaceListingForm';

interface UserMarketplaceListingsProps {
  onEdit?: (listing: MarketplaceListing) => void;
  refresh?: boolean;
}

const UserMarketplaceListings: React.FC<UserMarketplaceListingsProps> = ({ 
  onEdit,
  refresh 
}) => {
  const navigate = useNavigate();
  const { listings, loading, error, refetch, deleteListing, listingStatus } = useUserMarketplaceListings();
  const [listingToDelete, setListingToDelete] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [listingToEdit, setListingToEdit] = useState<MarketplaceListing | null>(null);

  // Format price to Indian Rupees
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleDeleteConfirm = async () => {
    if (listingToDelete) {
      await deleteListing(listingToDelete);
      setListingToDelete(null);
    }
  };

  const handleEdit = (listing: MarketplaceListing) => {
    if (onEdit) {
      onEdit(listing);
    } else {
      setListingToEdit(listing);
      setShowAddForm(true);
    }
  };

  const handleListingSaved = () => {
    setShowAddForm(false);
    setListingToEdit(null);
    refetch();
  };

  const renderApprovalBadge = (status: string = 'pending') => {
    switch(status) {
      case 'approved':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1">
            <XCircle className="h-3 w-3" /> Rejected
          </Badge>
        );
      case 'pending':
      default:
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Pending Approval
          </Badge>
        );
    }
  };

  if (showAddForm) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">
            {listingToEdit ? 'Edit Listing' : 'Add New Listing'}
          </h3>
          <Button variant="outline" size="sm" onClick={() => {
            setShowAddForm(false);
            setListingToEdit(null);
          }}>
            Back to Listings
          </Button>
        </div>
        <MarketplaceListingForm 
          listing={listingToEdit || undefined} 
          onSaved={handleListingSaved} 
          onCancel={() => {
            setShowAddForm(false);
            setListingToEdit(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Your Marketplace Listings</h3>
          {listingStatus && (
            <p className="text-muted-foreground text-sm">
              {listingStatus.currentListingCount} of {listingStatus.maxListings} listings used
            </p>
          )}
        </div>
        {listingStatus?.canCreateListing && (
          <Button 
            onClick={() => setShowAddForm(true)} 
            className="flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add New
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : listings.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {listings.map((listing) => (
            <Card key={listing.id} className="overflow-hidden">
              {listing.images && listing.images.length > 0 && (
                <div className="w-full h-48 overflow-hidden">
                  <img 
                    src={listing.images[0]} 
                    alt={listing.title} 
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                  />
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <Badge variant="outline" className="mb-2">
                    {listing.category.charAt(0).toUpperCase() + listing.category.slice(1)}
                  </Badge>
                  <Badge variant="secondary">
                    {listing.condition.charAt(0).toUpperCase() + listing.condition.slice(1)}
                  </Badge>
                </div>
                <CardTitle className="line-clamp-1">{listing.title}</CardTitle>
                <CardDescription className="text-lg font-semibold text-primary">
                  {formatPrice(listing.price)}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {listing.description}
                </p>
                <div className="mt-3">
                  {renderApprovalBadge(listing.approval_status)}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-2">
                <Button variant="outline" size="sm" onClick={() => navigate(`/marketplace/${listing.id}`)}>
                  <Eye className="h-4 w-4 mr-1" /> View
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(listing)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" onClick={() => setListingToDelete(listing.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Listing</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this listing? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-border">
          <h3 className="text-lg font-medium mb-2">No listings yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first marketplace listing to start selling.
          </p>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Listing
          </Button>
        </div>
      )}
    </div>
  );
};

export default UserMarketplaceListings;
