
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { FileSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const ServiceRequestsTab: React.FC = () => {
  const navigate = useNavigate();
  const handleViewServiceRequests = () => {
    navigate('/provider-requests');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Provider Dashboard</CardTitle>
        <CardDescription>Manage service requests for your businesses</CardDescription>
      </CardHeader>
      <CardContent className="text-center py-8">
        <FileSearch className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">View and respond to service requests</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Check service requests from users that match your business categories and send them quotations.
        </p>
        <Button onClick={handleViewServiceRequests} className="flex items-center gap-2 mx-auto">
          <FileSearch className="h-4 w-4" />
          Open Service Requests Dashboard
        </Button>
      </CardContent>
    </Card>
  );
};

export default ServiceRequestsTab;
