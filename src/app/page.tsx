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
      {/* 1. Hero Carousel ("Sundara Matrix") */}
      {trendingMedia.length > 0 && <HeroCarousel items={trendingMedia} />}

      {/* 2. Real-Time Latest Releases Feed (Deduplicated Unique Manga) */}
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
                Freshly released chapters with verified English translations
              </p>
            </div>
          </div>

          <Link
            href="/explore"
            className="flex items-center gap-1 font-mono text-xs text-gada hover:text-gada-bright uppercase transition-colors"
          >
            VIEW ALL RELEASES
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Latest Chapters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {latestChapters.map((chapter) => (
            <div key={chapter.externalChapId} className="group flex flex-col h-full">
              <YantraCard
                glowColor="sindoor"
                className="h-full flex flex-col bg-sanctum/90 hover:border-sindoor/60 transition-all duration-300"
              >
                {/* Cover Image links to Series */}
                <Link
                  href={`/manga/${chapter.mangaExternalId}`}
                  className="relative aspect-[3/4] w-full overflow-hidden bg-void block"
                >
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
                </Link>

                {/* Info & Direct Read */}
                <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                  <Link href={`/manga/${chapter.mangaExternalId}`}>
                    <h3 className="font-hud font-bold text-sm text-ashram group-hover:text-sindoor-glow transition-colors line-clamp-2 leading-snug">
                      {chapter.mangaTitle}
                    </h3>
                    <p className="font-mono text-[10px] text-ashram-muted/70 line-clamp-1 mt-1">
                      English Translation
                    </p>
                  </Link>

                  <div className="flex items-center justify-between pt-1 border-t border-sanctum-border/60 text-[10px] font-mono">
                    <Link
                      href={`/read/${chapter.externalChapId}`}
                      className="font-bold text-sindoor hover:text-sindoor-glow transition-colors flex items-center gap-1"
                    >
                      READ NOW →
                    </Link>
                    <span className="text-gada-bright font-bold">NEW</span>
                  </div>
                </div>
              </YantraCard>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Curated Manga Recommendations */}
      <MultiSourceRecommendations
        initialItems={combinedCurated.slice(0, 12)}
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
              SANKAT MOCHAN PROTOCOL // HIGH-SPEED MANGA
            </div>
            <h3 className="font-mythic text-2xl font-bold text-ashram">
              Integrated Manga Streaming
            </h3>
            <p className="font-hud text-sm text-ashram-muted leading-relaxed max-w-xl">
              Engineered with automated node resolution, high-speed image CDNs, and multi-stream failover. Enjoy uninterrupted reading in Webtoon, RTL, and Single Page modes starting directly from Chapter 1.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 justify-end">
            <Link
              href="/explore"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-sm bg-gada text-void font-hud font-bold uppercase tracking-wider text-sm hover:bg-gada-bright transition-all shadow-gada-gold"
            >
              <Compass className="w-4 h-4" />
              Explore All Titles
            </Link>
            <Link
              href="/extensions"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-sm bg-void border border-sanctum-border text-ashram font-hud font-semibold uppercase tracking-wider text-sm hover:border-gada transition-all"
            >
              <BookOpen className="w-4 h-4" />
              Engine Integrations
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
