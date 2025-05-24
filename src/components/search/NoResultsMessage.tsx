
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';

interface NoResultsMessageProps {
  type: 'locations' | 'events' | 'marketplace';
  onNewSearch?: (query: string) => void;
}

const NoResultsMessage: React.FC<NoResultsMessageProps> = ({ type, onNewSearch }) => {
  const navigate = useNavigate();

  if (type === 'locations') {
    return (
      <div className="text-center py-10 animate-fade-in">
        <p className="text-lg font-medium mb-2">No locations found</p>
        <p className="text-muted-foreground mb-4">
          Try adjusting your search or filters
        </p>
        <Button variant="outline" onClick={() => onNewSearch?.("restaurant near me")} className="mr-2">
          Try "Restaurant near me"
        </Button>
        <Button variant="outline" onClick={() => onNewSearch?.("cafes in bangalore")}>
          Try "Cafes in Bangalore"
        </Button>
      </div>
    );
  }
  
  if (type === 'events') {
    return (
      <div className="text-center py-10 animate-fade-in">
        <p className="text-lg font-medium mb-2">No events found</p>
        <p className="text-muted-foreground">
          Try adjusting your search criteria
        </p>
      </div>
    );
  }
  
  return (
    <div className="text-center py-10 animate-fade-in">
      <p className="text-lg font-medium mb-2">No marketplace items found</p>
      <p className="text-muted-foreground mb-4">
        Try searching with different terms or browsing the marketplace directly
      </p>
      <Button variant="outline" onClick={() => navigate("/marketplace")}>
        <ShoppingBag className="mr-2 h-4 w-4" />
        Browse Marketplace
      </Button>
    </div>
  );
};

export default NoResultsMessage;
