
import React from 'react';
import { Button } from '@/components/ui/button';

interface FormActionsProps {
  loading: boolean;
  isEditing: boolean;
  onCancel?: () => void;
}

export const FormActions: React.FC<FormActionsProps> = ({ loading, isEditing, onCancel }) => {
  return (
    <div className="flex gap-3 justify-end">
      {onCancel && (
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="shadow-[0_4px_0px_0px_rgba(0,0,0,0.05)] hover:shadow-[0_2px_0px_0px_rgba(0,0,0,0.05)] active:shadow-none active:translate-y-[3px]"
        >
          Cancel
        </Button>
      )}
      <Button 
        type="submit" 
        disabled={loading}
        className="shadow-[0_4px_0px_0px_rgba(30,174,219,0.25)] hover:shadow-[0_2px_0px_0px_rgba(30,174,219,0.25)] active:shadow-none active:translate-y-[3px]"
      >
        {loading ? "Saving..." : isEditing ? "Update Event" : "Create Event"}
      </Button>
    </div>
  );
};
