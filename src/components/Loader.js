import React from 'react';
import { Home } from 'lucide-react';

const Loader = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 flex items-center justify-center z-50 px-4">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-white/5 rounded-full blur-3xl animate-pulse top-1/4 left-1/4"></div>
        <div className="absolute w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-accent-400/10 rounded-full blur-3xl animate-pulse bottom-1/4 right-1/4 animation-delay-2000"></div>
      </div>

      {/* Main loader content */}
      <div className="relative text-center max-w-xl mx-auto">
        {/* Logo animation */}
        <div className="mb-6 sm:mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-ping"></div>
            <div className="relative bg-white rounded-full p-4 sm:p-6 md:p-7 shadow-2xl animate-bounce-slow">
              <Home className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 text-primary-600" />
            </div>
          </div>
        </div>

        {/* "You Decide" text with animation */}
        <div className="space-y-3 sm:space-y-4 px-2">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-tight">
            <span className="inline-block animate-fade-in-up animation-delay-200">Y</span>
            <span className="inline-block animate-fade-in-up animation-delay-300">o</span>
            <span className="inline-block animate-fade-in-up animation-delay-400">u</span>
            <span className="inline-block mx-2 sm:mx-3"></span>
            <span className="inline-block animate-fade-in-up animation-delay-500">D</span>
            <span className="inline-block animate-fade-in-up animation-delay-600">e</span>
            <span className="inline-block animate-fade-in-up animation-delay-700">c</span>
            <span className="inline-block animate-fade-in-up animation-delay-800">i</span>
            <span className="inline-block animate-fade-in-up animation-delay-900">d</span>
            <span className="inline-block animate-fade-in-up animation-delay-1000">e</span>
          </h1>
          
          <p className="text-base sm:text-lg md:text-2xl text-white/90 font-light animate-fade-in animation-delay-1200">
            Your Perfect Home Awaits
          </p>
        </div>

        {/* Loading dots */}
        <div className="flex justify-center space-x-2 mt-6 sm:mt-8 animate-fade-in animation-delay-1400">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full animate-bounce animation-delay-0"></div>
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full animate-bounce animation-delay-200"></div>
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full animate-bounce animation-delay-400"></div>
        </div>

        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
      </div>

      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
          opacity: 0;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }

        .animation-delay-0 {
          animation-delay: 0ms;
        }

        .animation-delay-200 {
          animation-delay: 200ms;
        }

        .animation-delay-300 {
          animation-delay: 300ms;
        }

        .animation-delay-400 {
          animation-delay: 400ms;
        }

        .animation-delay-500 {
          animation-delay: 500ms;
        }

        .animation-delay-600 {
          animation-delay: 600ms;
        }

        .animation-delay-700 {
          animation-delay: 700ms;
        }

        .animation-delay-800 {
          animation-delay: 800ms;
        }

        .animation-delay-900 {
          animation-delay: 900ms;
        }

        .animation-delay-1000 {
          animation-delay: 1000ms;
        }

        .animation-delay-1200 {
          animation-delay: 1200ms;
        }

        .animation-delay-1400 {
          animation-delay: 1400ms;
        }

        .animation-delay-2000 {
          animation-delay: 2000ms;
        }
      `}</style>
    </div>
  );
};

export default Loader;
