import React from 'react';
import { Button } from '@/components/ui/button';
import { EventListingForm } from '../EventListingForm';
import { Event } from '@/hooks/types/recommendationTypes';

interface EventFormWrapperProps {
  event: Event | null;
  onSaved: () => void;
  onCancel: () => void;
}

const EventFormWrapper: React.FC<EventFormWrapperProps> = ({ event, onSaved, onCancel }) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium">
          {event ? 'Edit Event' : 'Create New Event'}
        </h3>
        <Button variant="outline" size="sm" onClick={onCancel}>
          Back to Events
        </Button>
      </div>
      <EventListingForm 
        event={event || undefined} 
        onSaved={onSaved} 
        onCancel={onCancel}
      />
    </div>
  );
};

export default EventFormWrapper;
