
import React from 'react';
import { Button } from '@/components/ui/button';
import { Phone, MapPin, Instagram, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BusinessActionButtonsProps {
  businessId: string;
  name: string;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  location?: string;
  mapLink?: string;
  hasVideo?: boolean;
}

const BusinessActionButtons: React.FC<BusinessActionButtonsProps> = ({
  businessId,
  name,
  phone,
  whatsapp,
  instagram,
  location,
  mapLink,
  hasVideo = false
}) => {
  const { toast } = useToast();

  const handlePhoneCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (phone) {
      const telLink = `tel:${phone}`;
      window.open(telLink);
      toast({
        title: "Calling business",
        description: `Dialing ${name}'s phone number`,
        duration: 2000
      });
    } else {
      toast({
        title: "Phone number not available",
        description: "This business has not provided a phone number",
        variant: "destructive",
        duration: 2000
      });
    }
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (whatsapp) {
      const phoneNumber = whatsapp.replace(/[^0-9+]/g, "");
      const whatsappLink = `https://wa.me/${phoneNumber}`;
      window.open(whatsappLink);
      toast({
        title: "Opening WhatsApp",
        description: `Connecting to ${name} on WhatsApp`,
        duration: 2000
      });
    } else {
      toast({
        title: "WhatsApp not available",
        description: "This business has not provided a WhatsApp number",
        variant: "destructive",
        duration: 2000
      });
    }
  };

  const handleMap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (mapLink) {
      window.open(mapLink);
      toast({
        title: "Opening maps",
        description: `Showing ${name}'s location`,
        duration: 2000
      });
    } else if (location) {
      const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
      window.open(googleMapsLink);
      toast({
        title: "Opening maps",
        description: `Searching for ${name} in ${location}`,
        duration: 2000
      });
    } else {
      toast({
        title: "Location not available",
        description: "This business has not provided location information",
        variant: "destructive",
        duration: 2000
      });
    }
  };

  const handleInstagram = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (instagram) {
      // Check if it's a URL or username
      if (instagram.startsWith("http")) {
        window.open(instagram);
      } else {
        const username = instagram.replace('@', '');
        window.open(`https://instagram.com/${username}`);
      }
      toast({
        title: "Opening Instagram",
        description: `Visiting ${name}'s Instagram profile`,
        duration: 2000
      });
    } else {
      toast({
        title: "Instagram not available",
        description: "This business has not provided an Instagram profile",
        variant: "destructive",
        duration: 2000
      });
    }
  };

  const handleVideoContent = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (instagram && hasVideo) {
      window.open(instagram);
      toast({
        title: "Opening video content",
        description: `Viewing ${name}'s video content`,
        duration: 2000
      });
    } else {
      toast({
        title: "Video content not available",
        description: "This business has not provided any video content",
        variant: "destructive",
        duration: 2000
      });
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-border">
      {phone && (
        <Button 
          size="sm" 
          variant="outline" 
          className="flex-1 min-w-0" 
          onClick={handlePhoneCall}
        >
          <Phone className="h-4 w-4 mr-2" />
          <span className="truncate">Call</span>
        </Button>
      )}
      
      {whatsapp && (
        <Button 
          size="sm" 
          variant="outline" 
          className="flex-1 min-w-0 text-green-600 border-green-200 hover:bg-green-50" 
          onClick={handleWhatsApp}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 mr-2" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
          <span className="truncate">WhatsApp</span>
        </Button>
      )}
      
      {(location || mapLink) && (
        <Button 
          size="sm" 
          variant="outline" 
          className="flex-1 min-w-0" 
          onClick={handleMap}
        >
          <MapPin className="h-4 w-4 mr-2" />
          <span className="truncate">Map</span>
        </Button>
      )}
      
      {instagram && (
        <Button 
          size="sm" 
          variant="outline" 
          className="flex-1 min-w-0 text-pink-600 border-pink-200 hover:bg-pink-50" 
          onClick={handleInstagram}
        >
          <Instagram className="h-4 w-4 mr-2" />
          <span className="truncate">Instagram</span>
        </Button>
      )}
      
      {instagram && hasVideo && (
        <Button 
          size="sm" 
          variant="outline" 
          className="flex-1 min-w-0 text-red-600 border-red-200 hover:bg-red-50" 
          onClick={handleVideoContent}
        >
          <Video className="h-4 w-4 mr-2" />
          <span className="truncate">Video</span>
        </Button>
      )}
    </div>
  );
};

export default BusinessActionButtons;
