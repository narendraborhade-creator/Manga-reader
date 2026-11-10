"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { searchManga } from "@/lib/api-client";
import { MangaDexManga } from "@/lib/adapters/mangadex";
import { MangaCard } from "@/components/hud/MangaCard";
import { CyberGadaLoader } from "@/components/hud/CyberGadaLoader";
import { Search, Filter, Compass, Sparkles, Flame, Trophy, Zap, Layers, X } from "lucide-react";

const GENRES = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Horror",
  "Isekai",
  "Martial Arts",
  "Mystery",
  "Psychological",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Supernatural",
];

const PRESETS = [
  { id: "all", label: "All Series", icon: Sparkles },
  { id: "manhwa", label: "Manhwa & Webtoons", icon: Compass },
  { id: "trending", label: "Trending", icon: Flame },
  { id: "shonen", label: "Shonen & Action", icon: Zap },
  { id: "top", label: "Top Rated", icon: Trophy },
];

const SOURCES = [
  { id: "all", label: "All Sources (Unified)" },
  { id: "mangakatana", label: "MangaKatana (High Coverage)" },
  { id: "asura", label: "Asura Scans (Manhwa)" },
  { id: "weebcentral", label: "WeebCentral" },
  { id: "mangapill", label: "MangaPill" },
  { id: "mangadex", label: "MangaDex" },
];

function ExploreContent() {
  const searchParams = useSearchParams();
  const qParam = searchParams.get("q") || "";
  const sourceParam = searchParams.get("source") || "all";
  const genreParam = searchParams.get("genre") || null;

  const [query, setQuery] = useState(qParam);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(genreParam);
  const [selectedPreset, setSelectedPreset] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<string>(sourceParam);
  const [results, setResults] = useState<MangaDexManga[]>([]);
  const [loading, setLoading] = useState(true);

  const executeSearch = (
    q: string,
    genre: string | null,
    preset = selectedPreset,
    source = selectedSource
  ) => {
    setLoading(true);
    let term = q.replace(/[’‘`]/g, "'").trim();
    if (!term && preset === "manhwa") term = "Solo Leveling";
    if (!term && preset === "shonen") term = "Chainsaw Man";
    if (!term && preset === "top") term = "Berserk";
    if (!term && preset === "trending") term = "Jujutsu Kaisen";

    const effectiveQuery = [term, genre || ""].filter(Boolean).join(" ");
    searchManga(effectiveQuery, 36, source)
      .then((items) => {
        setResults(items);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    setQuery(qParam);
    if (genreParam) setSelectedGenre(genreParam);
    executeSearch(qParam, genreParam || selectedGenre, selectedPreset, sourceParam);
  }, [qParam, sourceParam, genreParam]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query, selectedGenre, selectedPreset, selectedSource);
  };

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    executeSearch(query, selectedGenre, preset, selectedSource);
  };

  const handleGenreToggle = (genre: string) => {
    const next = selectedGenre === genre ? null : genre;
    setSelectedGenre(next);
    executeSearch(query, next, selectedPreset, selectedSource);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="space-y-2 pb-4 border-b border-[#20273a]">
        <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs uppercase tracking-wider font-semibold">
          <Compass className="w-4 h-4" />
          Mangayomi Discovery Hub
        </div>
        <h1 className="font-sans text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          Browse & Discover Manga
        </h1>
        <p className="font-sans text-sm text-slate-400 max-w-xl">
          Search thousands of manga, manhwa, and comics with verified chapter archives starting from Chapter 1. Read directly inside the app with zero ads or external redirects.
        </p>
      </div>

      {/* Search & Filter Controls */}
      <div className="space-y-5 bg-[#121622] p-5 sm:p-6 rounded-2xl border border-[#23293e] shadow-lg">
        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search manga by title (e.g. Solo Leveling, One Piece, Berserk)..."
            className="w-full bg-[#0b0e14] border border-[#23293e] text-sm font-sans text-slate-100 rounded-xl px-4 py-3 pl-11 pr-28 outline-none focus:border-indigo-500 transition-all placeholder:text-slate-500"
          />
          <Search className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                executeSearch("", selectedGenre, selectedPreset, selectedSource);
              }}
              className="absolute right-24 top-3 text-slate-500 hover:text-slate-300 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="submit"
            className="absolute right-2 top-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-sans font-semibold text-xs rounded-lg transition-all shadow-md shadow-indigo-600/20"
          >
            Search
          </button>
        </form>

        {/* Category Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#1e2538]">
          <span className="font-sans text-xs text-slate-400 font-medium mr-1">
            Category:
          </span>
          {PRESETS.map((p) => {
            const Icon = p.icon;
            const active = selectedPreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePresetChange(p.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-all ${
                  active
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "bg-[#0b0e14] border border-[#23293e] text-slate-400 hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Source Switcher */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#1e2538]">
          <span className="font-sans text-xs text-slate-400 font-medium mr-1">
            Source:
          </span>
          {SOURCES.map((s) => {
            const active = selectedSource === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSelectedSource(s.id);
                  executeSearch(query, selectedGenre, selectedPreset, s.id);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-all ${
                  active
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 font-semibold"
                    : "bg-[#0b0e14] border border-[#23293e] text-slate-400 hover:text-white"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Genre Filters */}
        <div className="space-y-2 pt-2 border-t border-[#1e2538]">
          <div className="flex items-center gap-2 text-xs font-sans text-slate-400 font-medium">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <span>Filter by Genre:</span>
            {selectedGenre && (
              <button
                onClick={() => handleGenreToggle(selectedGenre)}
                className="ml-auto text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
              >
                Clear filter ({selectedGenre})
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {GENRES.map((g) => {
              const active = selectedGenre === g;
              return (
                <button
                  key={g}
                  onClick={() => handleGenreToggle(g)}
                  className={`px-3 py-1 rounded-lg text-xs font-sans font-medium transition-all ${
                    active
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold"
                      : "bg-[#0b0e14] border border-[#23293e] text-slate-400 hover:text-white hover:border-slate-600"
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-sans text-slate-400">
          <span>{results.length} series found</span>
          <span className="text-indigo-400 font-mono">100% IN-APP STREAM</span>
        </div>

        {loading ? (
          <div className="py-24">
            <CyberGadaLoader
              size="md"
              text="Searching manga archives..."
              subtext="Querying active repositories"
            />
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {results.map((m) => (
              <MangaCard
                key={m.id}
                id={m.id}
                title={m.title}
                coverUrl={m.coverUrl}
                status={m.status}
                genres={m.tags}
                latestChapter={(m as any).totalChapters || undefined}
                score={(m as any).score}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-[#121622] rounded-2xl border border-[#23293e] p-8">
            <Layers className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="font-sans text-lg text-white font-bold">
              No Manga Found
            </h3>
            <p className="font-sans text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              We couldn&apos;t find any titles matching your query. Try searching for a broader term or resetting active genre filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="py-24">
          <CyberGadaLoader
            size="md"
            text="Initializing browse catalog..."
            subtext="Connecting to repository feed"
          />
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}
