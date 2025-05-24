
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface EventsListHeaderProps {
  eventCount: number;
  onCreateEvent: () => void;
}

const EventsListHeader: React.FC<EventsListHeaderProps> = ({ eventCount, onCreateEvent }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h3 className="text-lg font-medium">Your Event Listings</h3>
        <p className="text-muted-foreground text-sm">
          {eventCount} events listed
        </p>
      </div>
      <Button 
        onClick={onCreateEvent} 
        className="flex items-center gap-1.5"
      >
        <Plus className="h-4 w-4" />
        Create Event
      </Button>
    </div>
  );
};

export default EventsListHeader;
