
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatDistanceToNow } from 'date-fns';
import { Event } from '@/hooks/usePendingListings';

interface PendingEventsProps {
  events: Event[];
  loading: boolean;
  error: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRefresh: () => void;
}

export const PendingEvents: React.FC<PendingEventsProps> = ({
  events,
  loading,
  error,
  onApprove,
  onReject,
  onRefresh
}) => {
  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg bg-muted/30">
        <p className="text-muted-foreground">No pending events to review.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Pending Events</h2>
        <Button size="sm" variant="outline" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event Title</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id}>
              <TableCell className="font-medium max-w-[200px] truncate">
                {event.title}
              </TableCell>
              <TableCell>{event.date || 'N/A'}</TableCell>
              <TableCell>{event.location || 'N/A'}</TableCell>
              <TableCell>{formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-green-600 hover:text-green-700 hover:bg-green-50" 
                    onClick={() => onApprove(event.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-red-600 hover:text-red-700 hover:bg-red-50" 
                    onClick={() => onReject(event.id)}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
