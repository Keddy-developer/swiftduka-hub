import React from "react";

const LoadingSpinner = () => {
 return (
       
       
       <div className="flex flex-col items-center justify-center min-h-[300px]">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-yellow-400 border-t-transparent border-b-transparent animate-spin-modern"></div>
              <div className="absolute inset-4 rounded-full border-4 border-gray-700"></div>
              <img
                className="absolute inset-0 m-auto w-8 h-8 text-yellow-400 animate-pulse"
                src="/logoweb.png"
              />
             
            </div>
            <style>
              {`
                @keyframes spin-modern {
                  0% { transform: rotate(0deg);}
                  100% { transform: rotate(360deg);}
                }
                .animate-spin-modern {
                  animation: spin-modern 1s linear infinite;
                }
              `}
            </style>
          </div>
    );
};

export default LoadingSpinner;