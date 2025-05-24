import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit2, Eye, Trash2, Calendar, Clock, MapPin, Users, IndianRupee } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useNavigate } from 'react-router-dom';
import { Event } from '@/hooks/types/recommendationTypes';

interface UserEventCardProps {
  event: Event;
  onEdit: (event: Event) => void;
  onDelete: (eventId: string) => void;
}

const UserEventCard: React.FC<UserEventCardProps> = ({ event, onEdit, onDelete }) => {
  const navigate = useNavigate();

  // Format price to Indian Rupees
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <Card className="overflow-hidden">
      <div className="w-full h-40 overflow-hidden">
        <img 
          src={event.image} 
          alt={event.title} 
          className="w-full h-full object-cover transition-transform hover:scale-105"
        />
      </div>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="line-clamp-1">{event.title}</CardTitle>
          <Badge variant={event.pricePerPerson > 0 ? "outline" : "secondary"}>
            {event.pricePerPerson > 0 ? formatPrice(event.pricePerPerson) : "Free"}
          </Badge>
        </div>
        <CardDescription>
          Status: {event.approval_status === 'approved' ? 
            <span className="text-green-600 font-medium">Approved</span> : 
            <span className="text-amber-600 font-medium">Pending</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2 space-y-2">
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
          {event.date}
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
          {event.time}
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
          {event.location}
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Users className="w-4 h-4 mr-2 flex-shrink-0" />
          {event.attendees} attending
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button variant="outline" size="sm" onClick={() => navigate(`/events`)}>
          <Eye className="h-4 w-4 mr-1" /> View
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(event)}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" onClick={() => onDelete(event.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
        </div>
      </CardFooter>
    </Card>
  );
};

export default UserEventCard;
