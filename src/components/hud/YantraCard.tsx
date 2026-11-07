"use client";

import React from "react";

interface YantraCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: "sindoor" | "gada" | "prana" | "none";
  hoverEffect?: boolean;
  onClick?: () => void;
}

export const YantraCard: React.FC<YantraCardProps> = ({
  children,
  className = "",
  glowColor = "sindoor",
  hoverEffect = true,
  onClick,
}) => {
  const glowClasses = {
    sindoor: "hover:shadow-sindoor-neon hover:border-sindoor/60",
    gada: "hover:shadow-gada-gold hover:border-gada/60",
    prana: "hover:shadow-prana-cyan hover:border-prana/60",
    none: "",
  }[glowColor];

  return (
    <div
      onClick={onClick}
      className={`relative group bg-sanctum/85 backdrop-blur-md border border-sanctum-border text-ashram transition-all duration-300 rounded-sm overflow-hidden ${
        hoverEffect ? glowClasses : ""
      } ${onClick ? "cursor-pointer" : ""} ${className}`}
      style={{
        clipPath:
          "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
      }}
    >
      {/* Chamfered Accent Corners */}
      <div className="absolute top-0 right-0 w-3 h-3 bg-gradient-to-bl from-gada to-transparent pointer-events-none opacity-70 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 left-0 w-3 h-3 bg-gradient-to-tr from-sindoor to-transparent pointer-events-none opacity-70 group-hover:opacity-100 transition-opacity" />

      {/* Cyber Grid Subtle Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

      {/* Card Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
