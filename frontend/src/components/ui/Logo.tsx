import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export const ElimuHubLogo: React.FC<LogoProps> = ({ className = "w-12 h-12", showText = true }) => {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* The SVG Graphic */}
      <svg 
        viewBox="0 0 100 80" 
        className="w-full h-full drop-shadow-md" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="elimuNavyToGreen" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0B132B" /> {/* Navy Blue */}
            <stop offset="100%" stopColor="#22c55e" /> {/* Vibrant Green */}
          </linearGradient>
          <linearGradient id="elimuGreenToNavy" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" /> 
            <stop offset="100%" stopColor="#0B132B" /> 
          </linearGradient>
          
          <radialGradient id="centerDot" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#166534" />
          </radialGradient>
        </defs>

        {/* Outer Book Silhouette */}
        <path 
          d="M 50 75 
             C 50 75, 20 60, 20 30 
             C 20 15, 35 15, 50 30 
             C 65 15, 80 15, 80 30 
             C 80 60, 50 75, 50 75 Z" 
          stroke="url(#elimuNavyToGreen)" 
          strokeWidth="6" 
          strokeLinejoin="round" 
          strokeLinecap="round"
        />
        
        {/* Inner Pages */}
        <path 
          d="M 50 30 L 50 70 M 26 35 C 35 28, 45 35, 50 45 M 74 35 C 65 28, 55 35, 50 45" 
          stroke="url(#elimuGreenToNavy)" 
          strokeWidth="4" 
          strokeLinecap="round"
        />
        
        {/* Central Hub Node */}
        <circle cx="50" cy="45" r="5" fill="url(#centerDot)" />

        {/* Left Connection Node */}
        <circle cx="32" cy="18" r="2.5" fill="#0B132B" />
        <path d="M 50 30 Q 40 18 32 18" stroke="#0B132B" strokeWidth="2" fill="none" strokeLinecap="round" />
        
        {/* Right Connection Node */}
        <circle cx="68" cy="18" r="2.5" fill="#166534" />
        <path d="M 50 30 Q 60 18 68 18" stroke="#166534" strokeWidth="2" fill="none" strokeLinecap="round" />
        
        {/* Top Connection Node */}
        <circle cx="50" cy="10" r="3" fill="#22c55e" />
        <path d="M 50 30 L 50 10" stroke="url(#elimuGreenToNavy)" strokeWidth="2" strokeLinecap="round" />
      </svg>

      {/* Typography */}
      {showText && (
        <span 
          className="mt-2 font-['Inter'] font-bold tracking-tight text-[#0B132B] dark:text-white"
          style={{ fontSize: 'clamp(1rem, 2.5vw, 1.5rem)' }}
        >
          Elimu<span className="text-[#22c55e]">Hub</span>
        </span>
      )}
    </div>
  );
};
