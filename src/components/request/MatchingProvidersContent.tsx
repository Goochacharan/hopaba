
import React from 'react';
import MatchingProvidersDialog from './MatchingProvidersDialog';
import { useServiceRequests } from '@/hooks/useServiceRequests';

interface MatchingProvidersContentProps {
  requestId: string;
}

export const MatchingProvidersContent: React.FC<MatchingProvidersContentProps> = ({ requestId }) => {
  const { userRequests } = useServiceRequests();
  
  // Find the request by ID
  const request = userRequests?.find(req => req.id === requestId);
  
  if (!request) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Request not found.</p>
      </div>
    );
  }

  // Return the content that was previously inside the "providers" tab
  return (
    <MatchingProvidersDialog
      open={true}
      onOpenChange={() => {}} // This is managed by the parent component
      request={request}
    />
  );
};

export default MatchingProvidersContent;
