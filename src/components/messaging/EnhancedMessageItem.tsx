import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Truck, Package, Store, ImageIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Message } from '@/types/serviceRequestTypes';
import { useNavigate } from 'react-router-dom';

interface EnhancedMessageItemProps {
  message: Message;
  isUser: boolean;
  otherPartyName: string;
  businessName?: string;
  providerId?: string;
}

export const EnhancedMessageItem: React.FC<EnhancedMessageItemProps> = ({ 
  message, 
  isUser, 
  otherPartyName, 
  businessName,
  providerId
}) => {
  const navigate = useNavigate();
  const hasQuotation = message.quotation_price !== null && message.quotation_price !== undefined;
  const hasAttachments = message.attachments && message.attachments.length > 0;
  const hasQuotationImages = message.quotation_images && message.quotation_images.length > 0;
  
  // Handle business page navigation
  const handleBusinessClick = () => {
    if (providerId) {
      navigate(`/business/${providerId}`);
    }
  };

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
  
  return (
    <div className={cn(
      "flex w-full mb-4",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "flex gap-2",
        isUser ? "flex-row" : "flex-row-reverse"
      )}>
        {!isUser && (
          <Avatar className="h-8 w-8">
            <AvatarFallback>{otherPartyName.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        )}
        
        <div className={cn(
          "max-w-[80%] space-y-2",
          isUser ? "items-end" : "items-start"
        )}>
          {/* Enhanced Quotation Card */}
          {hasQuotation && (
            <Card className={cn(
              "border-2 shadow-md",
              isUser 
                ? "bg-primary text-primary-foreground border-primary" 
                : "bg-gradient-to-r from-green-50 to-green-100 border-green-300"
            )}>
              <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className={cn(
                      "h-5 w-5",
                      isUser ? "text-primary-foreground" : "text-green-600"
                    )} />
                    <span className={cn(
                      "font-semibold text-sm",
                      isUser ? "text-primary-foreground" : "text-green-800"
                    )}>
                      {isUser ? "Price Quote Sent" : "Price Quote Received"}
                    </span>
                  </div>
                  
                  {/* Pricing Type Badge */}
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs",
                      isUser 
                        ? "border-primary-foreground/20 text-primary-foreground" 
                        : getPricingTypeColor(message.pricing_type)
                    )}
                  >
                    {getPricingTypeLabel(message.pricing_type)}
                  </Badge>
                </div>

                {/* Main Price */}
                <div className={cn(
                  "text-3xl font-bold mb-2",
                  isUser ? "text-primary-foreground" : "text-green-700"
                )}>
                  {formatPrice(message.quotation_price)}
                </div>

                {/* Additional Pricing */}
                <div className="space-y-1 mb-3">
                  <div className={cn(
                    "text-xs font-medium",
                    isUser ? "text-primary-foreground/80" : "text-green-600"
                  )}>
                    Full amount: ₹{message.quotation_price.toLocaleString()}
                  </div>
                  
                  {message.pricing_type === 'wholesale' && message.wholesale_price && (
                    <div className={cn(
                      "text-xs",
                      isUser ? "text-primary-foreground/80" : "text-green-600"
                    )}>
                      Wholesale: ₹{message.wholesale_price.toLocaleString()}
                    </div>
                  )}
                  
                  {message.pricing_type === 'negotiable' && message.negotiable_price && (
                    <div className={cn(
                      "text-xs",
                      isUser ? "text-primary-foreground/80" : "text-green-600"
                    )}>
                      Starting from: ₹{message.negotiable_price.toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {message.delivery_available && (
                    <div className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-full text-xs",
                      isUser 
                        ? "bg-primary-foreground/20 text-primary-foreground" 
                        : "bg-green-200 text-green-800"
                    )}>
                      <Truck className="h-3 w-3" />
                      <span>Delivery Available</span>
                    </div>
                  )}
                  
                  {hasQuotationImages && (
                    <div className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-full text-xs",
                      isUser 
                        ? "bg-primary-foreground/20 text-primary-foreground" 
                        : "bg-blue-200 text-blue-800"
                    )}>
                      <ImageIcon className="h-3 w-3" />
                      <span>{message.quotation_images!.length} Image{message.quotation_images!.length > 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>

                {/* Shop Information */}
                {businessName && !isUser && (
                  <div className="border-t border-green-200 pt-2 mt-2">
                    <button
                      onClick={handleBusinessClick}
                      className="flex items-center gap-2 text-xs text-green-700 hover:text-green-900 transition-colors"
                    >
                      <Store className="h-3 w-3" />
                      <span>Visit {businessName}</span>
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quotation Images */}
          {hasQuotationImages && (
            <div className="grid grid-cols-2 gap-2 max-w-sm">
              {message.quotation_images!.map((imageUrl, index) => (
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

          {/* Regular Message */}
          {message.content && (
            <div className={cn(
              "rounded-lg px-3 py-2 max-w-sm break-words",
              isUser 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted"
            )}>
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          )}

          {/* Regular Attachments (non-quotation images) */}
          {hasAttachments && !hasQuotation && (
            <div className="grid grid-cols-2 gap-2 max-w-sm">
              {message.attachments.map((attachment, index) => (
                <div key={index} className="relative group">
                  <img
                    src={attachment}
                    alt={`Attachment ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => window.open(attachment, '_blank')}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg" />
                </div>
              ))}
            </div>
          )}

          {/* Timestamp */}
          <div className={cn(
            "text-xs text-muted-foreground",
            isUser ? "text-right" : "text-left"
          )}>
            {format(parseISO(message.created_at), 'MMM d, h:mm a')}
          </div>
        </div>
      </div>
    </div>
  );
}; 