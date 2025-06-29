
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Business } from '@/hooks/useBusinesses';
import { useWishlist } from '@/contexts/WishlistContext';

interface WishlistBusinessCardProps {
  business: Business & { type: 'business' };
}

const WishlistBusinessCard: React.FC<WishlistBusinessCardProps> = ({ business }) => {
  const navigate = useNavigate();
  const { removeFromWishlist } = useWishlist();

  const handleViewProfile = () => {
    navigate(`/business/${business.id}`);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeFromWishlist(business.id || '', 'business');
  };

  return (
    <Card className="mb-3 hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        <div className="flex gap-3">
          {/* Business Image */}
          <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded-md">
            {business.images && business.images.length > 0 ? (
              <img 
                src={business.images[0]} 
                alt={business.name} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <span className="text-xs text-muted-foreground">No image</span>
              </div>
            )}
          </div>
          
          {/* Business Info */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-1">
              <h4 className="font-medium text-sm truncate">{business.name}</h4>
              <button
                onClick={handleRemove}
                className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                title="Remove from wishlist"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
            
            <Badge variant="secondary" className="text-xs mb-1">
              {business.category}
            </Badge>
            
            {(business.area || business.city) && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                <MapPin className="h-3 w-3" />
                <span className="truncate">
                  {[business.area, business.city].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
            
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleViewProfile}
              className="w-full text-xs h-7"
            >
              View Profile
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WishlistBusinessCard;
