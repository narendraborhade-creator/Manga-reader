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
  X,
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
      {/* Top Floating Reader Bar */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          hudVisible
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-[#121622]/95 backdrop-blur-md border-b border-[#23293e] px-4 py-3 shadow-xl">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Back button & Title */}
            <div className="flex items-center gap-3">
              <Link
                href={`/manga/${mangaId}`}
                className="p-2 rounded-xl bg-[#0b0e14] border border-[#23293e] hover:border-indigo-500 text-slate-300 hover:text-white transition-all"
                title="Return to Manga Details"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h2 className="font-sans text-sm md:text-base font-bold text-white line-clamp-1">
                  {mangaTitle}
                </h2>
                <div className="font-sans text-xs text-indigo-400 font-medium">
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
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-medium bg-[#0b0e14] border border-[#23293e] text-slate-300 hover:border-indigo-500 transition-colors"
                title="Switch Image Resolution"
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <span>{quality === "data" ? "HD" : "Saver"}</span>
              </button>

              {/* Settings Toggle */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-lg border transition-colors ${
                  showSettings
                    ? "bg-indigo-600 text-white border-indigo-500"
                    : "bg-[#0b0e14] border-[#23293e] text-slate-300 hover:text-white hover:border-indigo-500"
                }`}
                title="Reader Settings"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Shortcuts Help */}
              <button
                onClick={() => setShowShortcuts(!showShortcuts)}
                className="hidden sm:block p-2 rounded-lg bg-[#0b0e14] border border-[#23293e] text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
                title="Keyboard Shortcuts"
              >
                <HelpCircle className="w-4 h-4" />
              </button>

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-lg bg-[#0b0e14] border border-[#23293e] text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
                title="Toggle Fullscreen (F)"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Settings Drawer */}
        {showSettings && (
          <div className="bg-[#0e121a]/95 backdrop-blur-xl border-b border-[#23293e] px-6 py-4 shadow-2xl">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs font-sans">
              <div className="flex items-center gap-3">
                <span className="text-slate-400 font-semibold uppercase tracking-wider">Reading Mode:</span>
                <div className="flex gap-1.5">
                  {(
                    [
                      { mode: "webtoon", label: "Webtoon (Vertical)" },
                      { mode: "rtl", label: "Manga (RTL)" },
                      { mode: "ltr", label: "Paged (LTR)" },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.mode}
                      onClick={() => onModeChange(m.mode)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-all ${
                        readingMode === m.mode
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold"
                          : "bg-[#161c2e] text-slate-400 hover:text-white border border-[#23293e]"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-slate-400 font-semibold uppercase tracking-wider">Quality:</span>
                <button
                  onClick={() => onQualityChange("data")}
                  className={`px-3 py-1.5 rounded-lg font-sans text-xs transition-colors ${
                    quality === "data"
                      ? "bg-indigo-600 text-white font-semibold"
                      : "bg-[#161c2e] border border-[#23293e] text-slate-400 hover:text-white"
                  }`}
                >
                  Original HD
                </button>
                <button
                  onClick={() => onQualityChange("data-saver")}
                  className={`px-3 py-1.5 rounded-lg font-sans text-xs transition-colors ${
                    quality === "data-saver"
                      ? "bg-indigo-600 text-white font-semibold"
                      : "bg-[#161c2e] border border-[#23293e] text-slate-400 hover:text-white"
                  }`}
                >
                  Data Saver (WebP)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Floating Control Bar */}
      <div
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 w-[94%] max-w-2xl ${
          hudVisible
            ? "translate-y-0 opacity-100"
            : "translate-y-16 opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-[#121622]/95 backdrop-blur-xl border border-[#23293e] shadow-2xl rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Chapter Prev Nav */}
          <div className="flex items-center gap-1.5">
            {prevChapterId ? (
              <Link
                href={`/read/${prevChapterId}`}
                className="p-1.5 rounded-lg bg-[#0b0e14] hover:bg-indigo-600 text-slate-300 hover:text-white transition-all"
                title="Previous Chapter"
              >
                <ChevronLeft className="w-4 h-4" />
              </Link>
            ) : (
              <span className="p-1.5 opacity-30 cursor-not-allowed text-slate-500">
                <ChevronLeft className="w-4 h-4" />
              </span>
            )}
            <span className="font-sans text-[11px] text-slate-400 font-medium hidden sm:inline">
              Prev
            </span>
          </div>

          {/* Page Scrubber */}
          <div className="flex-1 flex items-center gap-3 justify-center">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-mono text-xs text-indigo-400 font-semibold whitespace-nowrap">
              Page {currentPage} / {totalPages || 1}
            </span>

            {/* Slider Scrubber */}
            {totalPages > 1 && (
              <input
                type="range"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={(e) => onPageChange(parseInt(e.target.value, 10))}
                className="w-24 sm:w-44 accent-indigo-500 cursor-pointer h-1.5 bg-[#0b0e14] rounded-lg"
              />
            )}

            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Next Chapter Nav */}
          <div className="flex items-center gap-1.5">
            <span className="font-sans text-[11px] text-slate-400 font-medium hidden sm:inline">
              Next
            </span>
            {nextChapterId ? (
              <Link
                href={`/read/${nextChapterId}`}
                className="p-1.5 rounded-lg bg-[#0b0e14] hover:bg-indigo-600 text-slate-300 hover:text-white transition-all"
                title="Next Chapter"
              >
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <span className="p-1.5 opacity-30 cursor-not-allowed text-slate-500">
                <ChevronRight className="w-4 h-4" />
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Floating Toggle Button (when HUD is hidden) */}
      {!hudVisible && (
        <button
          onClick={onToggleHud}
          className="fixed bottom-4 right-4 z-40 p-3 rounded-full bg-[#121622]/90 backdrop-blur-md border border-indigo-500/50 text-indigo-400 shadow-xl hover:scale-110 transition-transform"
          title="Open Controls (M)"
        >
          <Layers className="w-5 h-5" />
        </button>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div
          onClick={() => setShowShortcuts(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#121622] border border-[#23293e] shadow-2xl rounded-2xl p-6 max-w-md w-full space-y-4 text-slate-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#23293e]">
              <h3 className="font-sans text-base text-white font-bold">
                Keyboard Shortcuts
              </h3>
              <button
                onClick={() => setShowShortcuts(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2.5 font-sans text-xs">
              <div className="flex justify-between py-1.5 border-b border-[#1e2538]">
                <span className="text-slate-400">Previous Page</span>
                <span className="px-2 py-0.5 bg-[#0b0e14] border border-[#23293e] text-indigo-400 rounded-md font-mono">
                  ← / A
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1e2538]">
                <span className="text-slate-400">Next Page</span>
                <span className="px-2 py-0.5 bg-[#0b0e14] border border-[#23293e] text-indigo-400 rounded-md font-mono">
                  → / D / Space
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1e2538]">
                <span className="text-slate-400">Toggle Header & Footer</span>
                <span className="px-2 py-0.5 bg-[#0b0e14] border border-[#23293e] text-indigo-400 rounded-md font-mono">
                  M
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Toggle Fullscreen</span>
                <span className="px-2 py-0.5 bg-[#0b0e14] border border-[#23293e] text-indigo-400 rounded-md font-mono">
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
