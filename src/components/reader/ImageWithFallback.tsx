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
    } else if (!hasTriedFallback && currentSrc.startsWith("http") && !currentSrc.includes("/api/proxy/image")) {
      setHasTriedFallback(true);
      setCurrentSrc(`/api/proxy/image?url=${encodeURIComponent(currentSrc)}`);
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
    const delimiter = currentSrc.includes("?") ? "&" : "?";
    setCurrentSrc(`${currentSrc}${delimiter}_t=${Date.now()}`);
  };

  return (
    <div className={`relative min-h-[350px] md:min-h-[600px] w-full flex items-center justify-center bg-[#0b0e14] overflow-hidden ${className}`}>
      {/* Loading Skeleton & Spinner */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0b0e14] z-10">
          <CyberGadaLoader size="sm" text="Loading page..." subtext="Buffering high-res scan" />
        </div>
      )}

      {/* Error Fallback State */}
      {hasError && (
        <div className="flex flex-col items-center justify-center p-8 bg-[#121622] border border-[#23293e] rounded-2xl text-center z-20 my-10 max-w-md mx-auto shadow-xl">
          <AlertTriangle className="w-10 h-10 text-amber-400 mb-3" />
          <h4 className="font-sans text-base text-white font-bold tracking-tight mb-1">
            Page Stream Interrupted
          </h4>
          <p className="font-sans text-xs text-slate-400 mb-4 leading-relaxed">
            The page image stream timed out or was blocked by the upstream provider.
          </p>
          <button
            onClick={handleManualRetry}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-sans font-semibold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/20"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reconnect Stream
          </button>
        </div>
      )}

      {/* Render Image with referrerPolicy="no-referrer" */}
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
