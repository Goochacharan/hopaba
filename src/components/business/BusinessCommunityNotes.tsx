
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FileText, ThumbsUp, User } from 'lucide-react';
import { BusinessNote } from '@/hooks/useBusinessDetail';

interface BusinessCommunityNotesProps {
  businessId: string;
  notes: BusinessNote[];
  onAddNote: (note: { title: string; content: { text: string; videoUrl?: string } }) => Promise<void>;
}

const BusinessCommunityNotes: React.FC<BusinessCommunityNotesProps> = ({
  businessId,
  notes,
  onAddNote
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<BusinessNote | null>(null);
  
  const handleOpenNoteDialog = () => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to add community notes",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }
    
    setIsDialogOpen(true);
  };

  const handleAddNote = async () => {
    if (!noteTitle.trim()) {
      toast({
        title: "Title required",
        description: "Please provide a title for your note",
        variant: "destructive",
      });
      return;
    }
    
    if (!noteContent.trim()) {
      toast({
        title: "Content required",
        description: "Please add some content to your note",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await onAddNote({
        title: noteTitle,
        content: {
          text: noteContent
        }
      });
      
      toast({
        title: "Note added",
        description: "Your community note has been added successfully",
      });
      
      setNoteTitle('');
      setNoteContent('');
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add your note. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewNote = (note: BusinessNote) => {
    setSelectedNote(note);
  };
  
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <span>Community Notes</span>
          </div>
          <Button 
            onClick={handleOpenNoteDialog}
            size="sm"
          >
            Add Note
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No community notes yet. Be the first to contribute!
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map(note => (
              <div 
                key={note.id} 
                className="border p-3 rounded bg-white shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md"
                onClick={() => handleViewNote(note)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    {note.user_avatar_url ? (
                      <AvatarImage src={note.user_avatar_url} alt={note.user_display_name} />
                    ) : (
                      <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <div className="font-semibold text-lg">{note.title}</div>
                    <div className="text-sm text-gray-500 line-clamp-1 max-w-[340px]">
                      {note.content.text.slice(0, 120)}
                    </div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Like functionality would go here
                    toast({
                      title: "Feature coming soon",
                      description: "Liking notes will be available in a future update"
                    });
                  }}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>{note.thumbs_up}</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      {/* Add Note Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Add Community Note</DialogTitle>
            <DialogDescription>
              Share your knowledge and experiences with others
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Title</p>
              <Input
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Enter a title for your note"
              />
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Content</p>
              <Textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Share your knowledge, tips, or experiences..."
                className="min-h-[200px]"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNote}>
              Add Note
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* View Note Dialog */}
      <Dialog 
        open={!!selectedNote} 
        onOpenChange={(open) => {
          if (!open) setSelectedNote(null);
        }}
      >
        {selectedNote && (
          <DialogContent className="sm:max-w-[650px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedNote.title}</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Avatar className="h-6 w-6">
                  {selectedNote.user_avatar_url ? (
                    <AvatarImage src={selectedNote.user_avatar_url} alt={selectedNote.user_display_name} />
                  ) : (
                    <AvatarFallback><User className="h-3 w-3" /></AvatarFallback>
                  )}
                </Avatar>
                <span className="text-sm">{selectedNote.user_display_name}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(selectedNote.created_at).toLocaleDateString()}
                </span>
              </div>
            </DialogHeader>
            
            <div className="mt-4 whitespace-pre-line">
              {selectedNote.content.text}
            </div>
            
            {selectedNote.content.videoUrl && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Video</h4>
                <iframe
                  src={selectedNote.content.videoUrl}
                  className="w-full aspect-video rounded"
                  allowFullScreen
                  title="Video content"
                ></iframe>
              </div>
            )}
            
            <div className="flex justify-end">
              <Button 
                variant="ghost" 
                className="flex items-center gap-1"
                onClick={() => {
                  // Like functionality would go here
                  toast({
                    title: "Feature coming soon",
                    description: "Liking notes will be available in a future update"
                  });
                }}
              >
                <ThumbsUp className="w-4 h-4" />
                <span>{selectedNote.thumbs_up}</span>
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </Card>
  );
};

export default BusinessCommunityNotes;
