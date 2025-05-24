import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StarRating from './StarRating';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
interface SellerInfoProps {
  sellerName: string;
  sellerRating: number;
  reviewCount?: number;
  sellerInstagram?: string | null;
  sellerId?: string | null;
  onInstagramClick?: (e: React.MouseEvent) => void;
  createdAt?: string;
  sellerRole?: 'owner' | 'dealer';
}
const SellerInfo: React.FC<SellerInfoProps> = ({
  sellerName,
  sellerRating,
  reviewCount = 0,
  sellerInstagram,
  sellerId,
  onInstagramClick,
  createdAt,
  sellerRole = 'owner'
}) => {
  const {
    toast
  } = useToast();
  const [actualRating, setActualRating] = useState<number>(sellerRating);
  const [actualReviewCount, setActualReviewCount] = useState<number>(reviewCount || 0);
  const [totalListings, setTotalListings] = useState<number>(0);
  useEffect(() => {
    if (sellerId) {
      fetchSellerRating(sellerId);
      fetchTotalListings(sellerId);
    }
  }, [sellerId]);
  const fetchSellerRating = async (sellerIdValue: string) => {
    try {
      const {
        data,
        error
      } = await supabase.from('seller_reviews').select('rating').eq('seller_id', sellerIdValue);
      if (error) {
        console.error('Error fetching seller reviews:', error);
        return;
      }
      if (data && data.length > 0) {
        const totalRating = data.reduce((sum, review) => sum + review.rating, 0);
        const avgRating = totalRating / data.length;
        setActualRating(Math.round(avgRating * 10) / 10);
        setActualReviewCount(data.length);
        console.log(`Fetched ${data.length} reviews for seller ${sellerIdValue}, actual rating: ${avgRating}`);
      } else {
        console.log(`No reviews found for seller ${sellerIdValue}`);
      }
    } catch (err) {
      console.error('Failed to fetch seller rating:', err);
    }
  };
  const fetchTotalListings = async (sellerIdValue: string) => {
    try {
      const {
        count,
        error
      } = await supabase.from('marketplace_listings').select('*', {
        count: 'exact',
        head: true
      }).eq('seller_id', sellerIdValue).eq('approval_status', 'approved');
      if (error) {
        console.error('Error fetching total listings:', error);
        return;
      }
      setTotalListings(count || 0);
    } catch (err) {
      console.error('Failed to fetch total listings:', err);
    }
  };
  const handleInstagramClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onInstagramClick) {
      onInstagramClick(e);
      return;
    }
    if (sellerInstagram) {
      console.log("Opening Instagram/video link:", sellerInstagram);
      window.open(sellerInstagram, '_blank');
      toast({
        title: "Opening video content",
        description: `Visiting ${sellerName}'s video content`,
        duration: 2000
      });
    } else {
      toast({
        title: "Video content not available",
        description: "The seller has not provided any video links",
        variant: "destructive",
        duration: 2000
      });
    }
  };
  const isVideoLink = sellerInstagram && (sellerInstagram.includes('youtube.com') || sellerInstagram.includes('vimeo.com') || sellerInstagram.includes('tiktok.com') || sellerInstagram.includes('instagram.com/reel'));
  return <div className="flex flex-col w-full">
      <div className="flex items-center justify-between w-full rounded bg-lime-300 py-[2px] mx-0 px-[5px]">
        <div className="flex items-center">
          <span className="text-xs mr-1 text-gray-950 px-0 mx-[5px]">seller</span>
          {sellerId ? <Link to={`/seller/${sellerId}`} onClick={e => e.stopPropagation()} className="text-xs font-bold hover:text-primary hover">
              {sellerName}
            </Link> : <span className="text-sm font-medium">{sellerName}</span>}
        </div>
        <Button variant="outline" size="sm" className="text-xs py-0 h-6 px-2 ml-2" asChild>
          <Link to={`/seller/${sellerId}`} onClick={e => e.stopPropagation()}>
            {totalListings} {totalListings === 1 ? 'listing' : 'listings'}
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-end w-full gap-2 px-[30px]">
        <Badge variant="default" className="text-white font-bold text-xs capitalize py-0 my-[3px] bg-violet-500 px-[18px] mx-[20px]">
          {sellerRole}
        </Badge>
        <StarRating rating={actualRating} showCount={true} count={actualReviewCount} size="small" />
      </div>
    </div>;
};
export default SellerInfo;