"use client";

import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: "sindoor" | "gada" | "prana" | "none" | "indigo";
  hoverEffect?: boolean;
  onClick?: () => void;
}

export const YantraCard: React.FC<CardProps> = ({
  children,
  className = "",
  hoverEffect = true,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative group bg-[#121622]/90 backdrop-blur-md border border-[#23293e] text-slate-100 transition-all duration-300 rounded-xl overflow-hidden ${
        hoverEffect
          ? "hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-0.5"
          : ""
      } ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      <div className="relative z-10 h-full flex flex-col">{children}</div>
    </div>
  );
};

export const ModernCard = YantraCard;
