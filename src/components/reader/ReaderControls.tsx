"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Sliders,
  Settings,
  HelpCircle,
  BookOpen,
  Layers,
} from "lucide-react";

export type ReadingMode = "webtoon" | "rtl" | "ltr" | "double";

interface ReaderControlsProps {
  mangaId: string;
  mangaTitle: string;
  chapterTitle: string;
  currentPage: number;
  totalPages: number;
  readingMode: ReadingMode;
  quality: "data" | "data-saver";
  prevChapterId?: string | null;
  nextChapterId?: string | null;
  hudVisible: boolean;
  onPageChange: (page: number) => void;
  onModeChange: (mode: ReadingMode) => void;
  onQualityChange: (quality: "data" | "data-saver") => void;
  onToggleHud: () => void;
}

export const ReaderControls: React.FC<ReaderControlsProps> = ({
  mangaId,
  mangaTitle,
  chapterTitle,
  currentPage,
  totalPages,
  readingMode,
  quality,
  prevChapterId,
  nextChapterId,
  hudVisible,
  onPageChange,
  onModeChange,
  onQualityChange,
  onToggleHud,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <>
      {/* Top Floating Cyber HUD Bar */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          hudVisible
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-void/90 backdrop-blur-md border-b border-sanctum-border px-4 py-3 shadow-hud-glow">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Back button & Title */}
            <div className="flex items-center gap-3">
              <Link
                href={`/manga/${mangaId}`}
                className="p-2 rounded bg-sanctum border border-sanctum-border hover:border-gada text-ashram hover:text-gada transition-all"
                title="Return to Manga Codex"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h2 className="font-hud text-sm md:text-base font-bold text-ashram tracking-wide line-clamp-1">
                  {mangaTitle}
                </h2>
                <div className="font-mono text-xs text-gada tracking-wider">
                  {chapterTitle}
                </div>
              </div>
            </div>

            {/* Quick Actions (Mode, Quality, Fullscreen) */}
            <div className="flex items-center gap-2">
              {/* Quality Toggle */}
              <button
                onClick={() =>
                  onQualityChange(quality === "data" ? "data-saver" : "data")
                }
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-mono font-bold bg-sanctum border border-sanctum-border text-ashram hover:border-prana transition-colors"
                title="Switch Image Resolution"
              >
                <Sliders className="w-3.5 h-3.5 text-prana" />
                <span>{quality === "data" ? "HD (DATA)" : "SAVER"}</span>
              </button>

              {/* Settings Toggle */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded bg-sanctum border border-sanctum-border hover:border-gada text-ashram hover:text-gada transition-colors"
                title="Reader Settings"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Shortcuts Help */}
              <button
                onClick={() => setShowShortcuts(!showShortcuts)}
                className="hidden sm:block p-2 rounded bg-sanctum border border-sanctum-border hover:border-gada text-ashram hover:text-gada transition-colors"
                title="Keyboard Shortcuts"
              >
                <HelpCircle className="w-4 h-4" />
              </button>

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded bg-sanctum border border-sanctum-border hover:border-gada text-ashram hover:text-gada transition-colors"
                title="Toggle Fullscreen (F)"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Settings Drawer */}
        {showSettings && (
          <div className="bg-sanctum/95 backdrop-blur-lg border-b border-sanctum-border px-6 py-4 shadow-xl">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs font-hud uppercase">
              <div className="flex items-center gap-2">
                <span className="text-gada font-bold tracking-wider">// READING MODE:</span>
                <div className="flex gap-1">
                  {(
                    [
                      { mode: "webtoon", label: "Long-Strip" },
                      { mode: "rtl", label: "Manga (RTL)" },
                      { mode: "ltr", label: "Paged (LTR)" },
                      { mode: "double", label: "Double Spread" },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.mode}
                      onClick={() => onModeChange(m.mode)}
                      className={`px-3 py-1.5 rounded font-mono text-[11px] font-semibold transition-all ${
                        readingMode === m.mode
                          ? "bg-sindoor text-white shadow-sindoor-neon border border-sindoor-glow"
                          : "bg-void/80 text-ashram-muted hover:text-ashram border border-sanctum-border"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-gada font-bold tracking-wider">// QUALITY ENGINE:</span>
                <button
                  onClick={() => onQualityChange("data")}
                  className={`px-2.5 py-1 rounded font-mono text-[11px] ${
                    quality === "data"
                      ? "bg-gada text-void font-bold"
                      : "bg-void border border-sanctum-border text-ashram-muted"
                  }`}
                >
                  ORIGINAL HD
                </button>
                <button
                  onClick={() => onQualityChange("data-saver")}
                  className={`px-2.5 py-1 rounded font-mono text-[11px] ${
                    quality === "data-saver"
                      ? "bg-gada text-void font-bold"
                      : "bg-void border border-sanctum-border text-ashram-muted"
                  }`}
                >
                  DATA SAVER (WEBP)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Floating Cyber-Mandala Bar */}
      <div
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 w-[94%] max-w-2xl ${
          hudVisible
            ? "translate-y-0 opacity-100"
            : "translate-y-16 opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-sanctum/90 backdrop-blur-xl border border-gada/40 shadow-gada-gold rounded-full px-4 py-2 flex items-center justify-between gap-3">
          {/* Chapter Prev / Next Nav */}
          <div className="flex items-center gap-1">
            {prevChapterId ? (
              <Link
                href={`/read/${prevChapterId}`}
                className="p-1.5 rounded-full bg-void/80 hover:bg-sindoor text-ashram hover:text-white transition-all"
                title="Previous Chapter"
              >
                <ChevronLeft className="w-4 h-4" />
              </Link>
            ) : (
              <span className="p-1.5 opacity-30 cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />
              </span>
            )}
            <span className="font-mono text-[10px] text-ashram-muted uppercase hidden sm:inline">
              CH
            </span>
          </div>

          {/* Page Scrubber & Selector */}
          <div className="flex-1 flex items-center gap-2 justify-center">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="p-1 rounded text-ashram-muted hover:text-gada disabled:opacity-30"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <span className="font-mono text-xs text-gada-bright font-bold tracking-widest whitespace-nowrap">
              PAGE {currentPage} / {totalPages || 1}
            </span>

            {/* Slider Scrubber */}
            {totalPages > 1 && (
              <input
                type="range"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={(e) => onPageChange(parseInt(e.target.value, 10))}
                className="w-24 sm:w-40 accent-sindoor cursor-pointer h-1.5 bg-void rounded-lg"
              />
            )}

            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className="p-1 rounded text-ashram-muted hover:text-gada disabled:opacity-30"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Next Chapter Nav */}
          <div className="flex items-center gap-1">
            <span className="font-mono text-[10px] text-ashram-muted uppercase hidden sm:inline">
              NEXT
            </span>
            {nextChapterId ? (
              <Link
                href={`/read/${nextChapterId}`}
                className="p-1.5 rounded-full bg-void/80 hover:bg-sindoor text-ashram hover:text-white transition-all"
                title="Next Chapter"
              >
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <span className="p-1.5 opacity-30 cursor-not-allowed">
                <ChevronRight className="w-4 h-4" />
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Floating Mini Toggle Button (when HUD is hidden) */}
      {!hudVisible && (
        <button
          onClick={onToggleHud}
          className="fixed bottom-4 right-4 z-40 p-2.5 rounded-full bg-sanctum/80 backdrop-blur-md border border-gada/50 text-gada-bright shadow-gada-gold hover:scale-110 transition-transform"
          title="Open HUD Controls (M)"
        >
          <Layers className="w-5 h-5" />
        </button>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div
          onClick={() => setShowShortcuts(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 backdrop-blur-sm p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-sanctum border border-gada/60 shadow-gada-gold rounded-sm p-6 max-w-md w-full space-y-4 text-ashram"
          >
            <div className="flex items-center justify-between pb-2 border-b border-sanctum-border">
              <h3 className="font-hud uppercase text-lg text-gada font-bold tracking-wider">
                VAJRA COMMAND MATRIX
              </h3>
              <button
                onClick={() => setShowShortcuts(false)}
                className="text-ashram-muted hover:text-ashram"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between py-1 border-b border-sanctum-border/40">
                <span className="text-ashram-muted">Previous Page</span>
                <span className="px-2 py-0.5 bg-void border border-sanctum-border text-gada rounded">
                  ← / A
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-sanctum-border/40">
                <span className="text-ashram-muted">Next Page</span>
                <span className="px-2 py-0.5 bg-void border border-sanctum-border text-gada rounded">
                  → / D / Space
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-sanctum-border/40">
                <span className="text-ashram-muted">Toggle HUD Telemetry</span>
                <span className="px-2 py-0.5 bg-void border border-sanctum-border text-gada rounded">
                  M
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-ashram-muted">Toggle Fullscreen</span>
                <span className="px-2 py-0.5 bg-void border border-sanctum-border text-gada rounded">
                  F
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
