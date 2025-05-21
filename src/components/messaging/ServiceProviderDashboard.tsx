
import React from 'react';
import ProviderInbox from '../business/ProviderInbox';

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
  return (
    <div>
      <div className="mb-4 p-4 bg-muted rounded-lg">
        <h3 className="font-medium">Your Business Profile</h3>
        <p className="text-sm mt-1">Category: <strong>{category}</strong></p>
        {subcategory && subcategory.length > 0 && (
          <p className="text-sm mt-1">
            Subcategories: <strong>{subcategory.join(', ')}</strong>
          </p>
        )}
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
