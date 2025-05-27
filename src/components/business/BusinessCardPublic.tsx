
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Clock, Phone, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BusinessActionButtons from './BusinessActionButtons';
import { cn } from '@/lib/utils';

interface Business {
  id: string;
  name: string;
  category: string;
  description: string;
  address: string;
  area: string;
  city: string;
  contact_phone: string;
  contact_email?: string;
  website?: string;
  instagram?: string;
  whatsapp?: string;
  map_link?: string;
  price_range_min?: number;
  price_range_max?: number;
  price_unit?: string;
  availability?: string;
  availability_days?: string[];
  availability_start_time?: string;
  availability_end_time?: string;
  tags?: string[];
  images?: string[];
  hours?: string;
  languages?: string[];
  experience?: string;
  created_at: string;
  approval_status: string;
  rating?: number;
  calculatedDistance?: number | null;
  distanceText?: string;
}

interface BusinessCardPublicProps {
  business: Business;
}

const BusinessCardPublic: React.FC<BusinessCardPublicProps> = ({ business }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/business/${business.id}`);
  };

  // Debug logging for phone number
  console.log('BusinessCardPublic - Business:', business.name, 'Phone:', business.contact_phone);

  const formatPriceRange = () => {
    if (business.price_range_min && business.price_range_max) {
      return `₹${business.price_range_min} - ₹${business.price_range_max} ${business.price_unit || 'per hour'}`;
    }
    return null;
  };

  const getAvailabilityText = () => {
    if (business.availability_days && business.availability_start_time && business.availability_end_time) {
      const days = business.availability_days.length === 7 ? 'Daily' : 
                   business.availability_days.length === 5 ? 'Weekdays' :
                   business.availability_days.join(', ');
      return `${days} ${business.availability_start_time} - ${business.availability_end_time}`;
    }
    return business.availability || 'Contact for availability';
  };

  return (
    <Card className={cn(
      "cursor-pointer hover:shadow-lg transition-shadow duration-300 h-full flex flex-col",
      business.calculatedDistance !== null && business.calculatedDistance !== undefined && "border-blue-200"
    )}>
      <CardHeader onClick={handleCardClick} className="pb-2">
        <div className="flex justify-between items-start mb-2">
          <CardTitle className="text-lg font-semibold line-clamp-2">{business.name}</CardTitle>
          <div className="flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span>{business.rating?.toFixed(1) || '4.5'}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Badge variant="secondary" className="w-fit">
            {business.category}
          </Badge>
          
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">{business.area}, {business.city}</span>
          </div>

          {business.calculatedDistance !== null && business.calculatedDistance !== undefined && (
            <div className="flex items-center gap-1 text-sm text-blue-600 font-medium">
              <Navigation className="h-4 w-4" />
              <span>{business.calculatedDistance.toFixed(1)} km away</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent onClick={handleCardClick} className="flex-1 pt-0">
        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
          {business.description}
        </p>

        <div className="space-y-2 text-sm">
          {formatPriceRange() && (
            <div className="text-green-600 font-medium">
              {formatPriceRange()}
            </div>
          )}
          
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="line-clamp-1">{getAvailabilityText()}</span>
          </div>

          {business.contact_phone && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{business.contact_phone}</span>
            </div>
          )}
        </div>

        {business.tags && business.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {business.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {business.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{business.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <BusinessActionButtons
          businessId={business.id}
          name={business.name}
          phone={business.contact_phone}
          whatsapp={business.whatsapp}
          instagram={business.instagram}
          location={`${business.address}, ${business.area}, ${business.city}`}
          mapLink={business.map_link}
        />
      </CardFooter>
    </Card>
  );
};

export default BusinessCardPublic;
