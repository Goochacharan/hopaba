
import React from 'react';
import { AlertDialog } from "@/components/ui/alert-dialog";
import EventsListHeader from './user-events/EventsListHeader';
import EmptyEventState from './user-events/EmptyEventState';
import LoadingEvents from './user-events/LoadingEvents';
import EventFormWrapper from './user-events/EventFormWrapper';
import UserEventCard from './user-events/UserEventCard';
import DeleteEventDialog from './user-events/DeleteEventDialog';
import { useUserEvents } from './user-events/useUserEvents';

const UserEventListings: React.FC = () => {
  const {
    loading,
    events,
    eventToDelete,
    setEventToDelete,
    showAddForm,
    setShowAddForm,
    eventToEdit,
    handleDeleteConfirm,
    handleEdit,
    handleEventSaved
  } = useUserEvents();

  if (showAddForm) {
    return (
      <EventFormWrapper 
        event={eventToEdit} 
        onSaved={handleEventSaved} 
        onCancel={() => {
          setShowAddForm(false);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <EventsListHeader 
        eventCount={events.length} 
        onCreateEvent={() => setShowAddForm(true)} 
      />

      {loading ? (
        <LoadingEvents />
      ) : events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((event) => (
            <AlertDialog key={event.id}>
              <UserEventCard 
                event={event} 
                onEdit={handleEdit} 
                onDelete={setEventToDelete} 
              />
              {eventToDelete === event.id && (
                <DeleteEventDialog onConfirm={handleDeleteConfirm} />
              )}
            </AlertDialog>
          ))}
        </div>
      ) : (
        <EmptyEventState onCreateEvent={() => setShowAddForm(true)} />
      )}
    </div>
  );
};

export default UserEventListings;
