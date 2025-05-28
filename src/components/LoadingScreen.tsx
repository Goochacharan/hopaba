
import React from 'react';
import AnimatedLogo from './AnimatedLogo';

const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
      <div className="flex flex-col items-center gap-4 animate-zoom-in">
        <AnimatedLogo size="lg" className="w-24 h-24" />
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-700 mb-2">Chowkashi</h1>
          <p className="text-lg text-orange-600 font-medium">Ask Find Bargain</p>
        </div>
      </div>
      <div className="mt-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
      
      <style jsx>{`
        @keyframes zoom-in {
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
        
        .animate-zoom-in {
          animation: zoom-in 1.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
