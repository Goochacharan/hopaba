
import React, { useState } from 'react';
import { Loader2, Send, IndianRupee, FileText, ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface MessageInputProps {
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  quotationMode: boolean;
  setQuotationMode: React.Dispatch<React.SetStateAction<boolean>>;
  quotationPrice: string;
  setQuotationPrice: React.Dispatch<React.SetStateAction<string>>;
  handleSendMessage: (attachments?: string[]) => void;
  isSendingMessage: boolean;
  isProvider: boolean;
  requestDetails?: {
    title: string;
    category: string;
    subcategory?: string;
    budget?: number;
  };
}

const MessageInput: React.FC<MessageInputProps> = ({
  message,
  setMessage,
  quotationMode,
  setQuotationMode,
  quotationPrice,
  setQuotationPrice,
  handleSendMessage,
  isSendingMessage,
  isProvider,
  requestDetails
}) => {
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Handle keypress event for sending messages
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessageWithAttachments();
    }
  };
  
  // Validate the price is a positive number
  const validatePrice = (value: string) => {
    // Remove non-numeric characters except for the decimal point
    const sanitizedValue = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = sanitizedValue.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    
    return sanitizedValue;
  };
  
  // Handle price input changes
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = validatePrice(e.target.value);
    setQuotationPrice(newValue);
  };

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Check if adding these images would exceed the limit
    if (attachments.length + files.length > 5) {
      toast({
        title: "Too many images",
        description: "You can upload a maximum of 5 images per message.",
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
        const fileName = `message-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `messages/${fileName}`;

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
        setAttachments(prev => [...prev, ...uploadedUrls]);

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
      // Reset the input
      event.target.value = '';
    }
  };

  // Remove an attachment
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Handle sending message with attachments
  const handleSendMessageWithAttachments = () => {
    handleSendMessage(attachments);
    // Clear attachments after sending
    setAttachments([]);
  };
  
  // Check if the send button should be enabled
  const isButtonDisabled = () => {
    if (isSendingMessage || isUploadingImages) return true;
    
    if (quotationMode) {
      // In quotation mode, require a valid price (not empty and is a number)
      const priceIsValid = quotationPrice.trim() !== '' && !isNaN(parseFloat(quotationPrice));
      return !priceIsValid;
    }
    
    // In regular mode, require a non-empty message or at least one attachment
    return !message.trim() && attachments.length === 0;
  };
  
  return (
    <div className="border-t p-2">
      {quotationMode && isProvider && (
        <div className="mb-2 p-2 bg-muted rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee className="h-4 w-4 text-primary" />
            <h3 className="font-medium text-sm">Send a Price Quote</h3>
          </div>
          
          {requestDetails && (
            <div className="mb-2 text-xs bg-accent/20 p-2 rounded flex items-start gap-2">
              <FileText className="h-3 w-3 mt-0.5" />
              <div>
                <p className="font-medium">{requestDetails.title}</p>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {requestDetails.category}
                    {requestDetails.subcategory && ` / ${requestDetails.subcategory}`}
                  </span>
                  {requestDetails.budget && (
                    <Badge variant="outline" className="text-xs">
                      Budget: ₹{requestDetails.budget}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex gap-2 mb-2">
            <div className="flex items-center flex-1">
              <span className="px-2 bg-background border rounded-l-md h-8 flex items-center text-sm">₹</span>
              <Input 
                type="text" 
                inputMode="decimal"
                placeholder="Amount"
                className="rounded-l-none h-8 text-sm"
                value={quotationPrice}
                onChange={handlePriceChange}
              />
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setQuotationMode(false)}
              type="button"
              className="h-8 text-xs"
            >
              Cancel
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Add details about your services, availability, or any special terms below.</p>
        </div>
      )}

      {/* Image Attachments Preview */}
      {attachments.length > 0 && (
        <div className="mb-2 p-2 bg-muted/50 rounded-md">
          <div className="flex items-center gap-2 mb-1">
            <ImageIcon className="h-3 w-3 text-primary" />
            <span className="text-xs font-medium">Attached Images ({attachments.length})</span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {attachments.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`Attachment ${index + 1}`}
                  className="w-full h-12 object-cover rounded border"
                />
                <button
                  onClick={() => removeAttachment(index)}
                  className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  type="button"
                >
                  <X className="h-2 w-2" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main input area with inline buttons */}
      <div className="flex items-end gap-1">
        <div className="flex-1 relative">
          <Textarea
            placeholder={quotationMode ? "Add details about your quote..." : "Type your message"}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            className="min-h-[40px] pr-20 resize-none"
          />
          
          {/* Inline action buttons */}
          <div className="absolute bottom-1 right-1 flex gap-1">
            {/* Image Upload Button */}
            <div className="relative">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="message-images"
                disabled={isUploadingImages || attachments.length >= 5}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => document.getElementById('message-images')?.click()}
                disabled={isUploadingImages || attachments.length >= 5}
                title={attachments.length >= 5 ? "Maximum 5 images allowed" : "Add images"}
                type="button"
                className="h-6 w-6 p-0"
              >
                {isUploadingImages ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <ImageIcon className="h-3 w-3" />
                )}
              </Button>
            </div>
            
            {/* Quote Button */}
            {isProvider && !quotationMode && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  setQuotationMode(true);
                }}
                title="Send price quote"
                type="button"
                className="h-6 w-6 p-0"
              >
                <IndianRupee className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Send Button */}
        <Button 
          onClick={(e) => {
            e.preventDefault();
            if (!isButtonDisabled()) {
              handleSendMessageWithAttachments();
            }
          }}
          type="button"
          disabled={isButtonDisabled()}
          size="sm"
          className="h-10"
        >
          {isSendingMessage ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;
