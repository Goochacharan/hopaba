
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Mail, Globe, MapPin, Instagram, Clock, Languages, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Business } from '@/hooks/useBusinesses';

interface BusinessCardPublicProps {
  business: Business;
  className?: string;
}

const BusinessCardPublic: React.FC<BusinessCardPublicProps> = ({ business, className }) => {
  // Map days numbers to actual day names
  const dayMap: Record<string, string> = {
    '0': 'Sun',
    '1': 'Mon',
    '2': 'Tue',
    '3': 'Wed',
    '4': 'Thu',
    '5': 'Fri',
    '6': 'Sat'
  };

  const formatAvailabilityDays = (days: string[] | undefined) => {
    if (!days || days.length === 0) return 'Not specified';
    
    return days.map(day => dayMap[day] || day).join(', ');
  };

  const formatPrice = () => {
    if (business.price_range_min && business.price_range_max) {
      return `₹${business.price_range_min} - ₹${business.price_range_max} ${business.price_unit || ''}`;
    } else if (business.price_range_min) {
      return `₹${business.price_range_min} ${business.price_unit || ''}`;
    } else if (business.price_range_max) {
      return `Up to ₹${business.price_range_max} ${business.price_unit || ''}`;
    }
    return 'Not specified';
  };

  const renderRating = () => {
    const rating = business.rating || 0;
    return (
      <div className="flex items-center">
        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
        <span className="ml-1 text-sm">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <Card className={`overflow-hidden border-primary/20 h-full ${className}`}>
      <div className="aspect-video w-full overflow-hidden relative">
        {business.images && business.images.length > 0 ? (
          <img 
            src={business.images[0]} 
            alt={business.name} 
            className="object-cover w-full h-full" 
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <p className="text-muted-foreground">No image available</p>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge variant="default" className="bg-primary/90">
            {business.category}
          </Badge>
        </div>
        {business.subcategory && (
          <div className="absolute top-2 left-2">
            <Badge variant="outline" className="bg-background/90 border-primary/40">
              {business.subcategory}
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-5 space-y-3">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-lg line-clamp-2">{business.name}</h3>
          {renderRating()}
        </div>
        
        {business.description && (
          <p className="text-muted-foreground text-sm line-clamp-2">
            {business.description}
          </p>
        )}
        
        <div className="grid gap-2 text-sm">
          {(business.area || business.city) && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="line-clamp-1">
                {[business.area, business.city].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
          
          {business.contact_phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <a href={`tel:${business.contact_phone}`} className="hover:underline">
                {business.contact_phone}
              </a>
            </div>
          )}
          
          {business.availability_days && business.availability_days.length > 0 && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="line-clamp-1">
                {formatAvailabilityDays(business.availability_days)}
                {business.availability_start_time && business.availability_end_time && 
                  ` (${business.availability_start_time} - ${business.availability_end_time})`
                }
              </span>
            </div>
          )}
          
          {business.price_range_min || business.price_range_max ? (
            <div className="flex items-center gap-2">
              <span className="font-medium">Price:</span>
              <span>{formatPrice()}</span>
            </div>
          ) : null}
          
          {business.languages && business.languages.length > 0 && (
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="line-clamp-1">{business.languages.join(', ')}</span>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2 pt-2">
          {business.website && (
            <a href={business.website} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline">
                <Globe className="h-4 w-4 mr-1" />
                Website
              </Button>
            </a>
          )}
          
          {business.instagram && (
            <a href={`https://instagram.com/${business.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="text-pink-600 hover:text-pink-700">
                <Instagram className="h-4 w-4 mr-1" />
                Instagram
              </Button>
            </a>
          )}
          
          {business.contact_email && (
            <a href={`mailto:${business.contact_email}`}>
              <Button size="sm" variant="outline">
                <Mail className="h-4 w-4 mr-1" />
                Email
              </Button>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BusinessCardPublic;
