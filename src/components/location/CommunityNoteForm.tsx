
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";
import { MultimediaEditor } from "./MultimediaEditor";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CommunityNoteFormProps {
  locationId: string;
  onNoteCreated: () => void;
}

interface ContentBlock {
  type: 'text' | 'image' | 'video' | 'link';
  content: string;
}

const CommunityNoteForm: React.FC<CommunityNoteFormProps> = ({
  locationId,
  onNoteCreated
}) => {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState<ContentBlock[]>([{
    type: 'text',
    content: ''
  }]);
  const [adding, setAdding] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({
        title: "Title is required",
        variant: "destructive"
      });
      return;
    }
    setAdding(true);
    try {
      const {
        data: userData,
        error: userError
      } = await supabase.auth.getUser();
      if (userError) {
        throw new Error("You must be logged in to submit a note");
      }
      const userId = userData.user?.id;

      // Extract images and video URLs from blocks
      const images = blocks.filter(block => block.type === 'image').map(block => block.content);
      const videoUrl = blocks.find(block => block.type === 'video')?.content;

      // Extract social links from blocks
      const socialLinks = blocks.filter(block => block.type === 'link').map(block => JSON.parse(block.content));

      // Combine all text blocks
      const textContent = blocks.filter(block => block.type === 'text').map(block => block.content).join('\n\n');
      const contentObj = {
        text: textContent,
        ...(videoUrl ? {
          videoUrl
        } : {})
      };
      const {
        error
      } = await supabase.from("community_notes").insert({
        location_id: locationId,
        user_id: userId,
        title: title.trim(),
        content: contentObj as Json,
        images,
        social_links: socialLinks as Json,
        thumbs_up: 0,
        thumbs_up_users: []
      });
      if (error) throw error;
      toast({
        title: "Community Note submitted!",
        description: "Thank you for sharing your article."
      });
      setTitle("");
      setBlocks([{
        type: 'text',
        content: ''
      }]);

      // Make sure to call onNoteCreated to refresh the list
      onNoteCreated();
    } catch (error: any) {
      toast({
        title: "Error submitting note",
        description: error.message || "Unknown error",
        variant: "destructive"
      });
    } finally {
      setAdding(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 bg-white border rounded-lg p-5 px-[13px]">
      <div className="mb-6">
        <div className="bg-muted/50 rounded-lg p-4 mb-4">
          <h4 className="font-semibold mb-2">Community Guidelines</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Be respectful and constructive in your notes</li>
            <li>• Share accurate and relevant information</li>
            <li>• No spam, advertising, or inappropriate content</li>
            <li>• Include sources when possible</li>
            <li>• Report any content that violates these guidelines</li>
          </ul>
        </div>
        
        <h3 className="text-lg font-semibold mb-3">Write a Community Note</h3>
      </div>

      <div className="mb-3">
        <input 
          className="w-full border rounded px-2 py-2 mb-1 text-lg font-medium" 
          placeholder="Article title" 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
          maxLength={80} 
          required 
        />
      </div>

      <MultimediaEditor value={blocks} onChange={setBlocks} />

      <div className="flex justify-end mt-4">
        <Button type="submit" disabled={adding}>
          {adding ? "Submitting..." : "Submit Note"}
        </Button>
      </div>
    </form>
  );
};

export default CommunityNoteForm;
