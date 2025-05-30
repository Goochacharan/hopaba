
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
        <div className="mb-4">
          <h1 className="text-6xl font-bold text-primary mb-2">
            Chowkashi
          </h1>
          <p className="text-xl text-muted-foreground font-medium">
            Ask Find Bargain
          </p>
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
