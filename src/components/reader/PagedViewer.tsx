"use client";

import React, { useEffect } from "react";
import { ImageWithFallback } from "./ImageWithFallback";
import { ReadingMode } from "./ReaderControls";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PagedViewerProps {
  proxiedPages: string[];
  directPages: string[];
  currentPage: number;
  readingMode: "rtl" | "ltr" | "double";
  onPageChange: (page: number) => void;
  onNearEnd?: () => void;
}

export const PagedViewer: React.FC<PagedViewerProps> = ({
  proxiedPages,
  directPages,
  currentPage,
  readingMode,
  onPageChange,
  onNearEnd,
}) => {
  const total = proxiedPages.length;
  const isDouble = readingMode === "double";

  // Preload adjacent images
  useEffect(() => {
    const nextIdx = currentPage;
    if (nextIdx < total && directPages[nextIdx]) {
      const img1 = new Image();
      img1.referrerPolicy = "no-referrer";
      img1.src = directPages[nextIdx];
    }
    if (nextIdx + 1 < total && directPages[nextIdx + 1]) {
      const img2 = new Image();
      img2.referrerPolicy = "no-referrer";
      img2.src = directPages[nextIdx + 1];
    }

    if (currentPage >= Math.floor(total * 0.85)) {
      onNearEnd?.();
    }
  }, [currentPage, total, directPages, onNearEnd]);

  const handleNext = () => {
    const step = isDouble ? 2 : 1;
    if (currentPage + step <= total) {
      onPageChange(currentPage + step);
    }
  };

  const handlePrev = () => {
    const step = isDouble ? 2 : 1;
    if (currentPage - step >= 1) {
      onPageChange(currentPage - step);
    }
  };

  // Click zone handling (RTL: click left = NEXT, click right = PREV)
  const handleLeftZoneClick = () => {
    if (readingMode === "rtl") {
      handleNext();
    } else {
      handlePrev();
    }
  };

  const handleRightZoneClick = () => {
    if (readingMode === "rtl") {
      handlePrev();
    } else {
      handleNext();
    }
  };

  const currentIdx = Math.max(0, currentPage - 1);
  const secondIdx = isDouble && currentIdx + 1 < total ? currentIdx + 1 : null;

  return (
    <div className="relative w-full min-h-[85vh] flex items-center justify-center select-none py-14 overflow-hidden">
      {/* Clickable Navigation Tap Zones */}
      <div
        onClick={handleLeftZoneClick}
        className="absolute left-0 top-0 bottom-0 w-1/4 z-30 cursor-pointer hover:bg-white/[0.02] transition-colors flex items-center justify-start p-4 group"
        title={readingMode === "rtl" ? "Next Page (RTL)" : "Previous Page"}
      >
        <span className="p-2 rounded-full bg-sanctum/80 border border-sanctum-border opacity-0 group-hover:opacity-100 text-gada transition-opacity">
          <ChevronLeft className="w-6 h-6" />
        </span>
      </div>

      <div
        onClick={handleRightZoneClick}
        className="absolute right-0 top-0 bottom-0 w-1/4 z-30 cursor-pointer hover:bg-white/[0.02] transition-colors flex items-center justify-end p-4 group"
        title={readingMode === "rtl" ? "Previous Page (RTL)" : "Next Page"}
      >
        <span className="p-2 rounded-full bg-sanctum/80 border border-sanctum-border opacity-0 group-hover:opacity-100 text-gada transition-opacity">
          <ChevronRight className="w-6 h-6" />
        </span>
      </div>

      {/* Page Canvas */}
      <div
        className={`relative z-10 w-full flex items-center justify-center gap-2 max-w-5xl ${
          readingMode === "rtl" ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {/* Page 1 */}
        <div className="w-full flex-1 flex justify-center">
          <ImageWithFallback
            src={proxiedPages[currentIdx]}
            fallbackSrc={directPages[currentIdx]}
            alt={`Page ${currentPage}`}
            priority={true}
          />
        </div>

        {/* Page 2 (Double Spread Mode) */}
        {isDouble && secondIdx !== null && (
          <div className="w-full flex-1 flex justify-center">
            <ImageWithFallback
              src={proxiedPages[secondIdx]}
              fallbackSrc={directPages[secondIdx]}
              alt={`Page ${currentPage + 1}`}
              priority={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};
