
import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center z-50">
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
        <div className="mb-4">
          <img 
            src="/lovable-uploads/60cd2039-5871-4340-9948-0f6380f407a3.png" 
            alt="Chowkashi"
            className="w-48 h-auto mx-auto mb-2"
          />
          <p className="text-xl text-amber-800 font-medium">
            Ask Find Bargain
          </p>
        </div>
        
        {/* Loading indicator */}
        <div className="mt-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
