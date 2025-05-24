import React, { useState, useEffect } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getEmbedUrl } from "@/utils/videoUtils";
import { Flag, Trash2, ThumbsUp } from "lucide-react";
import DeleteConfirmDialog from "../business/DeleteConfirmDialog";

interface NoteContentType {
  text: string;
  videoUrl?: string;
}

interface Reply {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_display_name?: string;
  user_avatar_url?: string;
}

interface Comment {
  id: string;
  note_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_display_name?: string;
  user_avatar_url?: string;
  replies?: Reply[];
}

export interface Note {
  id: string;
  title: string;
  content: NoteContentType;
  images: string[] | null;
  social_links: any[];
  user_id: string | null;
  user_avatar_url?: string | null;
  user_display_name?: string | null;
  created_at?: string;
  thumbs_up: number;
  thumbs_up_users: string[];
}

interface CommunityNoteModalProps {
  note: Note;
  open: boolean;
  onClose: () => void;
  onNoteDeleted?: () => void;
  onNoteLiked?: (noteId: string, newLikeCount: number, newLikeUsers: string[]) => void;
}

const CommunityNoteModal: React.FC<CommunityNoteModalProps> = ({
  note,
  open,
  onClose,
  onNoteDeleted,
  onNoteLiked
}) => {
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<'note' | 'comment' | 'reply'>("note");
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (open && note.id) {
      loadComments();
      getCurrentUser();
    }
  }, [open, note.id]);

  const getCurrentUser = async () => {
    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const loadComments = async () => {
    const {
      data: commentsData,
      error
    } = await supabase.from('note_comments').select('*').eq('note_id', note.id).order('created_at', {
      ascending: false
    });
    if (error) {
      console.error('Error loading comments:', error);
      return;
    }
    if (commentsData) {
      const processedComments: Comment[] = await Promise.all(commentsData.map(async comment => {
        const {
          data: userData
        } = await supabase.auth.getUser(comment.user_id);
        return {
          ...comment,
          user_display_name: userData?.user?.user_metadata?.full_name || 'Anonymous',
          user_avatar_url: userData?.user?.user_metadata?.avatar_url,
          replies: []
        };
      }));
      setComments(processedComments);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    const {
      data: userData
    } = await supabase.auth.getUser();
    if (!userData.user) {
      toast({
        title: "Authentication required",
        description: "Please log in to comment",
        variant: "destructive"
      });
      setSubmitting(false);
      return;
    }
    try {
      const {
        data: comment,
        error
      } = await supabase.from('note_comments').insert({
        note_id: note.id,
        user_id: userData.user.id,
        content: newComment.trim()
      }).select().single();
      if (error) throw error;
      const newCommentObj: Comment = {
        ...comment,
        user_display_name: userData.user.user_metadata?.full_name || userData.user.email,
        user_avatar_url: userData.user.user_metadata?.avatar_url,
        replies: []
      };
      setComments(prev => [newCommentObj, ...prev]);
      setNewComment("");
      toast({
        title: "Success",
        description: "Comment posted successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive"
      });
    }
    setSubmitting(false);
  };

  const handleSubmitReply = async (commentId: string) => {
    if (!replyContent.trim()) return;
    setSubmitting(true);
    const {
      data: userData
    } = await supabase.auth.getUser();
    if (!userData.user) {
      toast({
        title: "Authentication required",
        description: "Please log in to reply",
        variant: "destructive"
      });
      setSubmitting(false);
      return;
    }
    try {
      const {
        data: reply,
        error
      } = await supabase.from('note_comments').insert({
        note_id: note.id,
        user_id: userData.user.id,
        content: replyContent.trim()
      }).select().single();
      if (error) throw error;
      const newReply: Reply = {
        id: reply.id,
        user_id: userData.user.id,
        content: replyContent.trim(),
        created_at: reply.created_at,
        user_display_name: userData.user.user_metadata?.full_name || userData.user.email,
        user_avatar_url: userData.user.user_metadata?.avatar_url
      };
      setComments(prevComments => prevComments.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), newReply]
          };
        }
        return comment;
      }));
      setReplyContent("");
      setReplyingTo(null);
      toast({
        title: "Success",
        description: "Reply posted successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to post reply",
        variant: "destructive"
      });
    }
    setSubmitting(false);
  };

  const handleReportContent = (contentType: string, contentId: string) => {
    toast({
      title: "Thank you for reporting",
      description: "We will review this content shortly."
    });
  };

  const handleDeleteClick = async () => {
    if (!itemToDelete) return;
    
    try {
      let success = false;
      console.log("Deleting item type:", deleteType, "with ID:", itemToDelete);
      
      switch (deleteType) {
        case 'note':
          console.log("Attempting to delete note:", note.id, "by user:", currentUserId);
          const { error: noteError } = await supabase
            .from('community_notes')
            .delete()
            .eq('id', note.id)
            .eq('user_id', currentUserId);
          
          if (noteError) {
            console.error("Error deleting note:", noteError);
            throw noteError;
          }
          
          success = true;
          console.log("Note deletion successful");
          
          if (success && onNoteDeleted) {
            console.log("Calling onNoteDeleted callback");
            onNoteDeleted();
          }
          break;
          
        case 'comment':
        case 'reply':
          const { error: commentError } = await supabase
            .from('note_comments')
            .delete()
            .eq('id', itemToDelete)
            .eq('user_id', currentUserId);
          
          if (commentError) {
            console.error("Error deleting comment/reply:", commentError);
            throw commentError;
          }
          
          success = true;
          break;
      }
      
      if (success) {
        toast({
          title: "Deleted successfully",
          description: `The ${deleteType} has been deleted.`
        });
        
        if (deleteType === 'note') {
          onClose();
        } else {
          loadComments();
        }
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast({
        title: "Error",
        description: "Failed to delete. Please try again.",
        variant: "destructive"
      });
    }
    setDeleteDialogOpen(false);
  };

  const confirmDelete = (type: 'note' | 'comment' | 'reply', id: string) => {
    setDeleteType(type);
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleLikeNote = async () => {
    if (!currentUserId) {
      toast({
        title: "Authentication required",
        description: "Please log in to like notes",
        variant: "destructive"
      });
      return;
    }

    const userLiked = note.thumbs_up_users?.includes(currentUserId);
    const newLikeCount = userLiked ? (note.thumbs_up || 0) - 1 : (note.thumbs_up || 0) + 1;
    const newLikeUsers = userLiked 
      ? (note.thumbs_up_users || []).filter(id => id !== currentUserId)
      : [...(note.thumbs_up_users || []), currentUserId];

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

    if (onNoteLiked) {
      onNoteLiked(note.id, newLikeCount, newLikeUsers);
    }
  };

  if (!open || !note) return null;

  const embedUrl = getEmbedUrl(note.content?.videoUrl || null);
  const userAvatarUrl = note.user_avatar_url;
  const userDisplayName = note.user_display_name || "Anonymous";
  const isAuthor = currentUserId === note.user_id;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 px-[6px] py-[16px] my-0">
      <div className="bg-white shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto relative p-6 px-[4px] rounded">
        <button className="absolute top-2 right-3 font-bold text-2xl text-gray-400" onClick={onClose}>
          &times;
        </button>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              {userAvatarUrl ? (
                <AvatarImage src={userAvatarUrl} alt={userDisplayName} />
              ) : (
                <AvatarFallback>{(userDisplayName[0] || "A").toUpperCase()}</AvatarFallback>
              )}
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{note.title}</h2>
              <div className="text-sm text-gray-500">{userDisplayName}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLikeNote}
              className={`flex items-center gap-1 ${
                note.thumbs_up_users?.includes(currentUserId || '') ? 'text-blue-600' : ''
              }`}
            >
              <ThumbsUp className="w-4 h-4" />
              <span>{note.thumbs_up || 0}</span>
            </Button>
            {isAuthor && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => confirmDelete('note', note.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {embedUrl && <div className="w-full aspect-video mb-6 rounded-lg overflow-hidden">
            <iframe src={embedUrl} title="Video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full" />
          </div>}

        {note.images && note.images.length > 0 && <div className="mb-6 space-y-4">
            {note.images.map((img: string, idx: number) => <img key={idx} src={img} alt={`Image ${idx + 1} for ${note.title}`} className="w-full rounded-lg object-contain max-h-[600px]" />)}
          </div>}

        <div className="prose prose-lg max-w-none mb-6 min-h-[200px]" style={{
        whiteSpace: "pre-wrap"
      }}>
          {note.content?.text}
        </div>

        {note.social_links && Array.isArray(note.social_links) && note.social_links.length > 0 && <div className="mb-6">
            <label className="font-semibold">Links:</label>
            <ul className="ml-4 mt-1">
              {note.social_links.map((link: any, i: number) => <li key={i}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {link.label || link.url}
                  </a>
                </li>)}
            </ul>
          </div>}

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Comments</h3>
          <div className="space-y-4 mb-6">
            {comments.map(comment => (
              <div key={comment.id} className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      {comment.user_avatar_url ? (
                        <AvatarImage src={comment.user_avatar_url} alt={comment.user_display_name} />
                      ) : (
                        <AvatarFallback>
                          {(comment.user_display_name?.[0] || "A").toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <div className="font-medium">{comment.user_display_name || "Anonymous"}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {comment.user_id === currentUserId && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => confirmDelete('comment', comment.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleReportContent('comment', comment.id)}
                      className="text-muted-foreground h-8 px-2"
                    >
                      <Flag className="w-3.5 h-3.5 mr-1" />
                      Report
                    </Button>
                  </div>
                </div>
                <p className="text-gray-700">{comment.content}</p>

                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-8 mt-2 space-y-3">
                    {comment.replies.map(reply => (
                      <div key={reply.id} className="bg-white p-3 rounded-lg border">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              {reply.user_avatar_url ? (
                                <AvatarImage src={reply.user_avatar_url} alt={reply.user_display_name} />
                              ) : (
                                <AvatarFallback>
                                  {(reply.user_display_name?.[0] || "A").toUpperCase()}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">{reply.user_display_name || "Anonymous"}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(reply.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {reply.user_id === currentUserId && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => confirmDelete('reply', reply.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 px-2"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleReportContent('reply', reply.id)}
                              className="text-muted-foreground h-7 px-2"
                            >
                              <Flag className="w-3 h-3 mr-1" />
                              Report
                            </Button>
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {isAuthor && <div className="mt-2">
                    {replyingTo === comment.id ? <div className="space-y-2">
                        <Textarea placeholder="Write a reply..." value={replyContent} onChange={e => setReplyContent(e.target.value)} className="min-h-[80px] text-sm" />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleSubmitReply(comment.id)} disabled={submitting}>
                            {submitting ? "Posting..." : "Post Reply"}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => {
                    setReplyingTo(null);
                    setReplyContent("");
                  }}>
                            Cancel
                          </Button>
                        </div>
                      </div> : <Button size="sm" variant="ghost" className="text-sm" onClick={() => setReplyingTo(comment.id)}>
                        Reply
                      </Button>}
                  </div>}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmitComment} className="space-y-4">
            <Textarea placeholder="Write a comment..." value={newComment} onChange={e => setNewComment(e.target.value)} className="min-h-[100px]" />
            <Button type="submit" disabled={submitting}>
              {submitting ? "Posting..." : "Post Comment"}
            </Button>
          </form>
        </div>
      </div>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteClick}
        title={`Delete ${deleteType}`}
        description={`Are you sure you want to delete this ${deleteType}? This action cannot be undone.`}
      />
    </div>
  );
};

export default CommunityNoteModal;
