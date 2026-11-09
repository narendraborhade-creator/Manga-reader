"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, Star, Sparkles, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { AniListMedia } from "@/lib/adapters/anilist";

interface HeroCarouselProps {
  items: AniListMedia[];
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ items }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!items.length) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [items.length]);

  if (!items.length) return null;

  const current = items[currentIndex];
  const title = current.title.english || current.title.romaji || "Featured Series";
  const banner =
    current.bannerImage ||
    current.coverImage?.extraLarge ||
    "/placeholder-manga.jpg";

  return (
    <div className="relative w-full h-[380px] md:h-[460px] lg:h-[500px] overflow-hidden rounded-2xl border border-[#23293e] shadow-2xl bg-[#0b0e14] group">
      {/* Background Banner */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={banner.startsWith("http") ? `/api/proxy/image?url=${encodeURIComponent(banner)}` : banner}
        alt={title}
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover object-center brightness-[0.45] transition-all duration-700 group-hover:scale-105"
      />

      {/* Atmospheric Vignette Gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0b0e14] via-[#0b0e14]/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e14] via-transparent to-black/40" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto h-full flex flex-col justify-end p-6 md:p-12 pb-10">
        <div className="max-w-2xl space-y-4">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 text-xs font-mono font-semibold tracking-wider uppercase bg-indigo-600/90 text-white rounded-full flex items-center gap-1.5 shadow-md shadow-indigo-600/20">
              <Sparkles className="w-3.5 h-3.5" />
              Featured Spotlight
            </span>

            {current.averageScore && (
              <span className="px-3 py-1 text-xs font-mono font-semibold bg-black/60 backdrop-blur-md text-amber-300 border border-amber-400/30 rounded-full flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-current" />
                {current.averageScore}%
              </span>
            )}

            {current.status && (
              <span className="px-3 py-1 text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full uppercase">
                {current.status}
              </span>
            )}
          </div>

          {/* Main Title */}
          <h1 className="font-sans text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight drop-shadow-md">
            {title}
          </h1>

          {/* Genres */}
          {current.genres.length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs font-sans text-slate-300">
              {current.genres.slice(0, 4).map((g) => (
                <span
                  key={g}
                  className="px-2.5 py-1 rounded-md bg-[#182032]/80 backdrop-blur-md border border-[#2b3550] text-slate-200"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Synopsis */}
          {current.description && (
            <p className="font-sans text-sm text-slate-300/90 line-clamp-2 md:line-clamp-3 leading-relaxed max-w-xl">
              {current.description.replace(/<[^>]*>?/gm, "")}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <Link
              href={`/explore?q=${encodeURIComponent(title)}`}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-sans font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
            >
              <BookOpen className="w-4 h-4" />
              Read Series
            </Link>

            <Link
              href={`/explore?q=${encodeURIComponent(title)}`}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#182032]/80 hover:bg-[#202b44] text-slate-200 border border-[#2b3550] font-sans font-medium text-sm transition-colors"
            >
              <Info className="w-4 h-4" />
              Details
            </Link>
          </div>
        </div>

        {/* Carousel Slide Indicators & Controls */}
        <div className="absolute bottom-6 right-6 flex items-center gap-2 z-20">
          <button
            onClick={() => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)}
            aria-label="Previous Slide"
            className="p-2 rounded-lg bg-black/60 hover:bg-black/90 text-slate-300 hover:text-white border border-[#23293e] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 px-2">
            {items.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? "w-6 bg-indigo-500"
                    : "w-2 bg-slate-600 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % items.length)}
            aria-label="Next Slide"
            className="p-2 rounded-lg bg-black/60 hover:bg-black/90 text-slate-300 hover:text-white border border-[#23293e] transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
