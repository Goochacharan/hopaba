import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Languages, Star, Globe, Instagram, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Business } from '@/hooks/useBusinesses';
import { supabase } from '@/integrations/supabase/client';
import RatingProgressBars from '@/components/RatingProgressBars';
import BusinessActionButtons from '@/components/business/BusinessActionButtons';
import { BusinessReview } from '@/hooks/useBusinessDetail';

interface BusinessCardPublicProps {
  business: Business;
  className?: string;
}

interface CriteriaRating {
  [criterionId: string]: number;
}

const BusinessCardPublic: React.FC<BusinessCardPublicProps> = ({ business, className }) => {
  const navigate = useNavigate();
  const [criteriaRatings, setCriteriaRatings] = useState<CriteriaRating>({});
  const [overallRating, setOverallRating] = useState<number>(business.rating || 0);
  
  // Load reviews and calculate actual ratings
  useEffect(() => {
    const loadReviewsFromStorage = () => {
      if (!business.id) return;
      
      try {
        // Get reviews from localStorage
        const savedReviews = localStorage.getItem(`reviews_${business.id}`);
        const reviews: BusinessReview[] = savedReviews ? JSON.parse(savedReviews) : [];
        
        if (reviews.length > 0) {
          // Calculate overall rating from reviews
          const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
          setOverallRating(avgRating);
          
          // Calculate criteria ratings
          const allCriteriaRatings: Record<string, number[]> = {};
          
          reviews.forEach(review => {
            if (review.criteriaRatings) {
              Object.entries(review.criteriaRatings).forEach(([criterionId, rating]) => {
                if (!allCriteriaRatings[criterionId]) {
                  allCriteriaRatings[criterionId] = [];
                }
                allCriteriaRatings[criterionId].push(rating);
              });
            }
          });
          
          // Calculate average for each criterion
          const averageRatings: Record<string, number> = {};
          Object.entries(allCriteriaRatings).forEach(([criterionId, ratings]) => {
            const sum = ratings.reduce((acc, val) => acc + val, 0);
            averageRatings[criterionId] = sum / ratings.length;
          });
          
          setCriteriaRatings(averageRatings);
        }
      } catch (err) {
        console.error('Error loading reviews from localStorage:', err);
      }
    };
    
    loadReviewsFromStorage();
    
    // Fetch criteria for this business category
    const fetchCriteria = async () => {
      if (!business.category) return;
      
      try {
        const { data, error } = await supabase
          .from('review_criteria')
          .select('id, name')
          .eq('category', business.category);
          
        if (error) {
          console.error('Error fetching criteria:', error);
        }
      } catch (err) {
        console.error('Error fetching criteria:', err);
      }
    };
    
    fetchCriteria();
  }, [business.id, business.category]);
  
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
    // Scale rating to be out of 100 for color display
    const ratingColor = getRatingColor(Math.round(overallRating * 10));
    
    return (
      <div className="flex items-center gap-2">
        <div 
          className="flex items-center justify-center rounded-full font-bold text-base border-2"
          style={{ 
            width: 42, 
            height: 42, 
            borderColor: ratingColor,
            color: ratingColor,
            background: '#fff',
            boxShadow: '0 0 3px 0 rgba(0,0,0,0.05)'
          }}
        >
          {Math.round(overallRating * 10)}
        </div>
      </div>
    );
  };

  const getRatingColor = (ratingNum: number) => {
    if (ratingNum <= 30) return '#ea384c'; // dark red
    if (ratingNum <= 50) return '#F97316'; // orange
    if (ratingNum <= 70) return '#d9a404'; // dark yellow (custom, close to golden)
    if (ratingNum <= 85) return '#68cd77'; // light green
    return '#00ee24'; // bright green for highest rating
  };

  const handleCardClick = () => {
    navigate(`/business/${business.id}`);
  };

  return (
    <Card 
      className={`overflow-hidden border-primary/20 h-full ${className} cursor-pointer hover:shadow-md transition-shadow`}
      onClick={handleCardClick}
    >
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
        
        {/* Real Criteria Rating Progress Bars from localStorage */}
        {Object.keys(criteriaRatings).length > 0 && (
          <div className="mt-2 mb-2">
            <RatingProgressBars 
              criteriaRatings={criteriaRatings}
              locationId={business.id}
            />
          </div>
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
        
        {/* Action Buttons */}
        <BusinessActionButtons
          businessId={business.id}
          name={business.name}
          phone={business.contact_phone}
          whatsapp={business.contact_phone}
          instagram={business.instagram}
          location={[business.area, business.city].filter(Boolean).join(', ')}
          mapLink={business.map_link}
        />
        
        {/* Hide the website, Instagram and email buttons */}
        <div className="hidden">
          {business.website && (
            <a 
              href={business.website} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <Button size="sm" variant="outline">
                <Globe className="h-4 w-4 mr-1" />
                Website
              </Button>
            </a>
          )}
          
          {business.instagram && (
            <a 
              href={`https://instagram.com/${business.instagram.replace('@', '')}`} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <Button size="sm" variant="outline" className="text-pink-600 hover:text-pink-700">
                <Instagram className="h-4 w-4 mr-1" />
                Instagram
              </Button>
            </a>
          )}
          
          {business.contact_email && (
            <a 
              href={`mailto:${business.contact_email}`}
              onClick={(e) => e.stopPropagation()}
            >
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
