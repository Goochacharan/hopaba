
import React from 'react';
import ProviderInbox from '../business/ProviderInbox';

interface ServiceProviderDashboardProps {
  providerId: string;
  category: string;
  subcategory?: string[];
}

/**
 * Dashboard component for service providers to view and respond to requests
 */
const ServiceProviderDashboard: React.FC<ServiceProviderDashboardProps> = ({
  providerId,
  category,
  subcategory
}) => {
  return (
    <div className="space-y-4">
      <ProviderInbox 
        providerId={providerId}
        category={category}
        subcategory={subcategory}
      />
    </div>
  );
};

export default ServiceProviderDashboard;
