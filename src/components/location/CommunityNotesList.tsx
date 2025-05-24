
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText, ThumbsUp } from "lucide-react";
import CommunityNoteModal from "./CommunityNoteModal";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Note } from "./CommunityNoteModal";
import { Json } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "../ui/button";
import CommunityNotesPopup from "./CommunityNotesPopup";

interface CommunityNotesListProps {
  locationId: string;
}

interface NoteContentType {
  text: string;
  videoUrl?: string;
}

const CommunityNotesList: React.FC<CommunityNotesListProps> = ({ locationId }) => {
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [popupOpen, setPopupOpen] = useState(false);

  useEffect(() => {
    fetchNotes();
    fetchUserId();
    // eslint-disable-next-line
  }, [locationId, refreshTrigger]);

  async function fetchUserId() {
    const { data } = await supabase.auth.getSession();
    setUserId(data.session?.user?.id ?? null);
  }

  async function fetchNotes() {
    setLoading(true);
    console.log("Fetching notes for location:", locationId);
    
    const { data, error } = await supabase
      .from("community_notes")
      .select(`
        *,
        user_id,
        thumbs_up_users,
        content,
        created_at
      `)
      .eq("location_id", locationId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notes:", error);
      setNotes([]);
      setLoading(false);
      return;
    }

    console.log("Notes data from database:", data);
    
    if (data && data.length > 0) {
      const processedNotes: Note[] = [];
      
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
        
        const contentData = note.content as Json;
        let contentObj: NoteContentType;
        
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
        
        let socialLinks: any[] = [];
        if (note.social_links) {
          if (Array.isArray(note.social_links)) {
            socialLinks = note.social_links;
          } else if (typeof note.social_links === 'object') {
            socialLinks = Object.values(note.social_links);
          }
        }
        
        processedNotes.push({
          ...note,
          content: contentObj,
          user_avatar_url: userAvatarUrl,
          user_display_name: userDisplayName,
          social_links: socialLinks
        });
      }
      
      console.log("Processed notes:", processedNotes);
      setNotes(processedNotes);
    } else {
      console.log("No notes found for this location");
      setNotes([]);
    }
    
    setLoading(false);
  }

  const handleNoteDeleted = () => {
    console.log("Note deleted - refreshing notes");
    setRefreshTrigger(prev => prev + 1);
    setModalOpen(false);
    toast({
      title: "Note deleted",
      description: "Your note has been successfully removed"
    });
  };

  const handleLikeNote = async (note: Note, event: React.MouseEvent) => {
    event.stopPropagation();
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

    setNotes(prevNotes => prevNotes.map(n => {
      if (n.id === note.id) {
        return {
          ...n,
          thumbs_up: newLikeCount,
          thumbs_up_users: newLikeUsers
        };
      }
      return n;
    }));
  };

  const handleCommunityContributorsClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    setPopupOpen(true);
  };

  if (loading) {
    return (
      <div className="py-8 text-center">
        <span>Loading community notes...</span>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
        <FileText className="w-5 h-5" /> Community Notes ({notes.length})
      </h3>
      {notes.length === 0 ? (
        <div className="text-muted-foreground mb-6">No articles yet. Be the first to write a community note!</div>
      ) : (
        <div className="flex flex-col gap-3">
          {notes.map(note => (
            <div
              className="border p-3 rounded bg-white shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md"
              key={note.id}
            >
              <div className="flex items-center gap-3" onClick={() => {
                setSelectedNote(note);
                setModalOpen(true);
              }}>
                <Avatar className="h-10 w-10">
                  {note.user_avatar_url ? (
                    <AvatarImage src={note.user_avatar_url} alt={note.user_display_name || "User avatar"} />
                  ) : (
                    <AvatarFallback>{(note.user_display_name?.[0] || "A").toUpperCase()}</AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <div className="font-semibold text-lg">{note.title}</div>
                  <div className="text-sm text-gray-500 line-clamp-1 max-w-[340px]">
                    {note.content?.text?.slice(0, 120)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleLikeNote(note, e)}
                  className={`flex items-center gap-1 ${
                    note.thumbs_up_users?.includes(userId || '') ? 'text-blue-600' : ''
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>{note.thumbs_up || 0}</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      {modalOpen && selectedNote && (
        <CommunityNoteModal
          note={selectedNote}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onNoteDeleted={handleNoteDeleted}
          onNoteLiked={(noteId, newLikeCount, newLikeUsers) => {
            setNotes(prevNotes => prevNotes.map(n => {
              if (n.id === noteId) {
                return {
                  ...n,
                  thumbs_up: newLikeCount,
                  thumbs_up_users: newLikeUsers
                };
              }
              return n;
            }));
          }}
        />
      )}

      {/* Add the community notes popup */}
      <CommunityNotesPopup 
        locationId={locationId}
        isOpen={popupOpen}
        onClose={() => setPopupOpen(false)}
      />
    </div>
  );
};

export default CommunityNotesList;
