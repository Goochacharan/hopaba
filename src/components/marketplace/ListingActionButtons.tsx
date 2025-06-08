import React from 'react';
import { Phone, MessageSquare, MapPin, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
interface ListingActionButtonsProps {
  listingId: string;
  title: string;
  price: number;
  sellerPhone: string | null;
  sellerWhatsapp: string | null;
  sellerInstagram: string | null;
  location: string;
  mapLink?: string | null;
  businessName?: string;
}
const ListingActionButtons: React.FC<ListingActionButtonsProps> = ({
  listingId,
  title,
  price,
  sellerPhone,
  sellerWhatsapp,
  sellerInstagram,
  location,
  mapLink,
  businessName
}) => {
  const {
    toast
  } = useToast();
  const isMobile = useIsMobile();
  const formatPrice = (price: number): string => {
    return '₹' + price.toLocaleString('en-IN');
  };
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Skip navigator.share which causes errors in iframe environments
    // Go directly to clipboard approach
    navigator.clipboard.writeText(window.location.origin + `/marketplace/${listingId}`).then(() => {
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
  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sellerPhone) {
      // Instead of changing window.location which might not work in some environments,
      // create a temporary link element and click it
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

      // Use the safer approach with a temporary link
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

    // Normalize and clean the location data
    const cleanLocation = location?.trim() || '';
    const cleanMapLink = mapLink?.trim() || '';

    // Priority order for location handling:
    // 1. Use explicit map link if provided
    // 2. Use location if it's a maps URL
    // 3. Use geocoding search as fallback
    
    if (cleanMapLink !== '') {
      // If map link is provided, ensure it's a proper Google Maps URL
      if (cleanMapLink.includes('goo.gl') || cleanMapLink.includes('maps.app.goo.gl')) {
        // For short links, convert to search URL
        const searchQuery = encodeURIComponent(cleanLocation || businessName || '');
        mapsUrl = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
      } else {
        mapsUrl = cleanMapLink;
      }
    } else if (cleanLocation.includes('google.com/maps') || cleanLocation.includes('goo.gl/maps')) {
      // If location is a maps URL
      if (cleanLocation.includes('goo.gl')) {
        // Convert short link to search
        const searchQuery = encodeURIComponent(businessName || cleanLocation);
        mapsUrl = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
      } else {
        mapsUrl = cleanLocation;
      }
    } else {
      // Fallback to search URL
      const searchQuery = encodeURIComponent(cleanLocation || businessName || '');
      if (isMobile && /iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        // Use Apple Maps on iOS devices
        mapsUrl = `maps://maps.apple.com/?q=${searchQuery}`;
      } else {
        // Use Google Maps search
        mapsUrl = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
      }
    }

    // Open the maps URL in a new tab
    const link = document.createElement('a');
    link.href = mapsUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Opening Directions",
      description: `Getting directions to ${businessName || 'location'}...`,
      duration: 2000
    });
  };
  return <div className="flex justify-between items-center gap-2 mt-4">
      <button onClick={handleCall} title="Call Seller" aria-label="Call seller" className="flex-1 h-12 text-white transition-all flex items-center justify-center shadow-[0_5px_0px_0px_rgba(30,174,219,0.15)] hover:shadow-[0_3px_0px_0px_rgba(24,128,163,0.8)] active:shadow-none active:translate-y-[3px] bg-blue-600 hover:bg-blue-500 rounded">
        <Phone className="h-5 w-5" />
      </button>
      
      <button onClick={handleWhatsApp} title="WhatsApp" aria-label="Contact on WhatsApp" className="flex-1 h-12 border border-[#1EAEDB]/20 transition-all flex items-center justify-center shadow-[0_5px_0px_0px_rgba(30,174,219,0.15)] hover:shadow-[0_3px_0px_0px_rgba(30,174,219,0.15)] active:shadow-none active:translate-y-[3px] bg-lime-600 hover:bg-lime-500 text-slate-50 rounded">
        <MessageSquare className="h-5 w-5" />
      </button>
      
      <button onClick={handleLocation} title="View Location" aria-label="View location" className="flex-1 h-12 border border-[#1EAEDB]/20 transition-all flex items-center justify-center shadow-[0_5px_0px_0px_rgba(30,174,219,0.15)] hover:shadow-[0_3px_0px_0px_rgba(30,174,219,0.15)] active:shadow-none active:translate-y-[3px] rounded bg-amber-700 hover:bg-amber-600 text-slate-50">
        <MapPin className="h-5 w-5" />
      </button>
      
      <button onClick={handleShare} title="Share" aria-label="Share listing" className="flex-1 h-12 border border-[#1EAEDB]/20 transition-all flex items-center justify-center shadow-[0_5px_0px_0px_rgba(30,174,219,0.15)] hover:shadow-[0_3px_0px_0px_rgba(30,174,219,0.15)] active:shadow-none active:translate-y-[3px] bg-violet-600 hover:bg-violet-500 rounded text-slate-50">
        <Share2 className="h-5 w-5" />
      </button>
    </div>;
};
export default ListingActionButtons;