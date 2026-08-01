import React from "react";

interface LogoMarkProps {
  size?: number | string;
  className?: string;
  pupil?: string;
  stroke?: string;
}

export const LogoMark: React.FC<LogoMarkProps> = ({
  size = 28,
  className = "",
  pupil = "currentColor",
  stroke = "currentColor",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    className={className}
    aria-hidden="true"
    role="img"
  >
    {/* Viewfinder outer frame */}
    <path d="M4 9 V5 C4 4.4 4.4 4 5 4 H9" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
    <path d="M23 4 H27 C27.6 4 28 4.4 28 5 V9" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
    <path d="M28 23 V27 C28 27.6 27.6 28 27 28 H23" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
    <path d="M9 28 H5 C4.4 28 4 27.6 4 27 V23" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
    
    {/* Code syntax chevrons "<" and ">" */}
    <path d="M13 12 L10 16 L13 20" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19 12 L22 16 L19 20" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    
    {/* Center sensor pupil */}
    <circle cx="16" cy="16" r="2" fill={pupil} />
  </svg>
);

interface LogoProps {
  size?: number | string;
  className?: string;
  textClassName?: string;
  hideText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 26,
  className = "",
  textClassName = "",
  hideText = false,
}) => (
  <span className={`inline-flex items-center gap-2.5 font-sans ${className}`}>
    <LogoMark size={size} />
    {!hideText && (
      <span className={`text-base font-bold tracking-tight ${textClassName}`}>
        CodeProctor
      </span>
    )}
  </span>
);
