
import React from 'react';
import { Phone, MessageSquare, MapPin, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface BusinessActionButtonsProps {
  businessId: string;
  name: string;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  location: string;
  mapLink?: string | null;
}

const BusinessActionButtons: React.FC<BusinessActionButtonsProps> = ({
  businessId,
  name,
  phone,
  whatsapp,
  instagram,
  location,
  mapLink
}) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    navigator.clipboard.writeText(window.location.origin + `/business/${businessId}`).then(() => {
      toast({
        title: "Link copied to clipboard",
        description: "You can now share this business with others",
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
    console.log('Call button clicked. Phone:', phone, 'Business:', name);
    
    if (phone && phone.trim()) {
      // Clean the phone number - remove any non-digit characters except +
      const cleanPhone = phone.replace(/[^\d+]/g, '');
      console.log('Cleaned phone number:', cleanPhone);
      
      try {
        const link = document.createElement('a');
        link.href = `tel:${cleanPhone}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Calling business",
          description: `Dialing ${phone}...`,
          duration: 2000
        });
      } catch (error) {
        console.error('Error initiating call:', error);
        toast({
          title: "Call failed",
          description: "Unable to initiate call. Please try again.",
          variant: "destructive",
          duration: 3000
        });
      }
    } else {
      console.log('No phone number available for business:', name);
      toast({
        title: "Phone number not available",
        description: "This business has not provided a phone number",
        variant: "destructive",
        duration: 3000
      });
    }
  };
  
  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (whatsapp) {
      const message = `Hi, I found your business "${name}" and would like more information.`;
      const whatsappUrl = `https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
      
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
        description: "This business has not provided a WhatsApp number",
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
      description: `Getting directions to ${name}...`,
      duration: 2000
    });
  };
  
  return (
    <div className="flex justify-between items-center gap-2 mt-4">
      <button 
        onClick={handleCall} 
        title="Call Business" 
        aria-label="Call business" 
        className="flex-1 h-10 text-white transition-all flex items-center justify-center gap-1 shadow-[0_3px_0px_0px_rgba(30,174,219,0.15)] hover:shadow-[0_2px_0px_0px_rgba(24,128,163,0.8)] active:shadow-none active:translate-y-[2px] bg-blue-600 hover:bg-blue-500 rounded"
      >
        <Phone className="h-4 w-4" />
        <span className="text-xs">Call</span>
      </button>
      
      <button 
        onClick={handleWhatsApp} 
        title="WhatsApp" 
        aria-label="Contact on WhatsApp" 
        className="flex-1 h-10 border border-[#1EAEDB]/20 transition-all flex items-center justify-center shadow-[0_3px_0px_0px_rgba(30,174,219,0.15)] hover:shadow-[0_2px_0px_0px_rgba(30,174,219,0.15)] active:shadow-none active:translate-y-[2px] bg-lime-600 hover:bg-lime-500 text-slate-50 rounded"
      >
        <MessageSquare className="h-4 w-4" />
      </button>
      
      <button 
        onClick={handleLocation} 
        title="View Location" 
        aria-label="View location" 
        className="flex-1 h-10 border border-[#1EAEDB]/20 transition-all flex items-center justify-center shadow-[0_3px_0px_0px_rgba(30,174,219,0.15)] hover:shadow-[0_2px_0px_0px_rgba(30,174,219,0.15)] active:shadow-none active:translate-y-[2px] rounded bg-amber-700 hover:bg-amber-600 text-slate-50"
      >
        <MapPin className="h-4 w-4" />
      </button>
      
      <button 
        onClick={handleShare} 
        title="Share" 
        aria-label="Share business" 
        className="flex-1 h-10 border border-[#1EAEDB]/20 transition-all flex items-center justify-center shadow-[0_3px_0px_0px_rgba(30,174,219,0.15)] hover:shadow-[0_2px_0px_0px_rgba(30,174,219,0.15)] active:shadow-none active:translate-y-[2px] bg-violet-600 hover:bg-violet-500 rounded text-slate-50"
      >
        <Share2 className="h-4 w-4" />
      </button>
    </div>
  );
};

export default BusinessActionButtons;
