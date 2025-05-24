
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Minus } from 'lucide-react';

interface SellerDetails {
  seller_name: string;
  listing_limit: number;
}

const SellerListingLimits = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [sellerDetails, setSellerDetails] = useState<SellerDetails | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const searchSeller = async () => {
    if (!phoneNumber) return;
    
    setLoading(true);
    try {
      const formattedPhone = phoneNumber.replace(/\D/g, '');
      
      let { data, error } = await supabase
        .from('sellers')
        .select('seller_name, listing_limit')
        .eq('seller_phone', formattedPhone)
        .maybeSingle();
      
      if (!data) {
        const withPrefix = `+91${formattedPhone}`;
        ({ data, error } = await supabase
          .from('sellers')
          .select('seller_name, listing_limit')
          .eq('seller_phone', withPrefix)
          .maybeSingle());
      }
      
      if (!data && formattedPhone.length >= 10) {
        const last10Digits = formattedPhone.slice(-10);
        ({ data, error } = await supabase
          .from('sellers')
          .select('seller_name, listing_limit')
          .ilike('seller_phone', `%${last10Digits}`)
          .maybeSingle());
      }

      if (data) {
        setSellerDetails(data);
      } else {
        toast({
          title: "Error",
          description: "Seller not found with this phone number.",
          variant: "destructive",
        });
        setSellerDetails(null);
      }
    } catch (err: any) {
      console.error('Error fetching seller:', err);
      toast({
        title: "Error",
        description: "Failed to search for seller. Please try again.",
        variant: "destructive",
      });
      setSellerDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLimit = async (increment: boolean) => {
    if (!user || !phoneNumber || !sellerDetails) return;

    setLoading(true);
    try {
      // First, retrieve the exact seller record with the current listing limit
      const formattedPhone = phoneNumber.replace(/\D/g, '');
      const newLimit = increment ? sellerDetails.listing_limit + 1 : 5;
      
      // Try different phone number formats to find the matching record
      let matched = false;
      let updateResult = null;
      
      // Try exact match
      updateResult = await supabase
        .from('sellers')
        .update({ listing_limit: newLimit })
        .eq('seller_phone', formattedPhone);
        
      if (updateResult?.count > 0) {
        matched = true;
      }
      
      // Try with +91 prefix
      if (!matched) {
        updateResult = await supabase
          .from('sellers')
          .update({ listing_limit: newLimit })
          .eq('seller_phone', `+91${formattedPhone}`);
          
        if (updateResult?.count > 0) {
          matched = true;
        }
      }
      
      // Try with last 10 digits for partial match
      if (!matched && formattedPhone.length >= 10) {
        const last10Digits = formattedPhone.slice(-10);
        // First find the exact record that matches the pattern
        const { data } = await supabase
          .from('sellers')
          .select('seller_phone')
          .ilike('seller_phone', `%${last10Digits}%`)
          .maybeSingle();
          
        if (data?.seller_phone) {
          // Then update that specific record
          updateResult = await supabase
            .from('sellers')
            .update({ listing_limit: newLimit })
            .eq('seller_phone', data.seller_phone);
            
          if (updateResult?.count > 0) {
            matched = true;
          }
        }
      }
      
      if (!matched) {
        throw new Error("Failed to update seller listing limit. No matching seller record found.");
      }

      // Update the local state to show the new limit
      setSellerDetails({
        ...sellerDetails,
        listing_limit: newLimit
      });

      // Search again to make sure we have the latest data
      await searchSeller();

      toast({
        title: "Success",
        description: `Listing limit ${increment ? 'increased' : 'reset'} for seller.`,
      });
    } catch (err: any) {
      console.error('Error updating listing limit:', err);
      toast({
        title: "Error",
        description: "Failed to update listing limit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <h3 className="text-lg font-medium">Update Seller Listing Limit</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
        <div className="flex items-center">
          <span className="mr-2 text-muted-foreground">+91</span>
          <Input
            type="text"
            placeholder="Enter seller phone number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="flex-1"
          />
        </div>
        <Button
          onClick={searchSeller}
          disabled={loading || !phoneNumber}
          variant="secondary"
          className="gap-1"
        >
          <Search className="h-4 w-4" /> Search
        </Button>
      </div>

      {sellerDetails && (
        <div className="space-y-4 p-4 border rounded-md bg-muted/50">
          <div className="space-y-2">
            <p className="text-sm font-medium">Seller Name: {sellerDetails.seller_name}</p>
            <p className="text-sm font-medium">Current Listing Limit: {sellerDetails.listing_limit}</p>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => handleUpdateLimit(true)}
              disabled={loading}
              className="gap-1"
            >
              <Plus className="h-4 w-4" /> Increase by 1
            </Button>
            <Button
              onClick={() => handleUpdateLimit(false)}
              disabled={loading || sellerDetails.listing_limit === 5}
              variant="destructive"
              className="gap-1"
            >
              <Minus className="h-4 w-4" /> Reset to 5
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerListingLimits;
