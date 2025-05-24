import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StarRating from './StarRating';
import { UserCircle, Phone, MessageSquare, MapPin, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
interface SellerProfileCardProps {
  sellerName: string;
  sellerRating: number;
  reviewCount: number;
  joinedDate?: string;
  sellerPhone?: string | null;
  sellerWhatsapp?: string | null;
  location?: string;
  mapLink?: string | null;
  listingId?: string;
  avatarUrl?: string | null;
}
const SellerProfileCard: React.FC<SellerProfileCardProps> = ({
  sellerName,
  sellerRating,
  reviewCount,
  joinedDate,
  sellerPhone,
  sellerWhatsapp,
  location,
  mapLink,
  listingId,
  avatarUrl
}) => {
  const {
    toast
  } = useToast();
  const isMobile = useIsMobile();
  const formattedJoinedDate = joinedDate ? new Date(joinedDate).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  }) : 'Unknown';
  const getInitials = (name: string) => {
    return name.split(' ').map(part => part[0]).join('').toUpperCase().substring(0, 2);
  };
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(window.location.href).then(() => {
      toast({
        title: "Link copied to clipboard",
        description: "You can now share this profile with others",
        duration: 3000
      });
    }).catch(error => {
      console.error('Failed to copy:', error);
      toast({
        title: "Unable to copy link",
        description: "Please try again later",
        variant: "destructive",
        duration: 3000
      });
    });
  };
  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sellerPhone) {
      const link = document.createElement('a');
      link.href = `tel:${sellerPhone}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: "Calling seller",
        description: `Dialing ${sellerPhone}...`,
        duration: 2000
      });
    } else {
      toast({
        title: "Phone number not available",
        description: "The seller has not provided a phone number",
        variant: "destructive",
        duration: 3000
      });
    }
  };
  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sellerWhatsapp) {
      const message = `Hi, I'm interested in your listings. Are they still available?`;
      const whatsappUrl = `https://wa.me/${sellerWhatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
      const link = document.createElement('a');
      link.href = whatsappUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: "Opening WhatsApp",
        description: "Starting WhatsApp conversation...",
        duration: 2000
      });
    } else {
      toast({
        title: "WhatsApp not available",
        description: "The seller has not provided a WhatsApp number",
        variant: "destructive",
        duration: 3000
      });
    }
  };
  const handleLocation = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!location) {
      toast({
        title: "Location not available",
        description: "Location information is not available",
        variant: "destructive",
        duration: 3000
      });
      return;
    }
    let mapsUrl;
    if (mapLink && mapLink.trim() !== '') {
      mapsUrl = mapLink;
    } else if (location && (location.includes('google.com/maps') || location.includes('goo.gl/maps'))) {
      mapsUrl = location;
    } else {
      const destination = encodeURIComponent(location || '');
      if (isMobile && /iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        mapsUrl = `maps://maps.apple.com/?q=${destination}`;
      } else {
        mapsUrl = `https://www.google.com/maps/search/?api=1&query=${destination}`;
      }
    }
    const link = document.createElement('a');
    link.href = mapsUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: "Opening Directions",
      description: `Getting directions to location...`,
      duration: 2000
    });
  };
  return <Card className="shadow-md w-full overflow-hidden">
      <CardHeader className="pb-4 px-8 md:px-8 bg-muted/30">
        <CardTitle className="text-2xl font-bold">Seller Profile</CardTitle>
      </CardHeader>
      <CardContent className="px-6 md:px-8 py-5">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <Avatar className="h-32 w-32 border-4 border-background">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={sellerName} /> : <AvatarFallback className="bg-primary/10 text-primary text-4xl">
                {getInitials(sellerName)}
              </AvatarFallback>}
          </Avatar>
          
          <div className="space-y-4 text-center md:text-left w-full">
            <h3 className="font-bold text-2xl">{sellerName}</h3>
            
            <div className="flex items-center gap-1">
              <StarRating rating={sellerRating} size="medium" showCount={true} count={reviewCount} />
            </div>
            
            <div className="grid grid-cols-1 gap-y-3 pt-1">
              <div className="flex items-center gap-2 text-base">
                <UserCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <span>Member since {formattedJoinedDate}</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 mt-2 my-[10px] px-[38px]">
              <Button variant="outline" size="icon" onClick={handleCall} title="Call Seller" className="h-10 w-10 text-slate-50 bg-blue-600 hover:bg-blue-500 rounded">
                <Phone className="h-5 w-5" />
              </Button>
              
              <Button variant="outline" size="icon" onClick={handleWhatsApp} title="WhatsApp" className="h-10 w-10 text-slate-50 rounded bg-lime-600 hover:bg-lime-500">
                <MessageSquare className="h-5 w-5" />
              </Button>
              
              <Button variant="outline" size="icon" onClick={handleLocation} title="Get Directions" className="h-10 w-10 bg-amber-600 hover:bg-amber-500 rounded text-slate-50">
                <MapPin className="h-5 w-5" />
              </Button>
              
              <Button variant="outline" size="icon" onClick={handleShare} title="Share" className="h-10 w-10 bg-violet-600 hover:bg-violet-500 text-slate-50 rounded">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>;
};
export default SellerProfileCard;