
import React from 'react';
import { Button } from '@/components/ui/button';
import { Event } from '@/hooks/types/recommendationTypes';
import { cn } from '@/lib/utils';
import { Calendar, Clock, MapPin, User, Sparkles, Award } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

interface EventCardProps {
  event: Event;
  className?: string;
  onRSVP?: (eventId: string) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, className, onRSVP }) => {
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMMM d, yyyy');
    } catch (error) {
      // Fallback to original string if date parsing fails
      return dateString;
    }
  };

  return (
    <Card className={cn("overflow-hidden transition-all duration-200 h-full", className)}>
      <div className="relative aspect-video overflow-hidden">
        <img 
          src={event.image || '/placeholder.svg'} 
          alt={event.title} 
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        
        <div className="absolute bottom-3 left-3 z-10 flex flex-col gap-2">
          {event.isHiddenGem && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-500/90 backdrop-blur-sm text-white flex items-center">
              <Sparkles className="h-3 w-3 mr-1" />
              Hidden Gem
            </span>
          )}
          {event.isMustVisit && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-500/90 backdrop-blur-sm text-white flex items-center">
              <Award className="h-3 w-3 mr-1" />
              Must Visit
            </span>
          )}
        </div>
      </div>
      
      <CardHeader className="px-4 py-3 border-b">
        <h3 className="text-lg font-semibold line-clamp-1">{event.title}</h3>
      </CardHeader>
      
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <span className="text-sm">{formatDate(event.date)}</span>
        </div>
        
        <div className="flex items-start gap-2">
          <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <span className="text-sm">{event.time}</span>
        </div>
        
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <span className="text-sm line-clamp-1">{event.location}</span>
        </div>
        
        {event.attendees > 0 && (
          <div className="flex items-start gap-2">
            <User className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <span className="text-sm">{event.attendees} attending</span>
          </div>
        )}
        
        {event.pricePerPerson !== undefined && event.pricePerPerson > 0 && (
          <div className="mt-2 text-sm font-medium">
            ₹{event.pricePerPerson} per person
          </div>
        )}
        
        <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{event.description}</p>
      </CardContent>
      
      <CardFooter className="px-4 py-3 border-t">
        {onRSVP && (
          <Button 
            onClick={() => onRSVP(event.id)} 
            className="w-full"
            variant="outline"
          >
            RSVP Now
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default EventCard;
