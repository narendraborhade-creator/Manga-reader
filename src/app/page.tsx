import React from "react";
import Link from "next/link";
import { fetchMangaDexLatestChapters, searchMangaDex } from "@/lib/adapters/mangadex";
import { fetchAniListTrending, fetchAniListPopular } from "@/lib/adapters/anilist";
import { searchMangaPill } from "@/lib/adapters/mangapill";
import { searchWeebCentral } from "@/lib/adapters/weebcentral";
import { HeroCarousel } from "@/components/hud/HeroCarousel";
import { MultiSourceRecommendations } from "@/components/hud/MultiSourceRecommendations";
import { LatestChapterCard } from "@/components/hud/LatestChapterCard";
import { Clock, Compass, BookOpen, ChevronRight, Layers } from "lucide-react";

export const revalidate = 60; // Fresh chapters every minute

async function fetchCuratedManga(title: string) {
  const [weebList, pillList] = await Promise.all([
    searchWeebCentral(title, 2).catch(() => []),
    searchMangaPill(title, 2).catch(() => []),
  ]);

  const cleanQuery = title.toLowerCase().replace(/[^a-z0-9]/g, "");

  const wMatch = weebList.find(
    (m) =>
      !m.title.toLowerCase().includes("novel") &&
      !m.title.toLowerCase().includes("volume") &&
      m.title.toLowerCase().replace(/[^a-z0-9]/g, "").includes(cleanQuery)
  );
  if (wMatch) {
    return {
      id: wMatch.id,
      title: wMatch.title,
      coverUrl: wMatch.coverUrl,
      status: "ONGOING",
      genres: wMatch.genres || [],
    };
  }

  const pMatch = pillList.find(
    (m) =>
      !m.title.toLowerCase().includes("novel") &&
      m.title.toLowerCase().replace(/[^a-z0-9]/g, "").includes(cleanQuery)
  );
  if (pMatch) {
    return {
      id: pMatch.id,
      title: pMatch.title,
      coverUrl: pMatch.coverUrl,
      status: "ONGOING",
      genres: pMatch.genres || [],
    };
  }

  const fallback = weebList[0] || pillList[0];
  if (fallback) {
    return {
      id: fallback.id,
      title: fallback.title,
      coverUrl: fallback.coverUrl,
      status: "ONGOING",
      genres: (fallback as any).genres || [],
    };
  }

  return null;
}

const POPULAR_GENRES = [
  "Action",
  "Adventure",
  "Fantasy",
  "Romance",
  "Comedy",
  "Sci-Fi",
  "Shounen",
  "Seinen",
  "Drama",
  "Mystery",
];

export default async function HomePage() {
  const [
    trendingMedia,
    latestChapters,
    shonenTitles,
    seinenTitles,
    mangaDexPopular,
    aniListPopular,
  ] = await Promise.all([
    fetchAniListTrending(8).catch(() => []),
    fetchMangaDexLatestChapters(18, "en").catch(() => []),
    Promise.all([
      fetchCuratedManga("One Piece"),
      fetchCuratedManga("Jujutsu Kaisen"),
      fetchCuratedManga("Chainsaw Man"),
      fetchCuratedManga("Solo Leveling"),
      fetchCuratedManga("Bleach"),
      fetchCuratedManga("Naruto"),
    ])
      .then((items) => items.filter(Boolean))
      .catch(() => []),
    Promise.all([
      fetchCuratedManga("Berserk"),
      fetchCuratedManga("Vinland Saga"),
      fetchCuratedManga("Kingdom"),
      fetchCuratedManga("Vagabond"),
      fetchCuratedManga("Tower of God"),
      fetchCuratedManga("Omniscient Reader"),
    ])
      .then((items) => items.filter(Boolean))
      .catch(() => []),
    searchMangaDex("", 12).catch(() => []),
    fetchAniListPopular(12).catch(() => []),
  ]);

  const pillFormatted = (shonenTitles as any[]).filter(Boolean);
  const weebFormatted = (seinenTitles as any[]).filter(Boolean);

  const dexFormatted = mangaDexPopular.map((m) => ({
    id: m.id,
    title: m.title,
    coverUrl: m.coverUrl,
    status: m.status,
    genres: m.tags,
  }));

  const aniFormatted = aniListPopular.map((m) => ({
    id: `anilist-${m.id}`,
    title: m.title.english || m.title.romaji || "Popular Series",
    coverUrl: m.coverImage?.extraLarge || m.coverImage?.large || "/placeholder-manga.jpg",
    status: m.status || "RELEASING",
    score: m.averageScore,
    genres: m.genres,
  }));

  // Curated blend with 100% unique titles (no duplicates)
  const seenTitles = new Set<string>();
  const combinedCurated: any[] = [];

  for (const item of [...pillFormatted, ...weebFormatted, ...dexFormatted, ...aniFormatted]) {
    if (!item || !item.title) continue;
    const norm = item.title.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!seenTitles.has(norm)) {
      seenTitles.add(norm);
      combinedCurated.push(item);
    }
  }

  return (
    <div className="space-y-12 pb-16">
      {/* 1. Hero Spotlight Carousel */}
      {trendingMedia.length > 0 && <HeroCarousel items={trendingMedia} />}

      {/* 2. Quick Genre Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <Link
          href="/explore"
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-sans text-xs font-semibold whitespace-nowrap shadow-md shadow-indigo-600/20"
        >
          All Genres
        </Link>
        {POPULAR_GENRES.map((genre) => (
          <Link
            key={genre}
            href={`/explore?genre=${encodeURIComponent(genre)}`}
            className="px-4 py-2 rounded-xl bg-[#121622] hover:bg-[#1a2030] text-slate-300 hover:text-white border border-[#23293e] font-sans text-xs font-medium whitespace-nowrap transition-colors"
          >
            {genre}
          </Link>
        ))}
      </div>

      {/* 3. Real-Time Latest Releases Feed */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[#20273a]">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
              <Clock className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-sans text-xl sm:text-2xl font-bold text-white tracking-tight">
                Latest Chapter Updates
              </h2>
              <p className="font-sans text-xs text-slate-400">
                Fresh releases verified across official and community mirrors
              </p>
            </div>
          </div>

          <Link
            href="/explore"
            className="flex items-center gap-1 font-sans text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Browse All Releases
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Latest Chapters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {latestChapters.map((chapter) => (
            <LatestChapterCard
              key={chapter.externalChapId}
              externalChapId={chapter.externalChapId}
              mangaExternalId={chapter.mangaExternalId}
              mangaTitle={chapter.mangaTitle}
              coverUrl={chapter.coverUrl}
              chapterNumber={chapter.chapterNumber}
              publishedAt={chapter.publishedAt}
            />
          ))}
        </div>
      </section>

      {/* 4. Curated Recommendations Shelf */}
      <MultiSourceRecommendations
        initialItems={combinedCurated.slice(0, 12)}
        mangaPillItems={pillFormatted}
        weebCentralItems={weebFormatted}
        mangaDexItems={dexFormatted}
        aniListItems={aniFormatted}
      />

      {/* 5. Mangayomi Ecosystem Feature Spotlight */}
      <section className="relative overflow-hidden rounded-2xl border border-[#23293e] bg-gradient-to-br from-[#121622] via-[#10141f] to-[#0a0d14] p-8 md:p-10 shadow-xl">
        <div className="absolute -top-12 -right-12 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs uppercase tracking-wider font-semibold">
              <Layers className="w-4 h-4" />
              Powered by Mangayomi Open Architecture
            </div>
            <h3 className="font-sans text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              360+ Multi-Source Manga & Manhwa Engines
            </h3>
            <p className="font-sans text-sm text-slate-300 leading-relaxed max-w-xl">
              Enjoy continuous Webtoon vertical scroll, paged reading, zero ads, instant caching, and multi-source chapter comparison. Stream verified releases directly from the world&apos;s leading manga archives.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 justify-end">
            <Link
              href="/explore"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-sans font-semibold text-sm transition-all shadow-lg shadow-indigo-600/25 hover:scale-105"
            >
              <Compass className="w-4 h-4" />
              Browse Entire Catalog
            </Link>
            <Link
              href="/extensions"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#182032] hover:bg-[#202b44] text-slate-200 border border-[#2b3550] font-sans font-medium text-sm transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Explore Extensions Store
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
