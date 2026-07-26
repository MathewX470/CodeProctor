import React from "react";

interface LogoMarkProps {
  size?: number | string;
  className?: string;
  pupil?: string;
  stroke?: string;
}

// CodeProctor logo mark: a camera/viewfinder frame (proctoring) wrapping a
// "< ■ >" code-eye (execution being watched). Brutalist, sharp, neon green pupil.
export const LogoMark: React.FC<LogoMarkProps> = ({
  size = 28,
  className = "",
  pupil = "#00FF66",
  stroke = "#FFFFFF",
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
    {/* Viewfinder outer surveillance camera frame */}
    <path d="M3 8 V3 H8" stroke={stroke} strokeWidth="2" strokeLinecap="square" />
    <path d="M24 3 H29 V8" stroke={stroke} strokeWidth="2" strokeLinecap="square" />
    <path d="M29 24 V29 H24" stroke={stroke} strokeWidth="2" strokeLinecap="square" />
    <path d="M8 29 H3 V24" stroke={stroke} strokeWidth="2" strokeLinecap="square" />
    
    {/* Sandboxed code syntax chevrons "<" and ">" */}
    <path d="M14 11 L10 16 L14 21" stroke={stroke} strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" />
    <path d="M18 11 L22 16 L18 21" stroke={stroke} strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" />
    
    {/* Active monitoring telemetry pupil */}
    <rect x="14.5" y="14.5" width="3" height="3" fill={pupil} className="animate-pulse" />
  </svg>
);

interface LogoProps {
  size?: number | string;
  className?: string;
  textClassName?: string;
  hideText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 28,
  className = "",
  textClassName = "",
  hideText = false,
}) => (
  <span className={`inline-flex items-center gap-2.5 ${className}`}>
    <LogoMark size={size} />
    {!hideText && (
      <span className={`font-mono text-sm font-extrabold tracking-tight ${textClassName}`}>
        CodeProctor<span className="text-[#00FF66] font-normal">_</span>
      </span>
    )}
  </span>
);
