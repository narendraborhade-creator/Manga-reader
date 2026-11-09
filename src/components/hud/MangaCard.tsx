"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Star, BookOpen, Bookmark as BookmarkIcon } from "lucide-react";
import { YantraCard } from "./YantraCard";
import { toggleBookmark, isBookmarked } from "@/lib/bookmarks";

interface MangaCardProps {
  id: string;
  title: string;
  coverUrl: string;
  status?: string;
  score?: number | null;
  genres?: string[];
  latestChapter?: number | string;
  source?: string;
}

export const MangaCard: React.FC<MangaCardProps> = ({
  id,
  title,
  coverUrl,
  status = "ONGOING",
  score,
  genres = [],
  latestChapter,
  source,
}) => {
  const [bookmarked, setBookmarked] = useState<boolean>(() => isBookmarked(id));
  const [useProxyFallback, setUseProxyFallback] = useState<boolean>(false);
  const [imgFailed, setImgFailed] = useState<boolean>(false);

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = toggleBookmark({
      mangaId: id,
      title,
      coverUrl,
      status,
      genres,
      addedAt: new Date().toISOString(),
    });
    setBookmarked(updated);
  };

  const directCanLoad =
    coverUrl &&
    (coverUrl.includes("uploads.mangadex.org") ||
      coverUrl.includes("anilist.co") ||
      coverUrl.includes("s4.anilist.co") ||
      coverUrl.includes("temp.compsci88.com"));

  const resolvedCoverSrc = (() => {
    if (imgFailed) return null;
    if (!coverUrl || coverUrl === "/placeholder-manga.jpg" || coverUrl === "/placeholder-manga.png") {
      return null;
    }

    if (useProxyFallback) {
      return `/api/proxy/image?url=${encodeURIComponent(coverUrl)}`;
    }

    if (directCanLoad) {
      return coverUrl;
    }

    // Default route through proxy for protected domains
    if (coverUrl.startsWith("http")) {
      return `/api/proxy/image?url=${encodeURIComponent(coverUrl)}`;
    }

    return coverUrl;
  })();

  const handleImageError = () => {
    if (!useProxyFallback && directCanLoad) {
      setUseProxyFallback(true);
    } else {
      setImgFailed(true);
    }
  };

  const targetHref = `/manga/${id}`;
  const cleanChapterNumber = latestChapter !== undefined
    ? String(latestChapter).replace(/^(ch\.|ch|chapter)\s*/i, "").trim()
    : "";

  return (
    <Link href={targetHref} className="group block focus:outline-none">
      <YantraCard className="h-full flex flex-col bg-[#121622] border border-[#23293e] hover:border-indigo-500/50 transition-all duration-300">
        {/* Cover Art Container */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#0e121a] flex items-center justify-center">
          {resolvedCoverSrc ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={resolvedCoverSrc}
              alt={title}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={handleImageError}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            /* Sleek Modern Gradient Cover Fallback */
            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-[#161c2e] to-[#0d1017] border border-[#282f45]">
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
              </div>
              <span className="font-sans text-xs font-semibold text-slate-200 line-clamp-2 px-1">
                {title}
              </span>
              <span className="font-mono text-[9px] text-indigo-400/80 mt-2 tracking-wider uppercase">
                {source || "MANGAYOMI"}
              </span>
            </div>
          )}

          {/* Subtle Vignette Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#121622] via-transparent to-black/40 pointer-events-none" />

          {/* Top Badges */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
            {status && (
              <span className="px-2 py-0.5 text-[10px] font-mono uppercase font-semibold tracking-wider bg-black/70 backdrop-blur-md text-emerald-400 border border-emerald-500/30 rounded-md">
                {status}
              </span>
            )}
            {score && (
              <span className="flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-semibold bg-black/70 backdrop-blur-md text-amber-300 border border-amber-500/30 rounded-md">
                <Star className="w-2.5 h-2.5 fill-current" />
                {score}%
              </span>
            )}
          </div>

          {/* 1-Click Bookmark Button */}
          <button
            onClick={handleBookmarkClick}
            aria-label="Bookmark Manga"
            className={`absolute top-2.5 right-2.5 p-1.5 rounded-md backdrop-blur-md transition-all z-20 ${
              bookmarked
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-black/60 text-slate-400 hover:text-white hover:bg-black/90"
            }`}
          >
            <BookmarkIcon className={`w-3.5 h-3.5 ${bookmarked ? "fill-current" : ""}`} />
          </button>

          {/* Latest Chapter Pill */}
          {cleanChapterNumber && (
            <div className="absolute bottom-2.5 left-2.5 z-10">
              <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono bg-indigo-600/90 backdrop-blur-md text-white font-medium rounded-md shadow-sm">
                <BookOpen className="w-2.5 h-2.5" />
                CH. {cleanChapterNumber}
              </span>
            </div>
          )}
        </div>

        {/* Details Section */}
        <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
          <div>
            <h3
              title={title}
              className="font-sans font-semibold text-sm text-slate-100 group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug"
            >
              {title}
            </h3>
            {genres.length > 0 && (
              <p className="font-sans text-[11px] text-slate-400 line-clamp-1 mt-1">
                {genres.slice(0, 3).join(" • ")}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#20273a] text-[11px] font-sans text-slate-400">
            <span className="group-hover:text-indigo-400 transition-colors flex items-center gap-1 font-medium text-indigo-400">
              Read Now →
            </span>
            <span className="text-slate-500 text-[10px] uppercase font-mono">
              {status === "COMPLETED" ? "Complete" : "Ongoing"}
            </span>
          </div>
        </div>
      </YantraCard>
    </Link>
  );
};
