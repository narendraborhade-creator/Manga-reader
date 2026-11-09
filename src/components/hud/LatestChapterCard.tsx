"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";

interface LatestChapterCardProps {
  externalChapId: string;
  mangaExternalId: string;
  mangaTitle: string;
  coverUrl: string;
  chapterNumber: number | string;
  publishedAt?: string;
}

export const LatestChapterCard: React.FC<LatestChapterCardProps> = ({
  externalChapId,
  mangaExternalId,
  mangaTitle,
  coverUrl,
  chapterNumber,
}) => {
  const [useProxyFallback, setUseProxyFallback] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const directCanLoad =
    coverUrl &&
    (coverUrl.includes("uploads.mangadex.org") ||
      coverUrl.includes("anilist.co") ||
      coverUrl.includes("s4.anilist.co") ||
      coverUrl.includes("temp.compsci88.com"));

  const resolvedSrc = (() => {
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
    return `/api/proxy/image?url=${encodeURIComponent(coverUrl)}`;
  })();

  const handleImageError = () => {
    if (!useProxyFallback && directCanLoad) {
      setUseProxyFallback(true);
    } else {
      setImgFailed(true);
    }
  };

  const cleanNum = String(chapterNumber).replace(/^(ch\.|ch|chapter)\s*/i, "").trim();

  return (
    <div className="group flex flex-col h-full bg-[#121622] border border-[#23293e] hover:border-indigo-500/50 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10">
      {/* Cover Image */}
      <Link
        href={`/manga/${mangaExternalId}`}
        className="relative aspect-[3/4] w-full overflow-hidden bg-[#0d1017] block"
      >
        {resolvedSrc ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={resolvedSrc}
            alt={mangaTitle}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={handleImageError}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-[#161c2e] to-[#0d1017] border border-[#282f45]">
            <div className="w-9 h-9 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="font-sans text-xs font-semibold text-slate-200 line-clamp-2 px-1">
              {mangaTitle}
            </span>
          </div>
        )}

        <div className="absolute top-2.5 left-2.5 z-10">
          <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-indigo-600 text-white rounded-md shadow-sm">
            CH. {cleanNum}
          </span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#121622] via-transparent to-transparent opacity-80 pointer-events-none" />
      </Link>

      {/* Title & Actions */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
        <Link href={`/manga/${mangaExternalId}`}>
          <h3 className="font-sans font-semibold text-sm text-slate-100 group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
            {mangaTitle}
          </h3>
          <p className="font-sans text-[11px] text-slate-400 mt-1">
            English Chapter {cleanNum}
          </p>
        </Link>

        <div className="flex items-center justify-between pt-2 border-t border-[#20273a] text-xs font-sans">
          <Link
            href={`/read/${externalChapId}`}
            className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
          >
            Read Chapter →
          </Link>
          <span className="text-emerald-400 text-[10px] uppercase font-mono font-bold">
            NEW
          </span>
        </div>
      </div>
    </div>
  );
};
