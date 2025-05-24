
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

interface BillImageViewerProps {
  images: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BillImageViewer: React.FC<BillImageViewerProps> = ({
  images,
  open,
  onOpenChange,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevious = () => {
    setCurrentIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
  };

  const handleNext = () => {
    setCurrentIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Original Bill
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center py-4">
          {images.length > 0 && (
            <>
              <div className="max-h-[70vh] overflow-auto w-full bg-gray-50 p-2 rounded-md">
                <img 
                  src={images[currentIndex]} 
                  alt={`Bill ${currentIndex + 1}`} 
                  className="w-full max-h-[500px] object-contain"
                />
              </div>
              
              {images.length > 1 && (
                <div className="flex items-center justify-between w-full mt-4">
                  <Button onClick={handlePrevious} variant="outline" size="sm">
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    {currentIndex + 1} of {images.length}
                  </span>
                  <Button onClick={handleNext} variant="outline" size="sm">
                    Next
                  </Button>
                </div>
              )}
              
              <div className="mt-4">
                <Button asChild variant="outline" size="sm">
                  <a href={images[currentIndex]} download target="_blank" rel="noopener noreferrer">
                    Download Bill
                  </a>
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BillImageViewer;
