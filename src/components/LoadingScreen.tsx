
import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center z-50">
      <style>
        {`
          @keyframes zoomIn {
            0% {
              transform: scale(0.5);
              opacity: 0;
            }
            50% {
              transform: scale(1.1);
              opacity: 0.8;
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
          
          .zoom-in-animation {
            animation: zoomIn 2s ease-out forwards;
          }
        `}
      </style>
      
      <div className="text-center zoom-in-animation">
        <div className="flex justify-center mb-4">
          <img 
            src="/lovable-uploads/c86a553b-b292-4a63-8de7-e97eee43a75e.png" 
            alt="Chowkashi Logo" 
            className="w-32 h-auto object-contain"
          />
        </div>
        
        {/* Loading indicator */}
        <div className="mt-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
