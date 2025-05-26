
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, IndianRupee, Send, Upload, X, Store, Truck } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { ServiceRequest } from '@/types/serviceRequestTypes';
import { QuotationFormData, PricingType } from '@/types/quotationTypes';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useConversations';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EnhancedQuotationDialogProps {
  request: ServiceRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: string;
  businessName?: string;
}

export function EnhancedQuotationDialog({ 
  request, 
  open, 
  onOpenChange, 
  providerId, 
  businessName 
}: EnhancedQuotationDialogProps) {
  const [formData, setFormData] = useState<QuotationFormData>({
    message: '',
    price: 0,
    pricing_type: 'fixed',
    wholesale_price: undefined,
    negotiable_price: undefined,
    delivery_available: false,
    quotation_images: []
  });
  const [isSending, setIsSending] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const { user } = useAuth();
  const { sendMessage, refetchConversations } = useConversations();

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        message: '',
        price: 0,
        pricing_type: 'fixed',
        wholesale_price: undefined,
        negotiable_price: undefined,
        delivery_available: false,
        quotation_images: []
      });
    }
  }, [open]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Check if adding these images would exceed the limit
    if (formData.quotation_images.length + files.length > 5) {
      toast({
        title: "Too many images",
        description: "You can upload a maximum of 5 images for quotation.",
        variant: "destructive"
      });
      return;
    }

    setIsUploadingImages(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Invalid file type",
            description: "Please upload only image files.",
            variant: "destructive"
          });
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: "Please upload images smaller than 5MB.",
            variant: "destructive"
          });
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `quotation-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `quotations/${fileName}`;

        console.log('Uploading file:', { fileName, filePath, size: file.size, type: file.type });

        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          
          // Provide more specific error messages
          if (uploadError.message.includes('Bucket not found')) {
            toast({
              title: "Storage bucket missing",
              description: "The images storage bucket needs to be configured. Please check your Supabase Storage settings.",
              variant: "destructive"
            });
          } else if (uploadError.message.includes('not allowed') || uploadError.message.includes('policy')) {
            toast({
              title: "Upload permission denied",
              description: "You don't have permission to upload images. Please check storage policies.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Upload failed",
              description: `Failed to upload ${file.name}: ${uploadError.message}`,
              variant: "destructive"
            });
          }
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
        console.log('Successfully uploaded:', { fileName, publicUrl });
      }

      if (uploadedUrls.length > 0) {
        setFormData(prev => ({
          ...prev,
          quotation_images: [...prev.quotation_images, ...uploadedUrls]
        }));

        toast({
          title: "Images uploaded",
          description: `Successfully uploaded ${uploadedUrls.length} image(s).`
        });
      }
    } catch (error) {
      console.error('Error in image upload:', error);
      toast({
        title: "Upload error",
        description: "An error occurred while uploading images.",
        variant: "destructive"
      });
    } finally {
      setIsUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      quotation_images: prev.quotation_images.filter((_, i) => i !== index)
    }));
  };

  const handleSendQuotation = async () => {
    if (!user || !request) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to send a quotation.",
        variant: "destructive"
      });
      return;
    }

    // Validate main price
    if (!formData.price || formData.price <= 0) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid price for your quotation.",
        variant: "destructive"
      });
      return;
    }

    if (formData.price > 10000000) {
      toast({
        title: "Price too high",
        description: "Please enter a reasonable quotation amount.",
        variant: "destructive"
      });
      return;
    }

    // Validate additional prices based on pricing type
    if (formData.pricing_type === 'wholesale' && (!formData.wholesale_price || formData.wholesale_price <= 0)) {
      toast({
        title: "Invalid wholesale price",
        description: "Please enter a valid wholesale price.",
        variant: "destructive"
      });
      return;
    }

    if (formData.pricing_type === 'negotiable' && formData.negotiable_price && formData.negotiable_price <= 0) {
      toast({
        title: "Invalid negotiable price",
        description: "Please enter a valid negotiable price.",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    console.log('Starting enhanced quotation send process for request:', request.id);

    try {
      // Check if a conversation already exists
      const { data: existingConversations, error: fetchError } = await supabase
        .from('conversations')
        .select('id')
        .eq('request_id', request.id)
        .eq('provider_id', providerId)
        .eq('user_id', request.user_id)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (fetchError) {
        console.error('Error checking existing conversations:', fetchError);
        throw new Error('Failed to check existing conversations');
      }
      
      let conversationId: string;
      
      if (existingConversations && existingConversations.length > 0) {
        conversationId = existingConversations[0].id;
        console.log('Using existing conversation:', conversationId);
      } else {
        // Create new conversation
        const { data: newConversation, error: createError } = await supabase
          .from('conversations')
          .insert({
            request_id: request.id,
            provider_id: providerId,
            user_id: request.user_id
          })
          .select('id')
          .single();
          
        if (createError) {
          console.error('Error creating conversation:', createError);
          throw new Error(`Failed to create conversation: ${createError.message}`);
        }
        
        if (!newConversation) {
          throw new Error('No conversation data returned');
        }
        
        conversationId = newConversation.id;
        console.log('Created new conversation:', conversationId);
      }
      
      // Prepare message content
      let messageContent = formData.message.trim() || `I'm interested in helping you with "${request.title}". Here's my quotation:`;
      
      // Add pricing details to message
      if (formData.pricing_type === 'wholesale' && formData.wholesale_price) {
        messageContent += `\n\nWholesale Price: ₹${formData.wholesale_price.toLocaleString()}`;
      }
      
      if (formData.pricing_type === 'negotiable') {
        messageContent += `\n\nThis price is negotiable.`;
        if (formData.negotiable_price) {
          messageContent += ` Starting from: ₹${formData.negotiable_price.toLocaleString()}`;
        }
      }
      
      if (formData.delivery_available) {
        messageContent += `\n\n🚚 Delivery available`;
      }

      if (businessName) {
        messageContent += `\n\nVisit our shop: ${businessName}`;
      }
      
      console.log('Sending enhanced quotation message:', {
        conversationId,
        content: messageContent,
        senderType: 'provider',
        quotationPrice: formData.price,
        quotationImages: formData.quotation_images,
        deliveryAvailable: formData.delivery_available,
        pricingType: formData.pricing_type,
        wholesalePrice: formData.wholesale_price,
        negotiablePrice: formData.negotiable_price
      });
      
      // Send the enhanced quotation message
      await sendMessage({
        conversationId,
        content: messageContent,
        senderType: 'provider',
        quotationPrice: formData.price,
        attachments: formData.quotation_images,
        quotationImages: formData.quotation_images,
        deliveryAvailable: formData.delivery_available,
        pricingType: formData.pricing_type,
        wholesalePrice: formData.wholesale_price,
        negotiablePrice: formData.negotiable_price
      });
      
      console.log('Enhanced quotation sent successfully');
      
      // Refresh conversations
      await refetchConversations();
      
      toast({
        title: "Quotation Sent Successfully",
        description: `Your ${formData.pricing_type} quotation of ₹${formData.price.toLocaleString()} has been sent.`
      });
      
      // Close dialog and reset form
      onOpenChange(false);
      
    } catch (error: any) {
      console.error('Error in enhanced quotation flow:', error);
      toast({
        title: "Error Sending Quotation",
        description: error.message || "There was a problem sending your quotation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const getPricingTypeLabel = (type: PricingType) => {
    switch (type) {
      case 'fixed': return 'Fixed Price';
      case 'negotiable': return 'Negotiable';
      case 'wholesale': return 'Wholesale';
      default: return 'Fixed Price';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] z-50">
        <div className="max-h-[80vh] overflow-y-auto pr-2">
          <DialogHeader className="sticky top-0 bg-white z-10 pb-4">
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Quotation
            </DialogTitle>
            <DialogDescription>
              Send your price quote for "{request?.title || 'Unknown Request'}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Shop Information */}
            {businessName && (
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Store className="h-4 w-4" />
                    <span>Quotation from: <strong>{businessName}</strong></span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pricing Type */}
            <div className="space-y-2">
              <Label htmlFor="pricing_type">Pricing Type</Label>
              <select
                id="pricing_type"
                value={formData.pricing_type}
                onChange={(e) => setFormData(prev => ({ ...prev, pricing_type: e.target.value as PricingType }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="fixed">Fixed Price</option>
                <option value="negotiable">Negotiable Price</option>
                <option value="wholesale">Wholesale Price</option>
              </select>
            </div>

            {/* Main Price */}
            <div className="space-y-2">
              <Label htmlFor="price">
                {formData.pricing_type === 'wholesale' ? 'Regular Price (₹)' : 'Price (₹)'}
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  id="price"
                  type="number"
                  placeholder="Enter your price"
                  value={formData.price || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    price: parseFloat(e.target.value) || 0 
                  }))}
                  className="pl-10"
                  min="1"
                  max="10000000"
                />
              </div>
            </div>

            {/* Wholesale Price */}
            {formData.pricing_type === 'wholesale' && (
              <div className="space-y-2">
                <Label htmlFor="wholesale_price">Wholesale Price (₹)</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    id="wholesale_price"
                    type="number"
                    placeholder="Enter wholesale price"
                    value={formData.wholesale_price || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      wholesale_price: parseFloat(e.target.value) || undefined 
                    }))}
                    className="pl-10"
                    min="1"
                    max="10000000"
                  />
                </div>
              </div>
            )}

            {/* Negotiable Price */}
            {formData.pricing_type === 'negotiable' && (
              <div className="space-y-2">
                <Label htmlFor="negotiable_price">Starting Price (₹) - Optional</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    id="negotiable_price"
                    type="number"
                    placeholder="Enter starting negotiable price"
                    value={formData.negotiable_price || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      negotiable_price: parseFloat(e.target.value) || undefined 
                    }))}
                    className="pl-10"
                    min="1"
                    max="10000000"
                  />
                </div>
              </div>
            )}

            {/* Delivery Option */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Delivery Available
                </Label>
                <p className="text-sm text-muted-foreground">
                  Check if you can deliver this product/service
                </p>
              </div>
              <Switch
                checked={formData.delivery_available}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, delivery_available: checked }))
                }
              />
            </div>

            {/* Quotation Images */}
            <div className="space-y-2">
              <Label>Quotation Images (Optional)</Label>
              <p className="text-sm text-muted-foreground">
                Upload up to 5 images to support your quotation (product photos, certificates, etc.)
              </p>
              
              {/* Image Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="quotation-images"
                  disabled={isUploadingImages || formData.quotation_images.length >= 5}
                />
                <label
                  htmlFor="quotation-images"
                  className={`flex flex-col items-center justify-center cursor-pointer ${
                    isUploadingImages || formData.quotation_images.length >= 5 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:bg-gray-50'
                  } p-4 rounded-lg transition-colors`}
                >
                  {isUploadingImages ? (
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  ) : (
                    <Upload className="h-8 w-8 text-gray-400" />
                  )}
                  <span className="mt-2 text-sm text-gray-600">
                    {formData.quotation_images.length >= 5 
                      ? 'Maximum 5 images allowed' 
                      : 'Click to upload images'
                    }
                  </span>
                </label>
              </div>

              {/* Uploaded Images Preview */}
              {formData.quotation_images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
                  {formData.quotation_images.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Quotation image ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Add details about your quotation, terms, timeline, etc..."
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                rows={4}
              />
            </div>

            {/* Summary */}
            <Card>
              <CardContent className="pt-4">
                <h4 className="font-medium mb-2">Quotation Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Pricing Type:</span>
                    <Badge variant="outline">{getPricingTypeLabel(formData.pricing_type)}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Main Price:</span>
                    <span className="font-medium">₹{formData.price.toLocaleString()}</span>
                  </div>
                  {formData.pricing_type === 'wholesale' && formData.wholesale_price && (
                    <div className="flex justify-between">
                      <span>Wholesale Price:</span>
                      <span className="font-medium">₹{formData.wholesale_price.toLocaleString()}</span>
                    </div>
                  )}
                  {formData.pricing_type === 'negotiable' && formData.negotiable_price && (
                    <div className="flex justify-between">
                      <span>Starting Price:</span>
                      <span className="font-medium">₹{formData.negotiable_price.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Delivery:</span>
                    <span>{formData.delivery_available ? '✅ Available' : '❌ Not Available'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Images:</span>
                    <span>{formData.quotation_images.length} attached</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendQuotation} 
              disabled={isSending || !formData.price}
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Quotation
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
