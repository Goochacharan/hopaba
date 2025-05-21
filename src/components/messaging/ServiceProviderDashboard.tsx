
import React from 'react';
import ProviderInbox from '@/components/business/ProviderInbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ServiceProviderDashboardProps {
  providerId: string;
  category: string;
  subcategory: string[];
}

// Component that properly handles subcategory as an array
const ServiceProviderDashboard: React.FC<ServiceProviderDashboardProps> = ({
  providerId,
  category,
  subcategory
}) => {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/50 pb-4">
          <CardTitle className="text-lg">Matching Service Requests</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <ProviderInbox 
            providerId={providerId}
            category={category}
            subcategory={subcategory}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceProviderDashboard;
