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
}

export const MangaCard: React.FC<MangaCardProps> = ({
  id,
  title,
  coverUrl,
  status = "ONGOING",
  score,
  genres = [],
  latestChapter,
}) => {
  const [bookmarked, setBookmarked] = useState<boolean>(() => isBookmarked(id));
  const [imgError, setImgError] = useState(false);

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

  return (
    <Link href={`/manga/${id}`} className="group block focus:outline-none">
      <YantraCard
        glowColor="gada"
        className="h-full flex flex-col bg-sanctum/90 hover:border-gada/50 transition-all duration-300"
      >
        {/* Cover Art Wrapper */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-void/80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgError ? "/placeholder-manga.jpg" : coverUrl}
            alt={title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-sanctum via-transparent to-black/30 pointer-events-none" />

          {/* Top Badges */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
            {status && (
              <span className="px-1.5 py-0.5 text-[9px] font-mono uppercase font-bold tracking-widest bg-void/80 text-prana border border-prana/40 rounded-sm">
                {status}
              </span>
            )}
            {score && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-mono font-bold bg-void/80 text-gada-bright border border-gada/40 rounded-sm">
                <Star className="w-2.5 h-2.5 fill-current" />
                {score}%
              </span>
            )}
          </div>

          {/* Bookmark Button */}
          <button
            onClick={handleBookmarkClick}
            aria-label="Bookmark Manga"
            className={`absolute top-2 right-2 p-1.5 rounded-sm transition-all z-20 ${
              bookmarked
                ? "bg-sindoor text-white shadow-sindoor-neon"
                : "bg-void/70 text-ashram-muted hover:text-gada hover:bg-void"
            }`}
          >
            <BookmarkIcon className={`w-3.5 h-3.5 ${bookmarked ? "fill-current" : ""}`} />
          </button>

          {/* Latest Chapter Pill (if present) */}
          {latestChapter !== undefined && (
            <div className="absolute bottom-2 left-2 z-10">
              <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono bg-sindoor/90 text-white font-semibold rounded-sm shadow-sindoor-neon">
                <BookOpen className="w-2.5 h-2.5" />
                CH. {latestChapter}
              </span>
            </div>
          )}
        </div>

        {/* Info Content */}
        <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
          <div>
            <h3
              title={title}
              className="font-hud font-bold text-sm text-ashram group-hover:text-gada-bright transition-colors line-clamp-2 leading-snug tracking-wide"
            >
              {title}
            </h3>
            {genres.length > 0 && (
              <p className="font-mono text-[10px] text-ashram-muted/70 line-clamp-1 mt-1">
                {genres.slice(0, 3).join(" • ")}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-sanctum-border/60 text-[10px] font-mono text-ashram-muted">
            <span className="group-hover:text-gada transition-colors flex items-center gap-1">
              READ NOW →
            </span>
            <span className="text-prana">MANGADEX</span>
          </div>
        </div>
      </YantraCard>
    </Link>
  );
};
