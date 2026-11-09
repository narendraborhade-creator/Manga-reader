"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getBookmarks, getReadingProgress, Bookmark, ReadingProgress, toggleBookmark } from "@/lib/bookmarks";
import { MangaCard } from "@/components/hud/MangaCard";
import { Bookmark as BookmarkIcon, Clock, BookOpen, Trash2, ArrowRight, Compass } from "lucide-react";

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [progressList, setProgressList] = useState<ReadingProgress[]>([]);

  useEffect(() => {
    setBookmarks(getBookmarks());
    const progressMap = getReadingProgress();
    setProgressList(
      Object.values(progressMap).sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
    );
  }, []);

  const handleRemoveBookmark = (b: Bookmark) => {
    toggleBookmark(b);
    setBookmarks(getBookmarks());
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Header */}
      <div className="space-y-2 pb-4 border-b border-[#20273a]">
        <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs uppercase tracking-wider font-semibold">
          <BookmarkIcon className="w-4 h-4" />
          Mangayomi Personal Library
        </div>
        <h1 className="font-sans text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          Library & Reading History
        </h1>
        <p className="font-sans text-sm text-slate-400 max-w-xl">
          Quickly resume your in-progress chapters and manage your personal saved collection.
        </p>
      </div>

      {/* 1. Continue Reading Shelf */}
      {progressList.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#20273a]">
            <span className="p-1.5 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
              <Clock className="w-4 h-4" />
            </span>
            <h2 className="font-sans text-lg font-bold text-white">
              Continue Reading
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {progressList.map((prog) => {
              const percent = Math.min(
                100,
                Math.round((prog.page / (prog.totalPages || 1)) * 100)
              );
              return (
                <div
                  key={prog.chapterId}
                  className="p-4 rounded-xl bg-[#121622] border border-[#23293e] hover:border-indigo-500/40 transition-all flex items-center justify-between gap-4 shadow-md group"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-indigo-600/20 text-indigo-300">
                      Page {prog.page} / {prog.totalPages} ({percent}%)
                    </span>
                    <h4 className="font-sans font-bold text-sm text-white truncate group-hover:text-indigo-400 transition-colors">
                      {prog.mangaTitle}
                    </h4>
                    <p className="font-sans text-xs text-slate-400 truncate">
                      {prog.chapterTitle}
                    </p>
                    <div className="w-full bg-[#0b0e14] rounded-full h-1.5 mt-2 overflow-hidden border border-[#23293e]">
                      <div
                        className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <Link
                    href={`/read/${prog.chapterId}`}
                    className="flex-shrink-0 p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all hover:scale-105"
                    title="Resume Chapter"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 2. Bookmarked Series Grid */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#20273a]">
          <span className="p-1.5 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
            <BookOpen className="w-4 h-4" />
          </span>
          <h2 className="font-sans text-lg font-bold text-white">
            Bookmarked Series ({bookmarks.length})
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
                  className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/80 hover:bg-rose-600 text-slate-400 hover:text-white transition-colors z-30"
                  title="Remove from Bookmarks"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-[#121622] rounded-2xl border border-[#23293e] space-y-3 p-8">
            <BookmarkIcon className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="font-sans text-lg text-white font-bold">
              Your Library is Empty
            </h3>
            <p className="font-sans text-xs text-slate-400 max-w-sm mx-auto">
              You haven&apos;t bookmarked any manga series yet. Click the bookmark ribbon on any title to save it to your library.
            </p>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 mt-3 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-sans font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all hover:scale-105"
            >
              <Compass className="w-4 h-4" />
              Discover Manga
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
