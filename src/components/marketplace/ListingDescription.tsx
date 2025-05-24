
import React from 'react';
import { format, differenceInDays } from 'date-fns';
import { Instagram, Film, Sparkles, MapPin, Link2, Tag } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import CertificateBadge from './CertificateBadge';

interface ListingDescriptionProps {
  description: string;
  category: string;
  condition: string;
  location: string;
  createdAt: string;
  instagram?: string | null;
  mapLink?: string | null;
  showMetadata?: boolean;
  priceUnit?: string;
  experience?: string;
  tags?: string[];
  inspectionCertificates?: string[];
  isNegotiable?: boolean;
}

const ListingDescription: React.FC<ListingDescriptionProps> = ({
  description,
  category,
  condition,
  location,
  createdAt,
  instagram,
  mapLink,
  showMetadata = false,
  priceUnit,
  experience,
  tags,
  inspectionCertificates = [],
  isNegotiable
}) => {
  const isVideoContent = instagram && (instagram.includes('youtube.com') || instagram.includes('vimeo.com') || instagram.includes('tiktok.com'));
  const isNew = differenceInDays(new Date(), new Date(createdAt)) < 7;
  const isSearchPage = window.location.pathname.includes('/search');
  const hasCertificates = inspectionCertificates && inspectionCertificates.length > 0;

  return (
    <div className="bg-white rounded-xl border p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold mb-3">Description</h2>
        {isNew && (
          <div className="text-white text-xs font-semibold px-2 py-0.5 rounded flex items-center gap-1 mb-3 bg-fuchsia-700">
            <Sparkles className="h-2.5 w-2.5" />
            <span className="text-[10px]">New post</span>
          </div>
        )}
        
        {/* Show certificate badge in the description header too if available */}
        {hasCertificates && (
          <div className="mb-3">
            <CertificateBadge certificates={inspectionCertificates} />
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        <div className="relative">
          <ScrollArea className="h-[300px] pr-3">
            <p className="whitespace-pre-line leading-relaxed text-base font-normal text-slate-900">
              {description}
            </p>
            
            {showMetadata && (
              <div className="mt-6 space-y-4 text-sm text-gray-700">
                {priceUnit && <p>
                    <span className="font-semibold">Pricing:</span> {priceUnit}
                  </p>}
                
                {experience && <p>
                    <span className="font-semibold">Experience:</span> {experience} years
                  </p>}
                
                {tags && tags.length > 0 && <div className="space-y-2">
                    <p className="font-semibold flex items-center gap-1">
                      <Tag className="h-3.5 w-3.5" />
                      Services/Items:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {tags.map(tag => <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>)}
                    </div>
                  </div>}
                
                {mapLink && <div className="flex items-center gap-2 mt-4">
                    <MapPin className="h-4 w-4 text-primary" />
                    <a href={mapLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      View on Google Maps
                    </a>
                  </div>}
                
                {instagram && <div className="flex items-center gap-2 mt-2">
                    {isVideoContent ? <Film className="h-4 w-4 text-purple-500" /> : <Instagram className="h-4 w-4 text-pink-500" />}
                    <a href={instagram.startsWith('http') ? instagram : `https://instagram.com/${instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {isVideoContent ? 'View Video Content' : 'Visit Instagram'}
                    </a>
                  </div>}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default ListingDescription;
