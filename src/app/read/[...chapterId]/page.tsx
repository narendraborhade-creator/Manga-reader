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
import { CheckCircle, ArrowRight, RotateCcw, AlertTriangle, Compass, Home, BookOpen } from "lucide-react";

function extractMangaId(chapId: string, pageData?: any): string {
  if (pageData?.mangaId) return pageData.mangaId;
  if (chapId.startsWith("allmanga-")) {
    return `allmanga-${chapId.replace(/^allmanga-/, "").split("-")[0]}`;
  }
  if (chapId.startsWith("asura-")) {
    return `asura-${chapId.replace(/^asura-/, "").split("/")[0]}`;
  }
  if (chapId.startsWith("mangapill-")) {
    const match = chapId.match(/^mangapill-(\d+)(?:-\d+)?\/(.*)$/);
    if (match) return `mangapill-${match[1]}/${match[2]}`;
    return `mangapill-${chapId.replace(/^mangapill-/, "").split("-")[0]}`;
  }
  return chapId;
}

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
          // Persist progress
          const realMangaId = extractMangaId(chapId, data);
          saveReadingProgress({
            mangaId: realMangaId,
            mangaTitle: (data as any)?.mangaTitle || "Manga Chapter",
            coverUrl: data.directPages[0] || "",
            chapterId: chapId,
            chapterNumber: (data as any)?.chapterNumber || 1,
            chapterTitle: (data as any)?.chapterTitle || `Chapter Stream`,
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
        const realMangaId = extractMangaId(chapterId, pageData);
        saveReadingProgress({
          mangaId: realMangaId,
          mangaTitle: (pageData as any)?.mangaTitle || "Manga Chapter",
          coverUrl: pageData.directPages[0] || "",
          chapterId: chapterId,
          chapterNumber: (pageData as any)?.chapterNumber || 1,
          chapterTitle: (pageData as any)?.chapterTitle || `Chapter Stream`,
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
      <div className="fixed inset-0 z-50 bg-[#0B0E14] flex items-center justify-center p-4">
        <CyberGadaLoader
          size="lg"
          text="Loading chapter pages..."
          subtext="Connecting to high-speed CDN stream"
        />
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-8 bg-[#121622] border border-[#23293e] rounded-2xl max-w-lg mx-auto my-12 shadow-2xl">
        <AlertTriangle className="w-12 h-12 text-amber-400 mb-4 animate-pulse" />
        <h2 className="font-sans text-xl text-white font-bold tracking-tight mb-2">
          Unable to Load Chapter
        </h2>
        <p className="font-sans text-xs text-slate-400 mb-6 leading-relaxed">
          {error || "Unable to retrieve image pages for this chapter stream."}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href={`/manga/${extractMangaId(chapterId, pageData)}`}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-sans font-semibold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/20"
          >
            <BookOpen className="w-4 h-4" />
            Series Details
          </Link>
          <button
            onClick={() => loadChapter(chapterId, quality)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#182032] hover:bg-[#202b44] text-slate-200 border border-[#2b3550] font-sans font-medium text-xs rounded-xl transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Retry Stream
          </button>
          <Link
            href="/explore"
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0b0e14] border border-[#23293e] hover:border-slate-600 text-slate-300 font-sans font-medium text-xs rounded-xl transition-colors"
          >
            <Compass className="w-4 h-4" />
            Browse Catalog
          </Link>
        </div>
      </div>
    );
  }

  const totalPages = pageData.proxiedPages.length;

  return (
    <div className="relative min-h-screen bg-[#0B0E14] text-slate-100 flex flex-col items-center select-none">
      {/* Floating Reader Controls */}
      <ReaderControls
        mangaId={extractMangaId(chapterId, pageData)}
        mangaTitle={(pageData as any)?.mangaTitle || "Mangayomi Reader"}
        chapterTitle={(pageData as any)?.chapterTitle || `Chapter Stream (${totalPages} Pages)`}
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
        <div className="w-full max-w-2xl mx-auto my-16 p-8 rounded-2xl bg-[#121622] border border-[#23293e] text-center space-y-4 shadow-xl">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="font-sans text-xl font-bold text-white">
            Chapter Complete!
          </h3>
          <p className="font-sans text-xs text-slate-400">
            You finished reading all {totalPages} pages of {(pageData as any)?.chapterTitle || "this chapter"}.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              href={`/manga/${extractMangaId(chapterId, pageData)}`}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-sans font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all hover:scale-105"
            >
              Return to Chapter List
            </Link>
            <Link
              href="/explore"
              className="px-5 py-2.5 rounded-xl bg-[#0b0e14] border border-[#23293e] hover:border-slate-600 text-slate-300 font-sans font-medium text-xs transition-colors"
            >
              Explore More Manga
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
