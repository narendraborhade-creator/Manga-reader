"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Star,
  BookOpen,
  Calendar,
  User,
  ArrowUpDown,
  Search,
  Bookmark as BookmarkIcon,
  CheckCircle,
  ExternalLink,
  Cpu,
  Layers,
  Sparkles,
} from "lucide-react";
import { getMangaDetails, MangaDetailsResponse } from "@/lib/api-client";
import { YantraCard } from "@/components/hud/YantraCard";
import { CyberGadaLoader } from "@/components/hud/CyberGadaLoader";
import { toggleBookmark, isBookmarked, getReadingProgress } from "@/lib/bookmarks";

export default function MangaDetailPage({
  params,
}: {
  params: Promise<{ id: string | string[] }>;
}) {
  const resolvedParams = use(params);
  const id = Array.isArray(resolvedParams.id)
    ? resolvedParams.id.map(decodeURIComponent).join("/")
    : decodeURIComponent(resolvedParams.id || "");
  const [manga, setManga] = useState<MangaDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chapter Ledger filters & state
  const [sortAsc, setSortAsc] = useState(false);
  const [chapterSearch, setChapterSearch] = useState("");
  const [selectedSource, setSelectedSource] = useState("mangadex");
  const [bookmarked, setBookmarked] = useState(false);
  const [showFullSynopsis, setShowFullSynopsis] = useState(false);
  const [readingHistory, setReadingHistory] = useState<any>({});

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    getMangaDetails(id)
      .then((data) => {
        if (!isMounted) return;
        if (data) {
          setManga(data);
          setBookmarked(isBookmarked(id));
          setReadingHistory(getReadingProgress()[id] || {});
        } else {
          setError("Failed to load manga details from sacred codex.");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || "An error occurred.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleBookmark = () => {
    if (!manga) return;
    const nextState = toggleBookmark({
      mangaId: manga.id,
      title: manga.title,
      coverUrl: manga.coverUrl,
      status: manga.status,
      genres: manga.genres,
      addedAt: new Date().toISOString(),
    });
    setBookmarked(nextState);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <CyberGadaLoader
          size="md"
          text="ॐ DECODING SERIES ARCHIVE..."
          subtext="AGGREGATING CHAPTER MATRICES ACROSS SOURCES"
        />
      </div>
    );
  }

  if (error || !manga) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 bg-sanctum/90 border border-sindoor/40 rounded-sm">
        <h2 className="font-hud text-xl text-sindoor font-bold tracking-wider mb-2">
          SACRED CODEX RECORD NOT FOUND
        </h2>
        <p className="font-mono text-xs text-ashram-muted mb-4 max-w-md">
          {error || "Could not retrieve series from primary index."}
        </p>
        <Link
          href="/"
          className="px-4 py-2 bg-gada text-void font-hud font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-gada-bright transition-colors"
        >
          Return to Command Deck
        </Link>
      </div>
    );
  }

  // Filter and sort chapters
  let filteredChapters = [...manga.chapterGroups];

  if (chapterSearch.trim()) {
    const q = chapterSearch.toLowerCase();
    filteredChapters = filteredChapters.filter(
      (cg) =>
        cg.chapterNumber.toString().includes(q) ||
        (cg.primary.title && cg.primary.title.toLowerCase().includes(q)) ||
        (cg.primary.scanlator && cg.primary.scanlator.toLowerCase().includes(q))
    );
  }

  filteredChapters.sort((a, b) =>
    sortAsc
      ? a.chapterNumber - b.chapterNumber
      : b.chapterNumber - a.chapterNumber
  );

  const banner = manga.bannerUrl || manga.coverUrl;

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Series Header with Backdrop Banner */}
      <div className="relative rounded-sm overflow-hidden border border-sanctum-border bg-sanctum/90 shadow-hud-glow">
        {/* Banner Backdrop with Vignette */}
        <div className="relative w-full h-48 md:h-72 overflow-hidden bg-void">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={banner.startsWith("http") ? `/api/proxy/image?url=${encodeURIComponent(banner)}` : banner}
            alt={manga.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center brightness-40 blur-sm scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-sanctum via-sanctum/70 to-transparent" />
        </div>

        {/* Header Profile Content */}
        <div className="relative px-6 pb-6 -mt-24 md:-mt-32 flex flex-col md:flex-row gap-6 items-start">
          {/* Manga Cover Card */}
          <div className="relative w-36 sm:w-48 md:w-56 flex-shrink-0 aspect-[3/4] bg-void rounded-sm border-2 border-gada/60 shadow-gada-gold overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={manga.coverUrl.startsWith("http") ? `/api/proxy/image?url=${encodeURIComponent(manga.coverUrl)}` : manga.coverUrl}
              alt={manga.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Metadata & Actions */}
          <div className="flex-1 space-y-4 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold tracking-widest uppercase bg-prana/20 text-prana border border-prana/40 rounded-sm">
                {manga.status}
              </span>

              {manga.score && (
                <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold bg-gada/20 text-gada-bright border border-gada/40 rounded-sm">
                  <Star className="w-3 h-3 fill-current" />
                  {manga.score}%
                </span>
              )}

              {manga.year && (
                <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-ashram-muted border border-sanctum-border rounded-sm">
                  <Calendar className="w-3 h-3" />
                  {manga.year}
                </span>
              )}
            </div>

            <h1 className="font-mythic text-2xl sm:text-3xl md:text-4xl font-bold text-ashram leading-tight tracking-wide">
              {manga.title}
            </h1>

            {/* Author / Artist */}
            {(manga.author || manga.artist) && (
              <div className="flex items-center gap-2 font-mono text-xs text-ashram-muted">
                <User className="w-3.5 h-3.5 text-gada" />
                <span>Author: {manga.author}</span>
                {manga.artist && manga.artist !== manga.author && (
                  <span>• Artist: {manga.artist}</span>
                )}
              </div>
            )}

            {/* Genres */}
            {manga.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {manga.genres.map((g) => (
                  <span
                    key={g}
                    className="px-2.5 py-1 text-xs font-hud uppercase rounded bg-void/80 border border-sanctum-border text-ashram-muted"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* Synopsis */}
            {manga.description && (
              <div className="pt-2">
                <p
                  className={`font-hud text-sm text-ashram leading-relaxed ${
                    !showFullSynopsis ? "line-clamp-3" : ""
                  }`}
                >
                  {manga.description.replace(/<[^>]*>?/gm, "")}
                </p>
                {manga.description.length > 200 && (
                  <button
                    onClick={() => setShowFullSynopsis(!showFullSynopsis)}
                    className="font-mono text-xs text-gada hover:underline mt-1"
                  >
                    {showFullSynopsis ? "SHOW LESS ▲" : "READ FULL SYNOPSIS ▼"}
                  </button>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              {manga.chapterGroups.length > 0 && (
                <Link
                  href={`/read/${manga.chapterGroups[manga.chapterGroups.length - 1].primary.externalChapId}`}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-sm bg-gradient-to-r from-sindoor to-sindoor-glow text-white font-hud font-bold uppercase tracking-wider text-sm shadow-sindoor-neon hover:scale-105 transition-all"
                >
                  <BookOpen className="w-4 h-4" />
                  START READING (CH. 1)
                </Link>
              )}

              {/* Resume Reading Button (if history exists) */}
              {readingHistory.chapterId && (
                <Link
                  href={`/read/${readingHistory.chapterId}`}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-sm bg-gada text-void font-hud font-bold uppercase tracking-wider text-sm shadow-gada-gold hover:bg-gada-bright transition-all"
                >
                  <CheckCircle className="w-4 h-4" />
                  RESUME CH. {readingHistory.chapterNumber} (PAGE {readingHistory.page})
                </Link>
              )}

              {/* Bookmark Toggle Button */}
              <button
                onClick={handleBookmark}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-sm font-hud font-semibold uppercase tracking-wider text-sm border transition-all ${
                  bookmarked
                    ? "bg-sindoor/20 border-sindoor text-sindoor shadow-sindoor-neon"
                    : "bg-sanctum border-sanctum-border text-ashram hover:border-gada"
                }`}
              >
                <BookmarkIcon className={`w-4 h-4 ${bookmarked ? "fill-current" : ""}`} />
                {bookmarked ? "SAVED IN CODEX" : "BOOKMARK SERIES"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fallback Mirror Notice if Applicable */}
      {manga.fallbackNotice && (
        <div className="p-3 bg-sindoor/10 border border-sindoor/40 rounded-sm flex items-center gap-3 text-xs font-mono text-ashram">
          <Sparkles className="w-4 h-4 text-sindoor flex-shrink-0" />
          <span>{manga.fallbackNotice}</span>
        </div>
      )}

      {/* 2. Source Switcher Tab Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sanctum-border pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Layers className="w-4 h-4 text-gada" />
          <span className="font-hud uppercase text-sm font-bold text-ashram tracking-wider">
            DATA SOURCE:
          </span>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded text-xs font-mono font-bold uppercase bg-sindoor text-white shadow-sindoor-neon border border-sindoor-glow flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              {manga.sourceType || "MANGADEX"} (Active)
            </span>

            {manga.alternateSources?.mangapill && !id.startsWith("mangapill") && (
              <Link
                href={`/manga/${manga.alternateSources.mangapill.id}`}
                className="px-3 py-1 rounded text-xs font-mono font-bold uppercase bg-gada/20 text-gada-bright border border-gada/50 hover:bg-gada hover:text-void transition-all flex items-center gap-1.5 shadow-gada-gold"
                title="Switch to MangaPill Cloud mirror"
              >
                Switch to MangaPill Cloud
              </Link>
            )}

            {manga.alternateSources?.weebcentral && !id.startsWith("weebcentral") && (
              <Link
                href={`/manga/${manga.alternateSources.weebcentral.id}`}
                className="px-3 py-1 rounded text-xs font-mono font-bold uppercase bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500 hover:text-void transition-all flex items-center gap-1.5"
                title="Switch to WeebCentral stream"
              >
                Switch to WeebCentral Stream
              </Link>
            )}

            <Link
              href="/extensions"
              className="px-3 py-1 rounded text-xs font-mono font-bold uppercase bg-sanctum border border-sanctum-border text-ashram-muted hover:text-ashram hover:border-gada transition-all"
            >
              Keiyoushi Extensions (500+)
            </Link>
          </div>
        </div>

        <div className="font-mono text-xs text-ashram-muted">
          TOTAL CHAPTERS: {manga.chapterGroups.length}
        </div>
      </div>

      {/* 3. Filterable Chapter Ledger */}
      <section className="space-y-4">
        {/* Ledger Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-sanctum/90 p-4 rounded-sm border border-sanctum-border">
          {/* Chapter Search */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={chapterSearch}
              onChange={(e) => setChapterSearch(e.target.value)}
              placeholder="SEARCH CHAPTER OR TITLE..."
              className="w-full bg-void border border-sanctum-border text-xs font-mono text-ashram rounded px-3 py-2 pl-9 outline-none focus:border-gada"
            />
            <Search className="w-3.5 h-3.5 text-ashram-muted absolute left-3 top-2.5 pointer-events-none" />
          </div>

          {/* Sort Order Toggle */}
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="flex items-center gap-1.5 px-3 py-2 bg-void border border-sanctum-border text-xs font-hud uppercase tracking-wider text-ashram hover:border-gada rounded transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-gada" />
            <span>SORT: {sortAsc ? "OLDEST FIRST (ASC)" : "NEWEST FIRST (DESC)"}</span>
          </button>
        </div>

        {/* Chapter List Grid / Ledger */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredChapters.map((cg) => {
            const isRead =
              readingHistory.chapterId === cg.primary.externalChapId;

            return (
              <Link
                key={cg.primary.externalChapId}
                href={`/read/${cg.primary.externalChapId}`}
                className="group block"
              >
                <YantraCard
                  glowColor="sindoor"
                  className={`p-3.5 bg-sanctum/85 hover:border-sindoor/60 transition-all ${
                    isRead ? "border-prana/40 bg-prana/5" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-sindoor/90 text-white shadow-sindoor-neon">
                          CH. {cg.chapterNumber}
                        </span>
                        {isRead && (
                          <span className="flex items-center gap-1 font-mono text-[10px] text-prana">
                            <CheckCircle className="w-3 h-3" /> READ
                          </span>
                        )}
                      </div>
                      <h4 className="font-hud font-bold text-sm text-ashram group-hover:text-gada-bright transition-colors line-clamp-1 pt-1">
                        {cg.primary.title || `Chapter ${cg.chapterNumber}`}
                      </h4>
                      <p className="font-mono text-[10px] text-ashram-muted truncate">
                        {cg.primary.scanlator}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-hud text-xs font-bold text-gada group-hover:text-sindoor transition-colors block">
                        READ →
                      </span>
                      <span className="font-mono text-[9px] text-ashram-muted/70 block mt-1">
                        {new Date(cg.primary.publishedAt).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric", year: "numeric" }
                        )}
                      </span>
                    </div>
                  </div>
                </YantraCard>
              </Link>
            );
          })}
        </div>

        {filteredChapters.length === 0 && (
          <div className="text-center py-12 bg-sanctum/50 rounded border border-sanctum-border">
            <p className="font-mono text-xs text-ashram-muted">
              No chapters match your search query.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
