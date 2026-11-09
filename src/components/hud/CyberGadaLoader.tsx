"use client";

import React from "react";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  subtext?: string;
}

export const CyberGadaLoader: React.FC<LoaderProps> = ({
  size = "md",
  text = "Loading manga stream...",
  subtext = "Connecting to source repository",
}) => {
  const dimensions = {
    sm: "w-8 h-8",
    md: "w-14 h-14",
    lg: "w-20 h-20",
  }[size];

  const strokeWidth = size === "sm" ? 3 : 4;

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center select-none">
      <div className={`relative ${dimensions} mb-4 flex items-center justify-center`}>
        {/* Modern Indigo Spinner */}
        <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500 border-r-indigo-400 animate-spin" />
        <div
          className="absolute inset-1.5 rounded-full border border-transparent border-b-fuchsia-500 animate-spin"
          style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
        />
        {/* Subtle center glow dot */}
        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
      </div>

      {text && (
        <h4 className="font-sans text-xs md:text-sm font-semibold text-slate-200 tracking-wide">
          {text}
        </h4>
      )}

      {subtext && (
        <p className="font-mono text-[11px] text-slate-500 mt-1 tracking-wider uppercase">
          {subtext}
        </p>
      )}
    </div>
  );
};

// Also export as MangayomiLoader for modern usage
export const MangayomiLoader = CyberGadaLoader;
