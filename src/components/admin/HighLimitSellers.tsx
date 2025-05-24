
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';

interface HighLimitSeller {
  user_id: string;
  max_listings: number;
  updated_at: string;
  seller_names: string[];
  seller_phones: string[];
  current_listing_count: number;
}

const HighLimitSellers = () => {
  const { data: sellers, isLoading } = useQuery({
    queryKey: ['highLimitSellers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('high_limit_sellers')
        .select('*');
      
      if (error) throw error;
      return data as HighLimitSeller[];
    },
  });

  if (isLoading) {
    return <div className="text-center py-4">Loading sellers...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">High Limit Sellers</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Seller Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead className="text-right">Limit</TableHead>
            <TableHead className="text-right">Used</TableHead>
            <TableHead>Last Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sellers?.map((seller) => (
            <TableRow key={seller.user_id}>
              <TableCell>{seller.seller_names[0]}</TableCell>
              <TableCell>{seller.seller_phones[0]}</TableCell>
              <TableCell className="text-right">{seller.max_listings}</TableCell>
              <TableCell className="text-right">{seller.current_listing_count}</TableCell>
              <TableCell>
                {format(new Date(seller.updated_at), 'MMM d, yyyy')}
              </TableCell>
            </TableRow>
          ))}
          {!sellers?.length && (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                No sellers with increased limits found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default HighLimitSellers;
