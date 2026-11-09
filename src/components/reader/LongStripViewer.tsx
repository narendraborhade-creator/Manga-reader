"use client";

import React, { useEffect, useRef } from "react";
import { ImageWithFallback } from "./ImageWithFallback";

interface LongStripViewerProps {
  proxiedPages: string[];
  directPages: string[];
  onPageVisible: (page: number) => void;
  onNearEnd?: () => void;
  currentPage: number;
}

export const LongStripViewer: React.FC<LongStripViewerProps> = ({
  proxiedPages,
  directPages,
  onPageVisible,
  onNearEnd,
  currentPage,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Preload next 3 images in offscreen buffer
  useEffect(() => {
    if (!directPages.length) return;
    const startIdx = Math.max(0, currentPage - 1);
    const endIdx = Math.min(directPages.length, startIdx + 4);

    for (let i = startIdx; i < endIdx; i++) {
      const url = directPages[i] || proxiedPages[i];
      if (url) {
        const img = new Image();
        img.referrerPolicy = "no-referrer";
        img.src = url;
      }
    }
  }, [currentPage, directPages, proxiedPages]);

  // Track scroll position to update current visible page and near-end trigger
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const scrollPosition = window.scrollY + window.innerHeight / 3;

      for (let i = 0; i < pageRefs.current.length; i++) {
        const el = pageRefs.current[i];
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            onPageVisible(i + 1);
            break;
          }
        }
      }

      // Check if user reached 85% of the chapter
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = window.scrollY / totalHeight;
        if (progress >= 0.85) {
          onNearEnd?.();
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [onPageVisible, onNearEnd]);

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center select-none pb-24">
      {proxiedPages.map((pageUrl, idx) => {
        const isFirstThree = idx < 3;
        const directUrl = directPages[idx];

        const isDirectDomainAllowed = Boolean(
          directUrl &&
            (directUrl.includes("mangadex.network") ||
              directUrl.includes("uploads.mangadex.org") ||
              directUrl.includes("compsci88.com") ||
              directUrl.includes("anilist.co"))
        );

        const primarySrc = isDirectDomainAllowed ? directUrl : (pageUrl || directUrl);
        const fallbackSrc = isDirectDomainAllowed ? pageUrl : directUrl;

        return (
          <div
            key={pageUrl || directUrl || idx}
            ref={(el) => {
              pageRefs.current[idx] = el;
            }}
            id={`page-${idx + 1}`}
            className="w-full max-w-4xl relative flex flex-col items-center"
          >
            <ImageWithFallback
              src={primarySrc}
              fallbackSrc={fallbackSrc}
              alt={`Page ${idx + 1}`}
              priority={isFirstThree}
            />

            {/* Subtle Page Divider & Counter */}
            <div className="w-full py-1 bg-void/80 text-center font-mono text-[10px] text-ashram-muted/50 border-b border-sanctum-border/30">
              PAGE {idx + 1}
            </div>
          </div>
        );
      })}
    </div>
  );
};
