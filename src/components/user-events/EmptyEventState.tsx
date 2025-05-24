
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface EmptyEventStateProps {
  onCreateEvent: () => void;
}

const EmptyEventState: React.FC<EmptyEventStateProps> = ({ onCreateEvent }) => {
  return (
    <div className="text-center py-12 bg-muted/30 rounded-lg border border-border">
      <h3 className="text-lg font-medium mb-2">No events yet</h3>
      <p className="text-muted-foreground mb-4">
        Create your first event to reach more people in your community.
      </p>
      <Button onClick={onCreateEvent}>
        <Plus className="mr-2 h-4 w-4" /> Create Event
      </Button>
    </div>
  );
};

export default EmptyEventState;
