import React from "react";
import Link from "next/link";
import { fetchMangaDexLatestChapters, searchMangaDex } from "@/lib/adapters/mangadex";
import { fetchAniListTrending, fetchAniListPopular } from "@/lib/adapters/anilist";
import { searchAllManga } from "@/lib/adapters/allmanga";
import { HeroCarousel } from "@/components/hud/HeroCarousel";
import { YantraCard } from "@/components/hud/YantraCard";
import { MultiSourceRecommendations } from "@/components/hud/MultiSourceRecommendations";
import { Sparkles, Clock, Compass, BookOpen, ChevronRight } from "lucide-react";

export const revalidate = 120; // Revalidate every 2 minutes for real-time chapter freshness

export default async function HomePage() {
  // Concurrently fetch Trending, Latest, and Multi-Source Recommendations
  const [
    trendingMedia,
    latestChapters,
    mangaDexPopular,
    allMangaPopular,
    aniListPopular,
  ] = await Promise.all([
    fetchAniListTrending(8).catch(() => []),
    fetchMangaDexLatestChapters(24, "en").catch(() => []),
    searchMangaDex("", 12).catch(() => []),
    searchAllManga("Piece", 12).catch(() => []),
    fetchAniListPopular(12).catch(() => []),
  ]);

  const dexFormatted = mangaDexPopular.map((m) => ({
    id: m.id,
    title: m.title,
    coverUrl: m.coverUrl,
    status: m.status,
    genres: m.tags,
    source: "MANGADEX",
  }));

  const allFormatted = allMangaPopular.map((m) => ({
    id: m.id,
    title: m.title,
    coverUrl: m.coverUrl,
    status: m.status || "RELEASING",
    genres: m.genres,
    source: "ALLMANGA",
  }));

  const aniFormatted = aniListPopular.map((m) => ({
    id: `explore?q=${encodeURIComponent(m.title.english || m.title.romaji)}`,
    title: m.title.english || m.title.romaji || "Sacred Series",
    coverUrl: m.coverImage?.extraLarge || m.coverImage?.large || "/placeholder-manga.jpg",
    status: m.status || "RELEASING",
    score: m.averageScore,
    genres: m.genres,
    source: "ANILIST",
  }));

  // Curated blend for default tab
  const combinedCurated = [
    ...dexFormatted.slice(0, 4),
    ...allFormatted.slice(0, 4),
    ...aniFormatted.slice(0, 4),
  ];

  return (
    <div className="space-y-12 pb-16">
      {/* 1. Hero Carousel ("Sundara Matrix") */}
      {trendingMedia.length > 0 && <HeroCarousel items={trendingMedia} />}

      {/* 2. Real-Time Latest Releases Feed */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-sanctum-border">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded bg-sindoor/20 text-sindoor border border-sindoor/40 shadow-sindoor-neon">
              <Clock className="w-4 h-4" />
            </span>
            <h2 className="font-hud uppercase text-lg sm:text-xl font-bold text-ashram tracking-wider">
              REAL-TIME LATEST CHAPTERS
            </h2>
            <span className="font-mono text-[10px] text-prana px-2 py-0.5 rounded bg-prana/10 border border-prana/30">
              LIVE STREAM
            </span>
          </div>

          <Link
            href="/explore"
            className="flex items-center gap-1 font-hud text-xs font-semibold uppercase text-gada hover:text-gada-bright tracking-wider"
          >
            EXPLORE ALL <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Latest Chapters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {latestChapters.map((ch) => (
            <Link
              key={ch.externalChapId}
              href={`/read/${ch.externalChapId}`}
              className="group block"
            >
              <YantraCard
                glowColor="sindoor"
                className="p-3 flex items-center gap-3 bg-sanctum/85 hover:border-sindoor/50 transition-all duration-300"
              >
                {/* Thumbnail */}
                <div className="relative w-14 h-20 flex-shrink-0 bg-void rounded-sm overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ch.coverUrl.startsWith("http") ? `/api/proxy/image?url=${encodeURIComponent(ch.coverUrl)}` : ch.coverUrl}
                    alt={ch.mangaTitle}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                </div>

                {/* Chapter Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <h4
                    title={ch.mangaTitle}
                    className="font-hud font-bold text-sm text-ashram group-hover:text-gada-bright transition-colors truncate"
                  >
                    {ch.mangaTitle}
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-sindoor/90 text-white rounded-sm">
                      CH. {ch.chapterNumber}
                    </span>
                    <span className="font-mono text-[10px] text-ashram-muted truncate">
                      {ch.scanlator}
                    </span>
                  </div>
                  <div className="font-mono text-[9px] text-ashram-muted/70 flex items-center justify-between">
                    <span>
                      {new Date(ch.publishedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="text-prana">READ →</span>
                  </div>
                </div>
              </YantraCard>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Multi-Source Recommendations Shelf */}
      <MultiSourceRecommendations
        initialItems={combinedCurated}
        mangaDexItems={dexFormatted}
        allMangaItems={allFormatted}
        aniListItems={aniFormatted}
      />

      {/* 4. Hanuman Vedic Cyberpunk Feature Ribbon */}
      <section className="relative overflow-hidden rounded-sm border border-gada/40 bg-sanctum/90 p-8 shadow-hud-glow">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sindoor/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center gap-2 text-gada-bright font-mono text-xs uppercase tracking-widest">
              <Sparkles className="w-4 h-4 text-gada" />
              SANKAT MOCHAN PROTOCOL // ZERO BROKEN IMAGES
            </div>
            <h3 className="font-mythic text-2xl font-bold text-ashram">
              Multi-Source Manga Streaming
            </h3>
            <p className="font-hud text-sm text-ashram-muted leading-relaxed max-w-xl">
              Engineered with automated MangaDex@Home node resolution, AllManga GraphQL
              archive, anti-CORS streaming proxies, and multi-source fallbacks. Experience rapid image loading in
              Webtoon, RTL, and Double-Spread modes.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 justify-end">
            <Link
              href="/explore"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-sm bg-gada text-void font-hud font-bold uppercase tracking-wider text-sm hover:bg-gada-bright transition-all shadow-gada-gold"
            >
              <Compass className="w-4 h-4" />
              Browse Entire Catalog
            </Link>
            <Link
              href="/extensions"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-sm bg-void border border-sanctum-border text-ashram font-hud font-semibold uppercase tracking-wider text-sm hover:border-gada transition-all"
            >
              <BookOpen className="w-4 h-4" />
              Explore Extensions
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
