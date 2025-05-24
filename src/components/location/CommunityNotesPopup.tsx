
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "../ui/dialog";
import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight, ThumbsUp } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { formatDistance } from "date-fns";
import { ScrollArea } from "../ui/scroll-area";
import { getEmbedUrl } from "@/utils/videoUtils";

interface CommunityNote {
  id: string;
  title: string;
  content: {
    text: string;
    videoUrl?: string;
  };
  created_at: string;
  thumbs_up: number;
  thumbs_up_users: string[];
  user_id: string;
  user_avatar_url: string | null;
  user_display_name: string;
  images?: string[];
}

interface CommunityNotesPopupProps {
  locationId: string;
  isOpen: boolean;
  onClose: () => void;
}

const CommunityNotesPopup: React.FC<CommunityNotesPopupProps> = ({
  locationId,
  isOpen,
  onClose,
}) => {
  const { toast } = useToast();
  const [notes, setNotes] = useState<CommunityNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchUserId();
      fetchNotes();
    }
  }, [isOpen, locationId]);

  async function fetchUserId() {
    const { data } = await supabase.auth.getSession();
    setUserId(data.session?.user?.id ?? null);
  }

  async function fetchNotes() {
    setLoading(true);
    
    const { data, error } = await supabase
      .from("community_notes")
      .select(`
        *,
        user_id,
        thumbs_up_users,
        content,
        images,
        created_at
      `)
      .eq("location_id", locationId)
      .order("thumbs_up", { ascending: false });

    if (error) {
      console.error("Error fetching notes:", error);
      setNotes([]);
      setLoading(false);
      return;
    }

    if (data && data.length > 0) {
      const processedNotes: CommunityNote[] = [];
      
      for (const note of data) {
        let userAvatarUrl: string | null = null;
        let userDisplayName: string | null = "Anonymous";
        
        if (note.user_id) {
          try {
            const { data: userData } = await supabase.auth.getUser(note.user_id);
            
            if (userData && userData.user) {
              userAvatarUrl = userData.user.user_metadata?.avatar_url || null;
              userDisplayName = userData.user.user_metadata?.full_name || userData.user.email || "Anonymous";
            }
          } catch (authError) {
            console.error("Could not fetch user data:", authError);
            userDisplayName = `User ${note.user_id.substring(0, 6)}`;
          }
        }
        
        const contentData = note.content;
        let contentObj: { text: string; videoUrl?: string };
        
        if (typeof contentData === 'string') {
          contentObj = { text: contentData };
        } else if (Array.isArray(contentData)) {
          contentObj = { text: 'No content available' };
        } else {
          const tempContent = contentData as unknown as { text: string; videoUrl?: string };
          contentObj = { 
            text: tempContent.text || 'No content available',
            videoUrl: tempContent.videoUrl
          };
        }
        
        processedNotes.push({
          ...note,
          content: contentObj,
          user_avatar_url: userAvatarUrl,
          user_display_name: userDisplayName,
        });
      }
      
      setNotes(processedNotes);
      setCurrentNoteIndex(0);
    } else {
      setNotes([]);
    }
    
    setLoading(false);
  }

  const handleLikeNote = async (note: CommunityNote, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please log in to like notes",
        variant: "destructive"
      });
      return;
    }

    const userLiked = note.thumbs_up_users?.includes(userId);
    const newLikeCount = userLiked ? (note.thumbs_up || 0) - 1 : (note.thumbs_up || 0) + 1;
    const newLikeUsers = userLiked 
      ? (note.thumbs_up_users || []).filter(id => id !== userId)
      : [...(note.thumbs_up_users || []), userId];

    const { error } = await supabase
      .from('community_notes')
      .update({
        thumbs_up: newLikeCount,
        thumbs_up_users: newLikeUsers
      })
      .eq('id', note.id);

    if (error) {
      console.error('Error updating likes:', error);
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive"
      });
      return;
    }

    setNotes(prevNotes => {
      const updatedNotes = prevNotes.map(n => {
        if (n.id === note.id) {
          return {
            ...n,
            thumbs_up: newLikeCount,
            thumbs_up_users: newLikeUsers
          };
        }
        return n;
      });
      
      // Sort by likes after update
      return [...updatedNotes].sort((a, b) => (b.thumbs_up || 0) - (a.thumbs_up || 0));
    });
  };

  const goToNextNote = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (currentNoteIndex < notes.length - 1) {
      setCurrentNoteIndex(prev => prev + 1);
    }
  };

  const goToPreviousNote = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (currentNoteIndex > 0) {
      setCurrentNoteIndex(prev => prev - 1);
    }
  };

  const currentNote = notes[currentNoteIndex];
  const formattedDate = currentNote?.created_at 
    ? formatDistance(new Date(currentNote.created_at), new Date(), { addSuffix: true })
    : '';
  
  const embedUrl = currentNote?.content?.videoUrl 
    ? getEmbedUrl(currentNote.content.videoUrl) 
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[90vw] lg:max-w-[80vw] max-h-[90vh] p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center items-center">
            <p>Loading community notes...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="p-8 text-center">
            <p>No community notes found for this location.</p>
            <Button onClick={onClose} className="mt-4">Close</Button>
          </div>
        ) : (
          <div className="flex flex-col h-[80vh]">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between bg-muted/30">
              <h2 className="text-xl font-bold">Community Notes</h2>
              <span className="text-sm text-muted-foreground">
                {currentNoteIndex + 1} of {notes.length}
              </span>
            </div>
            
            {/* Content */}
            <ScrollArea className="flex-1 overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="h-10 w-10">
                    {currentNote.user_avatar_url ? (
                      <AvatarImage src={currentNote.user_avatar_url} alt={currentNote.user_display_name || "User avatar"} />
                    ) : (
                      <AvatarFallback>{(currentNote.user_display_name?.[0] || "A").toUpperCase()}</AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <div className="font-semibold">{currentNote.user_display_name}</div>
                    <div className="text-sm text-muted-foreground">{formattedDate}</div>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold mb-2">{currentNote.title}</h3>
                
                {/* Video embed */}
                {embedUrl && (
                  <div className="mb-6 w-full aspect-video rounded overflow-hidden">
                    <iframe 
                      src={embedUrl} 
                      title="Embedded video"
                      className="w-full h-full"
                      allowFullScreen
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  </div>
                )}
                
                {/* Images */}
                {currentNote.images && currentNote.images.length > 0 && (
                  <div className="mb-6 space-y-4">
                    {currentNote.images.map((img, idx) => (
                      <img 
                        key={idx} 
                        src={img} 
                        alt={`Image ${idx + 1} for ${currentNote.title}`} 
                        className="w-full rounded-lg object-contain max-h-[600px]" 
                      />
                    ))}
                  </div>
                )}
                
                <div className="prose max-w-none mb-6">
                  <p>{currentNote.content.text}</p>
                </div>
              </div>
            </ScrollArea>
            
            {/* Footer */}
            <div className="p-4 border-t flex justify-between items-center bg-muted/10">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleLikeNote(currentNote, e)}
                className={`flex items-center gap-1 ${
                  currentNote.thumbs_up_users?.includes(userId || '') ? 'text-blue-600' : ''
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
                <span>{currentNote.thumbs_up || 0}</span>
              </Button>
              
              <div className="flex items-center gap-2">
                <Button 
                  onClick={goToPreviousNote}
                  disabled={currentNoteIndex === 0}
                  variant="outline"
                  size="sm"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <Button 
                  onClick={goToNextNote}
                  disabled={currentNoteIndex >= notes.length - 1}
                  variant="outline"
                  size="sm"
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
                <Button 
                  onClick={(e) => { e.stopPropagation(); onClose(); }}
                  variant="default"
                  size="sm"
                  className="ml-2"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CommunityNotesPopup;
