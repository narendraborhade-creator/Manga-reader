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
  Sparkles,
  ShieldCheck,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";
import { getMangaDetails, MangaDetailsResponse } from "@/lib/api-client";
import { CyberGadaLoader } from "@/components/hud/CyberGadaLoader";
import { toggleBookmark, isBookmarked, getReadingProgress } from "@/lib/bookmarks";

export default function MangaDetailPage({
  params,
}: {
  params: Promise<{ id: string | string[] }>;
}) {
  const resolvedParams = use(params);
  const rawId = Array.isArray(resolvedParams.id)
    ? resolvedParams.id.map(decodeURIComponent).join("/")
    : decodeURIComponent(resolvedParams.id || "");

  const id = (() => {
    if (rawId.startsWith("allmanga-") && rawId.includes("-") && rawId.split("-").length > 2) {
      return `allmanga-${rawId.replace(/^allmanga-/, "").split("-")[0]}`;
    }
    if (rawId.startsWith("asura-") && rawId.includes("/")) {
      return `asura-${rawId.replace(/^asura-/, "").split("/")[0]}`;
    }
    if (rawId.startsWith("mangapill-") && rawId.includes("-")) {
      const match = rawId.match(/^mangapill-(\d+)(?:-\d+)?\/(.*)$/);
      if (match) return `mangapill-${match[1]}/${match[2]}`;
    }
    return rawId;
  })();

  const [manga, setManga] = useState<MangaDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chapter filters & state
  const [sortAsc, setSortAsc] = useState(false);
  const [chapterSearch, setChapterSearch] = useState("");
  const [bookmarked, setBookmarked] = useState(false);
  const [showFullSynopsis, setShowFullSynopsis] = useState(false);
  const [readingHistory, setReadingHistory] = useState<any>({});
  const [coverError, setCoverError] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(60);

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
          setError("Failed to load manga details from the connected repository.");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || "An error occurred while loading series details.");
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
          text="Loading manga series details..."
          subtext="Fetching chapter archives & metadata"
        />
      </div>
    );
  }

  if (error || !manga) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-8 bg-[#121622] border border-[#23293e] rounded-2xl max-w-lg mx-auto my-12 shadow-xl">
        <h2 className="font-sans text-xl text-rose-400 font-bold tracking-tight mb-2">
          Series Not Found
        </h2>
        <p className="font-sans text-xs text-slate-400 mb-6 leading-relaxed">
          {error || "Could not retrieve series from primary repository index."}
        </p>
        <div className="flex gap-3">
          <Link
            href="/explore"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-sans font-semibold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/20"
          >
            Explore Catalog
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 bg-[#0b0e14] border border-[#23293e] hover:border-slate-600 text-slate-300 font-sans font-medium text-xs rounded-xl transition-colors"
          >
            Home Deck
          </Link>
        </div>
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
  const bannerSrc =
    banner.includes("s4.anilist.co") || banner.includes("anilist.co")
      ? banner
      : banner.startsWith("http")
      ? `/api/proxy/image?url=${encodeURIComponent(banner)}`
      : banner;

  const coverSrc =
    manga.coverUrl.includes("s4.anilist.co") || manga.coverUrl.includes("anilist.co")
      ? manga.coverUrl
      : manga.coverUrl.startsWith("http")
      ? `/api/proxy/image?url=${encodeURIComponent(manga.coverUrl)}`
      : manga.coverUrl;

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Series Header with Backdrop Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-[#23293e] bg-[#121622] shadow-2xl">
        {/* Banner Backdrop */}
        <div className="relative w-full h-48 md:h-72 overflow-hidden bg-[#0b0e14]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bannerSrc}
            alt={manga.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center brightness-[0.35] blur-sm scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121622] via-[#121622]/60 to-transparent" />
        </div>

        {/* Header Profile Content */}
        <div className="relative px-6 pb-6 -mt-24 md:-mt-32 flex flex-col md:flex-row gap-6 items-start">
          {/* Manga Cover Card */}
          <div className="relative w-36 sm:w-48 md:w-56 flex-shrink-0 aspect-[3/4] bg-[#0b0e14] rounded-2xl border border-[#282f45] shadow-2xl overflow-hidden flex items-center justify-center">
            {!coverError && coverSrc ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={coverSrc}
                alt={manga.title}
                referrerPolicy="no-referrer"
                onError={() => setCoverError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-[#161c2e] to-[#0b0e14]">
                <BookOpen className="w-8 h-8 text-indigo-400 mb-2" />
                <span className="font-sans text-xs font-semibold text-slate-200 line-clamp-3">
                  {manga.title}
                </span>
                <span className="font-mono text-[9px] text-indigo-400/80 mt-2 tracking-wider uppercase">
                  MANGAYOMI
                </span>
              </div>
            )}
          </div>

          {/* Metadata & Actions */}
          <div className="flex-1 space-y-4 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-semibold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-md">
                {manga.status}
              </span>

              {manga.score && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-md">
                  <Star className="w-3 h-3 fill-current" />
                  {manga.score}%
                </span>
              )}

              {manga.year && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-mono text-slate-400 border border-[#23293e] rounded-md bg-[#0b0e14]">
                  <Calendar className="w-3 h-3" />
                  {manga.year}
                </span>
              )}

              <span className="flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-mono text-indigo-300 border border-indigo-500/30 bg-indigo-500/10 rounded-md">
                <ShieldCheck className="w-3 h-3" />
                VERIFIED ENGLISH
              </span>
            </div>

            <h1 className="font-sans text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight tracking-tight">
              {manga.title}
            </h1>

            {/* Author / Artist */}
            {(manga.author || manga.artist) && (
              <div className="flex items-center gap-2 font-sans text-xs text-slate-400">
                <User className="w-3.5 h-3.5 text-indigo-400" />
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
                    className="px-2.5 py-1 text-xs font-sans rounded-lg bg-[#0b0e14] border border-[#23293e] text-slate-300"
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
                  className={`font-sans text-sm text-slate-300 leading-relaxed ${
                    !showFullSynopsis ? "line-clamp-3" : ""
                  }`}
                >
                  {manga.description.replace(/<[^>]*>?/gm, "")}
                </p>
                {manga.description.length > 200 && (
                  <button
                    onClick={() => setShowFullSynopsis(!showFullSynopsis)}
                    className="font-sans text-xs text-indigo-400 hover:text-indigo-300 mt-1 font-medium"
                  >
                    {showFullSynopsis ? "Show Less ▲" : "Read Full Synopsis ▼"}
                  </button>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              {manga.chapterGroups.length > 0 && (
                <>
                  <Link
                    href={`/read/${manga.chapterGroups[manga.chapterGroups.length - 1].primary.externalChapId}`}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-sans font-semibold text-sm shadow-lg shadow-indigo-600/30 hover:scale-105 transition-all"
                  >
                    <BookOpen className="w-4 h-4" />
                    Start Reading (Ch. 1)
                  </Link>

                  <Link
                    href={`/read/${manga.chapterGroups[0].primary.externalChapId}`}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0b0e14] border border-[#23293e] hover:border-indigo-500/50 text-slate-200 font-sans font-semibold text-sm transition-all"
                  >
                    Latest (Ch. {manga.chapterGroups[0].chapterNumber})
                  </Link>
                </>
              )}

              {/* Resume Reading Button */}
              {readingHistory.chapterId && (
                <Link
                  href={`/read/${readingHistory.chapterId}`}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-sans font-semibold text-sm shadow-md shadow-emerald-600/20 transition-all"
                >
                  <CheckCircle className="w-4 h-4" />
                  Resume Ch. {readingHistory.chapterNumber}
                </Link>
              )}

              {/* Bookmark Toggle Button */}
              <button
                onClick={handleBookmark}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-sans font-semibold text-sm border transition-all ${
                  bookmarked
                    ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-600/20"
                    : "bg-[#0b0e14] border-[#23293e] text-slate-300 hover:border-slate-500"
                }`}
              >
                <BookmarkIcon className={`w-4 h-4 ${bookmarked ? "fill-current" : ""}`} />
                {bookmarked ? "Saved in Library" : "Add to Library"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Chapter Archive Header & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#20273a] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-sans text-xl font-bold text-white">
              Chapter Archive
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase bg-indigo-600/20 text-indigo-300 border border-indigo-500/30">
              {manga.totalChapters} Chapters
            </span>
          </div>
          <p className="font-sans text-xs text-slate-400 mt-1">
            Verified full-coverage archive from official and community repositories
          </p>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={chapterSearch}
              onChange={(e) => setChapterSearch(e.target.value)}
              placeholder="Filter chapters (e.g. 100)..."
              className="w-full bg-[#121622] border border-[#23293e] text-xs font-sans text-slate-200 rounded-xl px-3.5 py-2 pl-9 outline-none focus:border-indigo-500 transition-colors"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
          </div>

          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#121622] border border-[#23293e] text-slate-300 hover:text-white text-xs font-sans font-medium transition-colors"
            title="Toggle Sort Order"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
            <span>{sortAsc ? "Oldest" : "Newest"}</span>
          </button>
        </div>
      </div>

      {/* 3. Chapter Ledger Rows */}
      <section className="space-y-2">
        {filteredChapters.slice(0, displayLimit).map((group) => {
          const chap = group.primary;
          const isRead = readingHistory.chapterId === chap.externalChapId;

          return (
            <Link
              key={chap.externalChapId}
              href={`/read/${chap.externalChapId}`}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 group ${
                isRead
                  ? "bg-indigo-950/20 border-indigo-500/40"
                  : "bg-[#121622] border-[#23293e] hover:border-indigo-500/50 hover:bg-[#161c2c]"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-xs font-semibold text-indigo-400 w-16">
                  CH. {group.chapterNumber}
                </span>

                <div className="min-w-0">
                  <h4 className="font-sans text-sm font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors truncate">
                    {chap.title || `Chapter ${group.chapterNumber}`}
                  </h4>
                  <p className="font-sans text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{chap.scanlator || "Community Stream"}</span>
                    {group.alternatives && group.alternatives.length > 0 && (
                      <span className="text-[10px] font-mono text-emerald-400">
                        • {group.alternatives.length + 1} mirrors available
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {isRead && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hidden sm:inline">
                    READ
                  </span>
                )}
                <span className="text-xs font-sans font-semibold text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                  Read →
                </span>
              </div>
            </Link>
          );
        })}

        {filteredChapters.length > displayLimit && (
          <div className="pt-4 text-center">
            <button
              onClick={() => setDisplayLimit((prev) => prev + 60)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#121622] border border-[#23293e] hover:border-indigo-500 text-slate-200 text-xs font-sans font-semibold transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
              Load More Chapters ({filteredChapters.length - displayLimit} remaining)
            </button>
          </div>
        )}

        {filteredChapters.length === 0 && (
          <div className="text-center py-12 bg-[#121622] rounded-2xl border border-[#23293e]">
            <p className="font-sans text-xs text-slate-400">
              No chapters matched &quot;{chapterSearch}&quot;.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
