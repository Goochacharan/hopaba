
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SearchAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SearchAuthDialog = ({ open, onOpenChange }: SearchAuthDialogProps) => {
  const navigate = useNavigate();
  
  const navigateToLogin = () => {
    navigate('/login');
    onOpenChange(false);
  };
  
  const navigateToSignup = () => {
    navigate('/signup');
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Authentication Required</AlertDialogTitle>
          <AlertDialogDescription>
            You need to be logged in to search on Hopaba. Please login or sign up to continue.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex justify-between">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <div className="flex gap-2">
            <AlertDialogAction onClick={navigateToLogin} className="flex items-center gap-2 bg-primary">
              <LogIn className="h-4 w-4" />
              Login
            </AlertDialogAction>
            <AlertDialogAction onClick={navigateToSignup}>Sign Up</AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SearchAuthDialog;
