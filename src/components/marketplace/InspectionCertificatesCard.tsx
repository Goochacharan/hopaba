import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText } from 'lucide-react';
interface InspectionCertificatesCardProps {
  certificates: string[] | null;
}
const InspectionCertificatesCard: React.FC<InspectionCertificatesCardProps> = ({
  certificates
}) => {
  const [openModal, setOpenModal] = useState(false);
  const [currentCertificate, setCurrentCertificate] = useState<string | null>(null);
  if (!certificates || certificates.length === 0) {
    return null;
  }
  const handleViewCertificate = (url: string) => {
    setCurrentCertificate(url);
    setOpenModal(true);
  };
  const handlePrevious = () => {
    if (!currentCertificate || !certificates) return;
    const currentIndex = certificates.indexOf(currentCertificate);
    const newIndex = currentIndex === 0 ? certificates.length - 1 : currentIndex - 1;
    setCurrentCertificate(certificates[newIndex]);
  };
  const handleNext = () => {
    if (!currentCertificate || !certificates) return;
    const currentIndex = certificates.indexOf(currentCertificate);
    const newIndex = currentIndex === certificates.length - 1 ? 0 : currentIndex + 1;
    setCurrentCertificate(certificates[newIndex]);
  };
  return <>
      <Card className="bg-white shadow-sm border rounded-xl overflow-hidden mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="font-semibold flex items-center text-base">
            <FileText className="h-4 w-4 text-blue-500 mr-2" />
            Inspection Certificates
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {certificates.map((cert, index) => <Button key={index} size="sm" variant="outline" className="text-xs px-3 py-1 h-auto border border-blue-200 hover:border-blue-500 hover:bg-blue-50" onClick={() => handleViewCertificate(cert)}>
                <FileText className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
                Certificate {index + 1}
              </Button>)}
          </div>
        </CardContent>
      </Card>

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Inspection Certificate</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center py-4">
            {currentCertificate && <>
                <div className="max-h-[70vh] overflow-auto w-full bg-gray-50 p-2 rounded-md">
                  {currentCertificate.endsWith('.pdf') ? <object data={currentCertificate} type="application/pdf" width="100%" height="500px">
                      <p>Your browser doesn't support PDF preview. <a href={currentCertificate} target="_blank" rel="noopener noreferrer">Download PDF</a></p>
                    </object> : <img src={currentCertificate} alt="Inspection Certificate" className="w-full max-h-[500px] object-contain" />}
                </div>
                
                {certificates.length > 1 && <div className="flex items-center justify-between w-full mt-4">
                    <Button onClick={handlePrevious} variant="outline" size="sm">Previous</Button>
                    <span className="text-sm text-gray-600">
                      {certificates.indexOf(currentCertificate) + 1} of {certificates.length}
                    </span>
                    <Button onClick={handleNext} variant="outline" size="sm">Next</Button>
                  </div>}
                
                <div className="mt-4">
                  <Button asChild variant="outline" size="sm">
                    <a href={currentCertificate} download target="_blank" rel="noopener noreferrer">
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
export default InspectionCertificatesCard;