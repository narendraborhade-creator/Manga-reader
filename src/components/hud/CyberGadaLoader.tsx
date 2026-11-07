"use client";

import React from "react";

interface CyberGadaLoaderProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  subtext?: string;
}

export const CyberGadaLoader: React.FC<CyberGadaLoaderProps> = ({
  size = "md",
  text = "ॐ हं हनुमते नमः // RESOLVING SACRED DATA",
  subtext = "VAJRA-NET TELEMETRY SYNCHRONIZED",
}) => {
  const dimensions = {
    sm: "w-16 h-16",
    md: "w-28 h-28",
    lg: "w-44 h-44",
  }[size];

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center select-none">
      <div className={`relative ${dimensions} mb-4 flex items-center justify-center`}>
        {/* Outer Rotating Vedic Sun Ring */}
        <div className="absolute inset-0 border-2 border-dashed border-gada/40 rounded-full animate-spin-slow" />
        
        {/* Pulsing Prana Energy Aura */}
        <div className="absolute inset-2 border border-prana/30 rounded-full animate-ping opacity-30" />
        
        {/* Inner Counter-Rotating Hexagon/Yantra Ring */}
        <div
          className="absolute inset-3 border border-sindoor/50 rounded-full animate-spin"
          style={{ animationDirection: "reverse", animationDuration: "6s" }}
        />

        {/* Central Cyber-Gada SVG Mace Motif */}
        <svg
          viewBox="0 0 100 100"
          className="w-3/4 h-3/4 text-gada drop-shadow-[0_0_12px_rgba(255,184,0,0.8)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Central Handle / Shaft with Circuitry */}
          <line
            x1="50"
            y1="88"
            x2="50"
            y2="32"
            stroke="url(#shaftGrad)"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <circle cx="50" cy="90" r="4" fill="#FFB800" />
          
          {/* Grip rings */}
          <line x1="46" y1="75" x2="54" y2="75" stroke="#00F0FF" strokeWidth="2" />
          <line x1="46" y1="65" x2="54" y2="65" stroke="#00F0FF" strokeWidth="2" />
          <line x1="46" y1="55" x2="54" y2="55" stroke="#00F0FF" strokeWidth="2" />

          {/* Golden Gada Mace Head (Dome & Flutes) */}
          <ellipse cx="50" cy="30" rx="20" ry="16" fill="url(#gadaHeadGrad)" stroke="#FFD700" strokeWidth="2" />
          
          {/* Fluted Spikes / Petals */}
          <path d="M50 12 L53 20 L47 20 Z" fill="#FF3B00" />
          <path d="M30 26 L23 30 L30 34 Z" fill="#FFB800" />
          <path d="M70 26 L77 30 L70 34 Z" fill="#FFB800" />
          <path d="M36 17 L30 14 L38 23 Z" fill="#FFB800" />
          <path d="M64 17 L70 14 L62 23 Z" fill="#FFB800" />

          {/* Central Prana Energy Crystal */}
          <circle cx="50" cy="30" r="5" fill="#00F0FF" className="animate-pulse" />
          <circle cx="50" cy="30" r="2" fill="#FFFFFF" />

          {/* Gradients */}
          <defs>
            <linearGradient id="shaftGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#B88600" />
              <stop offset="50%" stopColor="#FFD700" />
              <stop offset="100%" stopColor="#FF3B00" />
            </linearGradient>
            <radialGradient id="gadaHeadGrad" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#FFF2A3" />
              <stop offset="50%" stopColor="#FFB800" />
              <stop offset="90%" stopColor="#FF3B00" />
              <stop offset="100%" stopColor="#110E1B" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      {text && (
        <div className="font-hud tracking-widest text-sm text-gada-bright uppercase font-semibold drop-shadow-[0_0_8px_rgba(255,184,0,0.5)]">
          {text}
        </div>
      )}
      {subtext && (
        <div className="font-mono text-xs text-ashram-muted tracking-wider mt-1 opacity-80">
          {subtext}
        </div>
      )}
    </div>
  );
};
