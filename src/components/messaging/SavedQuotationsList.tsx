
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { DollarSign, Truck, ImageIcon, Store, BookmarkX, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useSavedQuotations } from '@/hooks/useSavedQuotations';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const SavedQuotationsList: React.FC = () => {
  const { savedQuotations, isLoading, removeSavedQuotation, isRemoving } = useSavedQuotations();
  const navigate = useNavigate();

  // Format price for display
  const formatPrice = (price: number) => {
    if (price >= 10000000) { // 1 Crore or more
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    } else if (price >= 100000) { // 1 Lakh or more
      return `₹${(price / 100000).toFixed(2)} L`;
    } else if (price >= 1000) { // Thousands
      return `₹${(price / 1000).toFixed(1)}K`;
    } else {
      return `₹${price.toLocaleString()}`;
    }
  };

  const getPricingTypeLabel = (type?: string) => {
    switch (type) {
      case 'fixed': return 'Fixed Price';
      case 'negotiable': return 'Negotiable';
      case 'wholesale': return 'Wholesale';
      default: return 'Fixed Price';
    }
  };

  const getPricingTypeColor = (type?: string) => {
    switch (type) {
      case 'fixed': return 'bg-blue-100 text-blue-800';
      case 'negotiable': return 'bg-orange-100 text-orange-800';
      case 'wholesale': return 'bg-purple-100 text-purple-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const handleRemoveSaved = (messageId: string) => {
    removeSavedQuotation(messageId);
  };

  const goToConversation = (conversationId: string) => {
    navigate(`/messages/${conversationId}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading saved quotations...</span>
      </div>
    );
  }

  if (savedQuotations.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No saved quotations yet.</p>
        <p className="text-sm mt-2">Save quotations from your conversations to see them here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {savedQuotations.map((savedQuotation) => {
        const message = savedQuotation.message;
        const hasQuotationImages = message.quotation_images && message.quotation_images.length > 0;

        return (
          <Card key={savedQuotation.id} className="border-2 border-green-300 bg-gradient-to-r from-green-50 to-green-100">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-green-800">
                  {savedQuotation.provider_name}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveSaved(message.id)}
                  disabled={isRemoving}
                  className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                  title="Remove from saved"
                >
                  <BookmarkX className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-green-600">{savedQuotation.request_title}</p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-sm text-green-800">
                    Price Quote
                  </span>
                </div>
                
                {/* Pricing Type Badge */}
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", getPricingTypeColor(message.pricing_type))}
                >
                  {getPricingTypeLabel(message.pricing_type)}
                </Badge>
              </div>

              {/* Main Price */}
              <div className="text-3xl font-bold text-green-700">
                {formatPrice(message.quotation_price)}
              </div>

              {/* Additional Pricing */}
              <div className="space-y-1">
                <div className="text-xs font-medium text-green-600">
                  Full amount: ₹{message.quotation_price.toLocaleString()}
                </div>
                
                {message.pricing_type === 'wholesale' && message.wholesale_price && (
                  <div className="text-xs text-green-600">
                    Wholesale: ₹{message.wholesale_price.toLocaleString()}
                  </div>
                )}
                
                {message.pricing_type === 'negotiable' && message.negotiable_price && (
                  <div className="text-xs text-green-600">
                    Starting from: ₹{message.negotiable_price.toLocaleString()}
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="flex flex-wrap gap-2">
                {message.delivery_available && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-200 text-green-800">
                    <Truck className="h-3 w-3" />
                    <span>Delivery Available</span>
                  </div>
                )}
                
                {hasQuotationImages && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-200 text-blue-800">
                    <ImageIcon className="h-3 w-3" />
                    <span>{message.quotation_images.length} Image{message.quotation_images.length > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>

              {/* Quotation Images */}
              {hasQuotationImages && (
                <div className="grid grid-cols-2 gap-2 max-w-sm">
                  {message.quotation_images.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={imageUrl}
                        alt={`Quotation image ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => window.open(imageUrl, '_blank')}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg" />
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              {/* Footer with actions */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-green-600">
                  Saved {format(parseISO(savedQuotation.created_at), 'MMM d, h:mm a')}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToConversation(savedQuotation.conversation_id)}
                  className="text-green-700 border-green-300 hover:bg-green-100"
                >
                  View Conversation
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
