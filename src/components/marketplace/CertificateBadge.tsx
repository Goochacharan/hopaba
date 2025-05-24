
import React, { useState } from 'react';
import { CircleCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface CertificateBadgeProps {
  certificates: string[];
}

const CertificateBadge: React.FC<CertificateBadgeProps> = ({
  certificates
}) => {
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Do not render if no certificates
  if (!certificates || certificates.length === 0) {
    return null;
  }
  
  const handlePrevious = () => {
    setCurrentIndex(prev => prev === 0 ? certificates.length - 1 : prev - 1);
  };
  
  const handleNext = () => {
    setCurrentIndex(prev => prev === certificates.length - 1 ? 0 : prev + 1);
  };
  
  return <>
      <Badge variant="success" onClick={() => setOpen(true)} className="flex items-center gap-1 cursor-pointer text-green-800 bg-blue-500 rounded px-[5px] mx-0">
        <CircleCheck className="h-3.5 w-3.5 text-green-600 fill-green-50" />
        <span className="text-slate-50">Insp. report</span>
      </Badge>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Inspection Certificate</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center py-4">
            {certificates.length > 0 && <>
                <div className="max-h-[70vh] overflow-auto w-full bg-gray-50 p-2 rounded-md">
                  {certificates[currentIndex].endsWith('.pdf') ? <object data={certificates[currentIndex]} type="application/pdf" width="100%" height="500px">
                      <p>Your browser doesn't support PDF preview. <a href={certificates[currentIndex]} target="_blank" rel="noopener noreferrer">Download PDF</a></p>
                    </object> : <img src={certificates[currentIndex]} alt="Inspection Certificate" className="w-full max-h-[500px] object-contain" />}
                </div>
                
                {certificates.length > 1 && <div className="flex items-center justify-between w-full mt-4">
                    <Button onClick={handlePrevious} variant="outline" size="sm">Previous</Button>
                    <span className="text-sm text-gray-600">
                      {currentIndex + 1} of {certificates.length}
                    </span>
                    <Button onClick={handleNext} variant="outline" size="sm">Next</Button>
                  </div>}
                
                <div className="mt-4">
                  <Button asChild variant="outline" size="sm">
                    <a href={certificates[currentIndex]} download target="_blank" rel="noopener noreferrer">
                      Download Certificate
                    </a>
                  </Button>
                </div>
              </>}
          </div>
        </DialogContent>
      </Dialog>
    </>;
};

export default CertificateBadge;
