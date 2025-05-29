
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
            src="/lovable-uploads/d0e2cc43-097a-4f2d-9c8c-9ccadce28eb9.png" 
            alt="Chowkashi Logo" 
            className="w-24 h-24 object-contain"
          />
        </div>
        <h1 className="text-6xl font-bold text-gray-800 mb-4">
          Chowkashi
        </h1>
        <p className="text-2xl text-gray-600 font-medium">
          Ask Find Bargain
        </p>
        
        {/* Loading indicator */}
        <div className="mt-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
