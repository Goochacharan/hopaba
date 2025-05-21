
import React from 'react';

interface ServiceProviderDashboardProps {
  providerId: string;
  category: string;
  subcategory: string[];
}

// Update this component to accept subcategory as an array
const ServiceProviderDashboard: React.FC<ServiceProviderDashboardProps> = ({
  providerId,
  category,
  subcategory
}) => {
  return (
    <div>
      {/* Component implementation that properly handles subcategory as an array */}
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Service Provider Dashboard</h2>
        <div className="bg-gray-100 p-4 rounded-md">
          <p><strong>Provider ID:</strong> {providerId}</p>
          <p><strong>Category:</strong> {category}</p>
          <p><strong>Subcategories:</strong> {subcategory.join(', ') || 'None'}</p>
        </div>
      </div>
    </div>
  );
};

export default ServiceProviderDashboard;
