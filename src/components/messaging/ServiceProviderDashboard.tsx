
import React, { useState, useEffect } from 'react';
import ProviderInbox from '../business/ProviderInbox';
import RatingBadge from '../business/RatingBadge';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { calculateOverallRating } from '@/utils/ratingUtils';

interface ServiceProviderDashboardProps {
  providerId: string;
  category: string;
  subcategory?: string[];
}

/**
 * Dashboard component for service providers to view and respond to matching service requests
 */
const ServiceProviderDashboard: React.FC<ServiceProviderDashboardProps> = ({
  providerId,
  category,
  subcategory
}) => {
  // Fetch criteria ratings for this provider
  const { data: criteriaRatings } = useQuery({
    queryKey: ['providerRatings', providerId],
    queryFn: async () => {
      // This would ideally be fetched from the database
      // For now, we're using mock data based on provider ID to simulate ratings
      const { data, error } = await supabase
        .from('review_criteria')
        .select('id, name, category')
        .eq('category', category)
        .limit(5);

      if (error) {
        console.error('Error fetching review criteria:', error);
        return {};
      }

      // Create mock ratings for demonstration purposes
      // In a real implementation, this would come from actual provider reviews
      const mockRatings: Record<string, number> = {};
      
      data?.forEach((criterion, index) => {
        // Generate a random rating between 7-10 for demo purposes
        mockRatings[criterion.id] = Math.floor(Math.random() * 4) + 7;
      });

      return mockRatings;
    }
  });

  // Calculate overall rating from criteria ratings
  const overallRating = calculateOverallRating(criteriaRatings || {});

  return (
    <div>
      <div className="mb-4 p-4 bg-muted rounded-lg">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium">Your Business Profile</h3>
            <p className="text-sm mt-1">Category: <strong>{category}</strong></p>
            {subcategory && subcategory.length > 0 && (
              <p className="text-sm mt-1">
                Subcategories: <strong>{subcategory.join(', ')}</strong>
              </p>
            )}
          </div>
          
          {overallRating > 0 && (
            <div className="flex flex-col items-center">
              <RatingBadge rating={overallRating} size="md" />
              <span className="text-xs text-muted-foreground mt-1">Overall Rating</span>
            </div>
          )}
        </div>
      </div>
      
      <ProviderInbox
        providerId={providerId}
        category={category}
        subcategory={subcategory}
      />
    </div>
  );
};

export default ServiceProviderDashboard;
