
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, MessageSquare, MapPin, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import StarRating from './StarRating';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

interface SellerDetailsCardProps {
  id: string;
  title: string;
  price: number;
  sellerId: string;
  sellerName: string;
  sellerRating: number;
  sellerPhone: string | null;
  sellerWhatsapp: string | null;
  sellerInstagram: string | null;
  location: string;
  createdAt: string;
  mapLink?: string | null;
  reviewCount?: number;
  avatarUrl?: string | null;
  inspectionCertificates?: string[] | null;
  isNegotiable?: boolean;
}

const SellerDetailsCard: React.FC<SellerDetailsCardProps> = ({
  id,
  title,
  price,
  sellerId,
  sellerName,
  sellerRating,
  sellerPhone,
  sellerWhatsapp,
  sellerInstagram,
  location,
  createdAt,
  mapLink,
  reviewCount = 0,
  avatarUrl,
  inspectionCertificates
}) => {
  const {
    toast
  } = useToast();
  const isMobile = useIsMobile();
  
  const formatPrice = (price: number): string => {
    return '₹' + price.toLocaleString('en-IN');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(part => part[0]).join('').toUpperCase().substring(0, 2);
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
      const message = `Hi, I'm interested in your listing "${title}" for ${formatPrice(price)}. Is it still available?`;
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

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(window.location.href).then(() => {
      toast({
        title: "Link copied to clipboard",
        description: "You can now share this listing with others",
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

  return <Card className="bg-white shadow-sm border rounded-xl overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="font-semibold text-sm">Seller Information</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border border-border">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={sellerName} />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(sellerName)}
              </AvatarFallback>
            )}
          </Avatar>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="font-semibold">{sellerName}</span>
              <Link to={`/seller/${sellerId}`} className="text-xs text-primary hover:underline ml-1">
                View Profile
              </Link>
            </div>
            
            <div className="flex items-center mt-1">
              <StarRating rating={sellerRating} size="small" showCount={true} count={reviewCount} />
              <span className="text-xs text-muted-foreground ml-2">
                Member since {format(new Date(createdAt), 'MMM yyyy')}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center gap-2 mt-4">
          <Button onClick={handleCall} title="Call Seller" className="flex-1 h-12 text-white transition-all flex items-center justify-center shadow-[0_5px_0px_0px_rgba(24,128,163,0.8)] hover:shadow-[0_3px_0px_0px_rgba(24,128,163,0.8)] active:shadow-none active:translate-y-[3px] bg-blue-600 hover:bg-blue-500 rounded">
            <Phone className="h-5 w-5" />
          </Button>
          
          <Button onClick={handleWhatsApp} title="WhatsApp" className="flex-1 h-12 border border-[#1EAEDB]/20 transition-all flex items-center justify-center shadow-[0_5px_0px_0px_rgba(30,174,219,0.15)] hover:shadow-[0_3px_0px_0px_rgba(30,174,219,0.15)] active:shadow-none active:translate-y-[3px] bg-lime-600 hover:bg-lime-500 text-slate-50 rounded">
            <MessageSquare className="h-5 w-5" />
          </Button>
          
          <Button onClick={handleLocation} title="Get Directions" className="flex-1 h-12 border border-[#1EAEDB]/20 transition-all flex items-center justify-center shadow-[0_5px_0px_0px_rgba(30,174,219,0.15)] hover:shadow-[0_3px_0px_0px_rgba(30,174,219,0.15)] active:shadow-none active:translate-y-[3px] bg-amber-600 hover:bg-amber-500 rounded text-slate-50">
            <MapPin className="h-5 w-5" />
          </Button>
          
          <Button onClick={handleShare} title="Share Listing" className="flex-1 h-12 border border-[#1EAEDB]/20 transition-all flex items-center justify-center shadow-[0_5px_0px_0px_rgba(30,174,219,0.15)] hover:shadow-[0_3px_0px_0px_rgba(30,174,219,0.15)] active:shadow-none active:translate-y-[3px] bg-violet-700 hover:bg-violet-600 text-white rounded">
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>;
};

export default SellerDetailsCard;
