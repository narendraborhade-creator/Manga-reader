import React from "react";
import Link from "next/link";
import { fetchMangaDexLatestChapters, searchMangaDex } from "@/lib/adapters/mangadex";
import { fetchAniListTrending, fetchAniListPopular } from "@/lib/adapters/anilist";
import { searchMangaPill } from "@/lib/adapters/mangapill";
import { searchWeebCentral } from "@/lib/adapters/weebcentral";
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
    mangaPillPopular,
    weebCentralPopular,
    mangaDexPopular,
    aniListPopular,
  ] = await Promise.all([
    fetchAniListTrending(8).catch(() => []),
    fetchMangaDexLatestChapters(24, "en").catch(() => []),
    searchMangaPill("Piece", 12).catch(() => []),
    searchWeebCentral("Piece", 12).catch(() => []),
    searchMangaDex("", 12).catch(() => []),
    fetchAniListPopular(12).catch(() => []),
  ]);

  const pillFormatted = mangaPillPopular.map((m) => ({
    id: m.id,
    title: m.title,
    coverUrl: m.coverUrl,
    status: "ONGOING",
    genres: m.genres,
    source: "MANGAPILL",
  }));

  const weebFormatted = weebCentralPopular.map((m) => ({
    id: m.id,
    title: m.title,
    coverUrl: m.coverUrl,
    status: "ONGOING",
    genres: m.genres,
    source: "WEEBCENTRAL",
  }));

  const dexFormatted = mangaDexPopular.map((m) => ({
    id: m.id,
    title: m.title,
    coverUrl: m.coverUrl,
    status: m.status,
    genres: m.tags,
    source: "MANGADEX",
  }));

  const aniFormatted = aniListPopular.map((m) => ({
    id: `anilist-${m.id}`,
    title: m.title.english || m.title.romaji || "Sacred Series",
    coverUrl: m.coverImage?.extraLarge || m.coverImage?.large || "/placeholder-manga.jpg",
    status: m.status || "RELEASING",
    score: m.averageScore,
    genres: m.genres,
    source: "ANILIST",
  }));

  // Curated blend for default tab
  const combinedCurated = [
    ...pillFormatted.slice(0, 3),
    ...weebFormatted.slice(0, 3),
    ...dexFormatted.slice(0, 3),
    ...aniFormatted.slice(0, 3),
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
            <div>
              <h2 className="font-hud uppercase text-lg sm:text-xl font-bold text-ashram tracking-wider">
                LATEST RELEASES
              </h2>
              <p className="font-mono text-xs text-ashram-muted">
                Real-time MangaDex and scanlation updates
              </p>
            </div>
          </div>

          <Link
            href="/explore"
            className="flex items-center gap-1 font-mono text-xs text-gada hover:text-gada-bright uppercase transition-colors"
          >
            VIEW ALL CHAPTERS
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Latest Chapters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {latestChapters.map((chapter) => (
            <Link
              key={chapter.externalChapId}
              href={`/read/${chapter.externalChapId}`}
              className="group block focus:outline-none"
            >
              <YantraCard
                glowColor="sindoor"
                className="h-full flex flex-col bg-sanctum/90 hover:border-sindoor/60 transition-all duration-300"
              >
                {/* Cover Image */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-void">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/proxy/image?url=${encodeURIComponent(chapter.coverUrl)}`}
                    alt={chapter.mangaTitle}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-2 left-2 z-10">
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-sindoor text-white rounded-sm shadow-sindoor-neon">
                      CH. {chapter.chapterNumber}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h3 className="font-hud font-bold text-sm text-ashram group-hover:text-sindoor-glow transition-colors line-clamp-2 leading-snug">
                      {chapter.mangaTitle}
                    </h3>
                    <p className="font-mono text-[10px] text-ashram-muted/70 line-clamp-1 mt-1">
                      {chapter.scanlator || "Official / Fan"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-sanctum-border/60 text-[10px] font-mono text-ashram-muted">
                    <span className="group-hover:text-sindoor transition-colors">READ CH. {chapter.chapterNumber} →</span>
                    <span className="text-gada-bright font-bold">LIVE</span>
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
        mangaPillItems={pillFormatted}
        weebCentralItems={weebFormatted}
        mangaDexItems={dexFormatted}
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
              Engineered with automated MangaDex@Home node resolution, MangaPill cloud,
              WeebCentral stream, anti-CORS streaming proxies, and multi-source fallbacks. Experience rapid image loading in
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
