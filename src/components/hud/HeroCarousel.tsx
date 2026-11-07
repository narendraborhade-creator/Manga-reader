"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, Star, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
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
  const title = current.title.english || current.title.romaji || "Sacred Series";
  const banner =
    current.bannerImage ||
    current.coverImage?.extraLarge ||
    "/placeholder-manga.jpg";

  return (
    <div className="relative w-full h-[400px] md:h-[500px] lg:h-[540px] overflow-hidden rounded-sm border border-sanctum-border shadow-hud-glow bg-void">
      {/* Background Banner with Cyber Vignette */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={banner}
        alt={title}
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover object-center brightness-50 transition-all duration-700 scale-105"
      />

      {/* Atmospheric Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-void via-void/85 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-void via-transparent to-black/40" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Content HUD */}
      <div className="relative z-10 max-w-7xl mx-auto h-full flex flex-col justify-end p-6 md:p-12 pb-10">
        <div className="max-w-2xl space-y-4">
          {/* Status Ribbon & Sanskrit Shloka */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-mono font-bold tracking-widest uppercase bg-sindoor/90 text-white rounded-sm shadow-sindoor-neon flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              SUNDARA MATRIX // TRENDING
            </span>

            {current.averageScore && (
              <span className="px-2 py-1 text-xs font-mono font-bold bg-gada/20 text-gada-bright border border-gada/50 rounded-sm flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-current" />
                {current.averageScore}% APPROVAL
              </span>
            )}

            <span className="text-xs font-mono text-prana uppercase tracking-wider hidden sm:inline">
              OM HANUMATE // VAJRA STREAM
            </span>
          </div>

          {/* Main Title */}
          <h1 className="font-mythic text-2xl sm:text-4xl lg:text-5xl font-bold text-ashram leading-tight tracking-wide drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
            {title}
          </h1>

          {/* Genres */}
          {current.genres.length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs font-mono text-ashram-muted">
              {current.genres.slice(0, 4).map((g) => (
                <span
                  key={g}
                  className="px-2 py-0.5 rounded bg-sanctum border border-sanctum-border text-ashram"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Synopsis */}
          {current.description && (
            <p className="font-hud text-sm text-ashram-muted/90 line-clamp-2 md:line-clamp-3 leading-relaxed max-w-xl">
              {current.description.replace(/<[^>]*>?/gm, "")}
            </p>
          )}

          {/* CTA Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <Link
              href={`/explore?q=${encodeURIComponent(title)}`}
              className="flex items-center gap-2 px-6 py-2.5 rounded-sm bg-gradient-to-r from-sindoor to-sindoor-glow hover:from-sindoor-glow hover:to-sindoor text-white font-hud font-bold uppercase tracking-widest text-sm shadow-sindoor-neon transition-all hover:scale-105"
            >
              <BookOpen className="w-4 h-4" />
              INITIATE READ
            </Link>

            <Link
              href={`/explore?q=${encodeURIComponent(title)}`}
              className="px-4 py-2.5 rounded-sm bg-sanctum/90 hover:bg-sanctum border border-gada/40 text-gada-bright font-hud font-semibold uppercase tracking-wider text-sm transition-all"
            >
              VIEW CODEX
            </Link>
          </div>
        </div>
      </div>

      {/* Carousel Controls */}
      <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2">
        <button
          onClick={() =>
            setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)
          }
          className="p-2 rounded-sm bg-sanctum/80 border border-sanctum-border text-ashram hover:text-gada hover:border-gada transition-all"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="font-mono text-xs text-ashram-muted px-2">
          {currentIndex + 1} / {items.length}
        </span>

        <button
          onClick={() => setCurrentIndex((prev) => (prev + 1) % items.length)}
          className="p-2 rounded-sm bg-sanctum/80 border border-sanctum-border text-ashram hover:text-gada hover:border-gada transition-all"
          aria-label="Next Slide"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
