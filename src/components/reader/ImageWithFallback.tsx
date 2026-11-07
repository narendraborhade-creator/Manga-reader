"use client";

import React, { useState, useEffect } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { CyberGadaLoader } from "../hud/CyberGadaLoader";

interface ImageWithFallbackProps {
  src: string;
  fallbackSrc?: string;
  alt: string;
  className?: string;
  priority?: boolean;
  onLoadSuccess?: () => void;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  fallbackSrc,
  alt,
  className = "",
  priority = false,
  onLoadSuccess,
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>(src);
  const [hasTriedFallback, setHasTriedFallback] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);

  useEffect(() => {
    setCurrentSrc(src);
    setHasTriedFallback(false);
    setIsLoading(true);
    setHasError(false);
  }, [src]);

  const handleError = () => {
    if (!hasTriedFallback && fallbackSrc && fallbackSrc !== currentSrc) {
      setHasTriedFallback(true);
      setCurrentSrc(fallbackSrc);
      setIsLoading(true);
      setHasError(false);
    } else {
      setIsLoading(false);
      setHasError(true);
    }
  };

  const handleManualRetry = () => {
    setIsLoading(true);
    setHasError(false);
    setRetryCount((prev) => prev + 1);
    // Append cache-busting timestamp to retry
    const delimiter = currentSrc.includes("?") ? "&" : "?";
    setCurrentSrc(`${currentSrc}${delimiter}_t=${Date.now()}`);
  };

  return (
    <div className={`relative min-h-[350px] md:min-h-[600px] w-full flex items-center justify-center bg-void/90 overflow-hidden ${className}`}>
      {/* Loading State */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-void/80 z-10 backdrop-blur-sm">
          <CyberGadaLoader size="sm" text="LOADING SACRED MANGA SCROLL..." subtext="SYNCHRONIZING PIXELS" />
        </div>
      )}

      {/* Error Fallback State */}
      {hasError && (
        <div className="flex flex-col items-center justify-center p-8 bg-sanctum/90 border border-sindoor/40 rounded text-center z-20 my-10 max-w-md mx-auto">
          <AlertTriangle className="w-10 h-10 text-sindoor mb-3 animate-pulse" />
          <h4 className="font-hud uppercase text-lg text-ashram font-bold tracking-wider mb-1">
            Page Stream Interrupted
          </h4>
          <p className="font-mono text-xs text-ashram-muted mb-4">
            MangaDex node or image stream timed out. Tap below to reconnect.
          </p>
          <button
            onClick={handleManualRetry}
            className="flex items-center gap-2 px-4 py-2 bg-sindoor hover:bg-sindoor-glow text-white font-hud uppercase tracking-wider text-sm rounded transition-all shadow-sindoor-neon"
          >
            <RefreshCw className="w-4 h-4" />
            Reconnect Stream
          </button>
        </div>
      )}

      {/* Render Image with referrerPolicy="no-referrer" to guarantee zero hotlink blocks */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={`${currentSrc}-${retryCount}`}
        src={currentSrc}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        referrerPolicy="no-referrer"
        onLoad={() => {
          setIsLoading(false);
          setHasError(false);
          onLoadSuccess?.();
        }}
        onError={handleError}
        className={`w-full max-w-4xl mx-auto h-auto object-contain transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
      />
    </div>
  );
};
