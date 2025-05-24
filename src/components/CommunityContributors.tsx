import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import CommunityNotesPopup from './location/CommunityNotesPopup';

export interface Contributor {
  id: string;
  user_id: string;
  avatar_url?: string;
  user_display_name?: string;
}

interface CommunityContributorsProps {
  contributors: Contributor[];
  total: number;
  maxDisplayed?: number;
  locationId?: string;
  onClick?: (e: React.MouseEvent) => void;
}

const CommunityContributors: React.FC<CommunityContributorsProps> = ({
  contributors,
  total,
  maxDisplayed = 8,
  locationId,
  onClick
}) => {
  const displayedContributors = contributors.slice(0, maxDisplayed);
  const [popupOpen, setPopupOpen] = useState(false);
  
  const handleClick = (e: React.MouseEvent) => {
    // If locationId is provided, open the popup
    if (locationId) {
      e.stopPropagation();
      setPopupOpen(true);
      return;
    }
    
    // Otherwise use the provided onClick handler
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <>
      <button onClick={handleClick} className="flex items-center gap-1 hover:opacity-90 transition-opacity px-[6px] mx-[52px] text-lg font-normal">
        <div className="flex -space-x-3">
          {displayedContributors.map((contributor, index) => (
            <Avatar key={contributor.id} className="w-6 h-6 border-2 border-white rounded-full bg-muted">
              {contributor.avatar_url ? (
                <AvatarImage src={contributor.avatar_url} alt={contributor.user_display_name || 'Contributor'} />
              ) : (
                <AvatarFallback>
                  <User className="h-3 w-3" />
                </AvatarFallback>
              )}
            </Avatar>
          ))}
        </div>
        <span className="text-sm text-muted-foreground">({total})</span>
      </button>
      
      {locationId && (
        <CommunityNotesPopup
          locationId={locationId}
          isOpen={popupOpen}
          onClose={() => setPopupOpen(false)}
        />
      )}
    </>
  );
};

export default CommunityContributors;
