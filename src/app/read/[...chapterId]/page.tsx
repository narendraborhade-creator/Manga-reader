"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { getChapterPages } from "@/lib/api-client";
import { ChapterPagesResult } from "@/lib/adapters/mangadex";
import { ReaderControls, ReadingMode } from "@/components/reader/ReaderControls";
import { LongStripViewer } from "@/components/reader/LongStripViewer";
import { PagedViewer } from "@/components/reader/PagedViewer";
import { CyberGadaLoader } from "@/components/hud/CyberGadaLoader";
import { saveReadingProgress } from "@/lib/bookmarks";
import { CheckCircle, ArrowRight, RotateCcw, AlertTriangle } from "lucide-react";

export default function ReaderPage({
  params,
}: {
  params: Promise<{ chapterId: string | string[] }>;
}) {
  const resolvedParams = use(params);
  const chapterId = Array.isArray(resolvedParams.chapterId)
    ? resolvedParams.chapterId.map(decodeURIComponent).join("/")
    : decodeURIComponent(resolvedParams.chapterId || "");

  const [pageData, setPageData] = useState<ChapterPagesResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Reader configuration state
  const [readingMode, setReadingMode] = useState<ReadingMode>("webtoon");
  const [quality, setQuality] = useState<"data" | "data-saver">("data");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hudVisible, setHudVisible] = useState<boolean>(true);

  // Fetch Chapter Pages
  const loadChapter = useCallback(
    async (chapId: string, q: "data" | "data-saver") => {
      setLoading(true);
      setError(null);
      try {
        const data = await getChapterPages(chapId, q);
        if (data && data.proxiedPages?.length > 0) {
          setPageData(data);
          setCurrentPage(1);
          // Persist initial progress
          saveReadingProgress({
            mangaId: chapId,
            mangaTitle: "Manga Chapter",
            coverUrl: data.directPages[0] || "",
            chapterId: chapId,
            chapterNumber: 1,
            chapterTitle: `Chapter Stream`,
            page: 1,
            totalPages: data.proxiedPages.length,
            updatedAt: new Date().toISOString(),
          });
        } else {
          setError("No readable pages found for this chapter.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to resolve chapter stream.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadChapter(chapterId, quality);
  }, [chapterId, quality, loadChapter]);

  // Page tracking & progress persistence
  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      if (pageData) {
        saveReadingProgress({
          mangaId: chapterId,
          mangaTitle: "Manga Chapter",
          coverUrl: pageData.directPages[0] || "",
          chapterId: chapterId,
          chapterNumber: 1,
          chapterTitle: `Chapter Stream`,
          page,
          totalPages: pageData.proxiedPages.length,
          updatedAt: new Date().toISOString(),
        });
      }

      // Scroll into view if in long-strip mode
      if (readingMode === "webtoon") {
        const el = document.getElementById(`page-${page}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }
    },
    [chapterId, pageData, readingMode]
  );

  // Keyboard shortcut listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        if (readingMode === "rtl") {
          handlePageChange(Math.max(1, currentPage - 1));
        } else {
          if (pageData && currentPage < pageData.proxiedPages.length) {
            handlePageChange(currentPage + 1);
          }
        }
      } else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        if (readingMode === "rtl") {
          if (pageData && currentPage < pageData.proxiedPages.length) {
            handlePageChange(currentPage + 1);
          }
        } else {
          handlePageChange(Math.max(1, currentPage - 1));
        }
      } else if (e.key === " " && readingMode !== "webtoon") {
        e.preventDefault();
        if (pageData && currentPage < pageData.proxiedPages.length) {
          handlePageChange(currentPage + 1);
        }
      } else if (e.key === "m" || e.key === "M") {
        setHudVisible((prev) => !prev);
      } else if (e.key === "f" || e.key === "F") {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, readingMode, pageData, handlePageChange]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-void flex items-center justify-center p-4">
        <CyberGadaLoader
          size="lg"
          text="ॐ LOADING CHAPTER STREAM..."
          subtext="RETRIEVING HIGH DEFINITION MANGA PAGES"
        />
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 bg-sanctum border border-sindoor/40 rounded max-w-lg mx-auto my-12">
        <AlertTriangle className="w-12 h-12 text-sindoor mb-4 animate-pulse" />
        <h2 className="font-hud uppercase text-xl text-ashram font-bold tracking-wider mb-2">
          SACRED TRANSMISSION INTERRUPTED
        </h2>
        <p className="font-mono text-xs text-ashram-muted mb-6">
          {error || "Unable to retrieve pages for this chapter stream."}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => loadChapter(chapterId, quality)}
            className="flex items-center gap-2 px-5 py-2.5 bg-sindoor hover:bg-sindoor-glow text-white font-hud font-bold uppercase text-xs rounded transition-all shadow-sindoor-neon"
          >
            <RotateCcw className="w-4 h-4" />
            RETRY STREAM
          </button>
          <Link
            href="/explore"
            className="px-5 py-2.5 bg-gada text-void font-hud font-bold uppercase text-xs rounded hover:bg-gada-bright transition-all shadow-gada-gold"
          >
            EXPLORE ALL MANGA
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 bg-void border border-sanctum-border text-ashram font-hud font-bold uppercase text-xs rounded hover:border-gada transition-colors"
          >
            HOME DECK
          </Link>
        </div>
      </div>
    );
  }

  const totalPages = pageData.proxiedPages.length;

  return (
    <div className="relative min-h-screen bg-void text-ashram flex flex-col items-center select-none">
      {/* Dynamic Floating HUD Controls */}
      <ReaderControls
        mangaId={chapterId}
        mangaTitle="Vajra Reader"
        chapterTitle={`Chapter Stream (${totalPages} Pages)`}
        currentPage={currentPage}
        totalPages={totalPages}
        readingMode={readingMode}
        quality={quality}
        hudVisible={hudVisible}
        onPageChange={handlePageChange}
        onModeChange={(m) => setReadingMode(m)}
        onQualityChange={(q) => setQuality(q)}
        onToggleHud={() => setHudVisible(!hudVisible)}
      />

      {/* Reader Page Canvas */}
      <main className="w-full flex-1 flex flex-col items-center pt-16">
        {readingMode === "webtoon" ? (
          <LongStripViewer
            proxiedPages={pageData.proxiedPages}
            directPages={pageData.directPages}
            currentPage={currentPage}
            onPageVisible={(p) => setCurrentPage(p)}
          />
        ) : (
          <PagedViewer
            proxiedPages={pageData.proxiedPages}
            directPages={pageData.directPages}
            currentPage={currentPage}
            readingMode={readingMode}
            onPageChange={handlePageChange}
          />
        )}

        {/* End of Chapter Card */}
        <div className="w-full max-w-2xl mx-auto my-12 p-8 bg-sanctum/90 border border-gada/50 shadow-gada-gold rounded-sm text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-gada-bright font-mono text-xs uppercase tracking-widest">
            <CheckCircle className="w-5 h-5 text-gada" />
            CHAPTER STREAM COMPLETED // VAJRA BLESSINGS
          </div>
          <h3 className="font-mythic text-2xl font-bold text-ashram">
            You Have Reached The End Of This Chapter
          </h3>
          <p className="font-hud text-sm text-ashram-muted max-w-md mx-auto">
            Reading progress has been synchronized to your local sanctum codex.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/"
              className="px-6 py-2.5 rounded-sm bg-void border border-sanctum-border text-ashram font-hud font-bold uppercase tracking-wider text-xs hover:border-gada transition-all"
            >
              Command Deck
            </Link>
            <button
              onClick={() => handlePageChange(1)}
              className="px-6 py-2.5 rounded-sm bg-gada text-void font-hud font-bold uppercase tracking-wider text-xs hover:bg-gada-bright transition-all shadow-gada-gold"
            >
              Re-read From Page 1
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
