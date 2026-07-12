import React from "react";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export const GilaniOSLogo: React.FC<LogoProps> = ({
  className = "w-12 h-12",
  showText = true,
}) => {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* The SVG Graphic */}
      <img 
        src="/logo192.png" 
        alt="GilaniOS Logo" 
        className="w-full h-full object-contain drop-shadow-md rounded-xl"
      />

      {/* Typography */}
      {showText && (
        <span
          className="mt-1.5 sm:mt-2 font-['Inter'] font-bold tracking-tight text-[#0B132B] dark:text-white"
          style={{ fontSize: "clamp(0.875rem, 2.2vw, 1.35rem)" }}
        >
          Gilani<span className="text-[#22c55e]">OS</span>
        </span>
      )}
    </div>
  );
};
