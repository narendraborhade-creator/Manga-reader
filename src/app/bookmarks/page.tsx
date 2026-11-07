"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getBookmarks, getReadingProgress, Bookmark, ReadingProgress, toggleBookmark } from "@/lib/bookmarks";
import { MangaCard } from "@/components/hud/MangaCard";
import { YantraCard } from "@/components/hud/YantraCard";
import { Bookmark as BookmarkIcon, Clock, BookOpen, Trash2, ArrowRight } from "lucide-react";

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [progressList, setProgressList] = useState<ReadingProgress[]>([]);

  useEffect(() => {
    setBookmarks(getBookmarks());
    const progressMap = getReadingProgress();
    setProgressList(Object.values(progressMap).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
  }, []);

  const handleRemoveBookmark = (b: Bookmark) => {
    toggleBookmark(b);
    setBookmarks(getBookmarks());
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Header */}
      <div className="space-y-2 pb-4 border-b border-sanctum-border">
        <div className="flex items-center gap-2 text-gada-bright font-mono text-xs uppercase tracking-widest">
          <BookmarkIcon className="w-4 h-4 text-gada" />
          SANCTUM ARCHIVE // PERSONAL READING LEDGER
        </div>
        <h1 className="font-mythic text-2xl sm:text-4xl font-bold text-ashram">
          Saved Scrolls & Reading Progress
        </h1>
        <p className="font-hud text-sm text-ashram-muted max-w-xl">
          Track your active chapter progression and access your bookmarked series locally
          across sessions.
        </p>
      </div>

      {/* 1. Continue Reading Shelf */}
      {progressList.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-sanctum-border">
            <span className="p-1 rounded bg-prana/20 text-prana border border-prana/40">
              <Clock className="w-3.5 h-3.5" />
            </span>
            <h2 className="font-hud uppercase text-lg font-bold text-ashram tracking-wider">
              CONTINUE READING
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {progressList.map((prog) => (
              <YantraCard
                key={prog.chapterId}
                glowColor="prana"
                className="p-4 bg-sanctum/90 hover:border-prana/50 transition-all flex items-center justify-between gap-4"
              >
                <div className="space-y-1 min-w-0">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-prana/20 text-prana">
                    PAGE {prog.page} OF {prog.totalPages}
                  </span>
                  <h4 className="font-hud font-bold text-base text-ashram truncate">
                    {prog.mangaTitle}
                  </h4>
                  <p className="font-mono text-xs text-gada">
                    {prog.chapterTitle}
                  </p>
                  <div className="w-full bg-void rounded-full h-1.5 mt-2 overflow-hidden border border-sanctum-border">
                    <div
                      className="bg-prana h-full rounded-full transition-all"
                      style={{
                        width: `${Math.round((prog.page / prog.totalPages) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <Link
                  href={`/read/${prog.chapterId}`}
                  className="flex-shrink-0 p-3 rounded-full bg-sindoor hover:bg-sindoor-glow text-white shadow-sindoor-neon transition-all hover:scale-105"
                  title="Resume Chapter"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </YantraCard>
            ))}
          </div>
        </section>
      )}

      {/* 2. Bookmarked Series Grid */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-sanctum-border">
          <span className="p-1 rounded bg-gada/20 text-gada-bright border border-gada/40">
            <BookOpen className="w-3.5 h-3.5" />
          </span>
          <h2 className="font-hud uppercase text-lg font-bold text-ashram tracking-wider">
            BOOKMARKED SERIES ({bookmarks.length})
          </h2>
        </div>

        {bookmarks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {bookmarks.map((b) => (
              <div key={b.mangaId} className="relative group">
                <MangaCard
                  id={b.mangaId}
                  title={b.title}
                  coverUrl={b.coverUrl}
                  status={b.status}
                  genres={b.genres}
                />
                <button
                  onClick={() => handleRemoveBookmark(b)}
                  className="absolute bottom-2 right-2 p-1.5 rounded bg-void/80 hover:bg-sindoor text-ashram-muted hover:text-white transition-colors z-30"
                  title="Remove from Bookmarks"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-sanctum/60 rounded border border-sanctum-border space-y-3">
            <BookmarkIcon className="w-10 h-10 text-gada mx-auto opacity-40" />
            <h3 className="font-hud uppercase text-lg text-ashram font-bold">
              Your Sanctum Codex is Empty
            </h3>
            <p className="font-mono text-xs text-ashram-muted max-w-sm mx-auto">
              You haven&apos;t bookmarked any manga series yet. Tap the bookmark icon on any
              series card to save it here.
            </p>
            <Link
              href="/explore"
              className="inline-block mt-2 px-5 py-2.5 rounded bg-gada text-void font-hud font-bold text-xs uppercase tracking-wider hover:bg-gada-bright transition-colors shadow-gada-gold"
            >
              Explore Manga Codex
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
