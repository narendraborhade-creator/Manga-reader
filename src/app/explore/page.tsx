"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { searchManga } from "@/lib/api-client";
import { MangaDexManga } from "@/lib/adapters/mangadex";
import { MangaCard } from "@/components/hud/MangaCard";
import { CyberGadaLoader } from "@/components/hud/CyberGadaLoader";
import { Search, Filter, Compass, Sparkles, Flame, Trophy, Zap } from "lucide-react";

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
  { id: "all", label: "All Manga", icon: Sparkles },
  { id: "manhwa", label: "Manhwa & Webtoons", icon: Compass },
  { id: "trending", label: "Trending", icon: Flame },
  { id: "shonen", label: "Shonen & Action", icon: Zap },
  { id: "top", label: "Top Rated", icon: Trophy },
];

const SOURCES = [
  { id: "all", label: "Unified Codex (All Sources)" },
  { id: "asura", label: "Asura Scans (Manhwa HD)" },
  { id: "mangapill", label: "MangaPill Mirror" },
  { id: "allmanga", label: "AllManga Stream" },
  { id: "mangadex", label: "MangaDex v5" },
];

function ExploreContent() {
  const searchParams = useSearchParams();
  const qParam = searchParams.get("q") || "";
  const sourceParam = searchParams.get("source") || "all";

  const [query, setQuery] = useState(qParam);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
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
    if (!term && preset === "manhwa") term = "Solo Leveling Flower Path Tower of God";
    if (!term && preset === "shonen") term = "Shonen Action";
    if (!term && preset === "top") term = "Berserk One Piece";
    if (!term && preset === "trending") term = "Chainsaw Man Jujutsu Kaisen";

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
    executeSearch(qParam, selectedGenre, selectedPreset, sourceParam);
  }, [qParam, sourceParam]);

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
    executeSearch(query, next, selectedPreset);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="space-y-2 pb-4 border-b border-sanctum-border">
        <div className="flex items-center gap-2 text-gada-bright font-mono text-xs uppercase tracking-widest">
          <Compass className="w-4 h-4 text-gada" />
          VAJRA CODEX ARCHIVE // UNIFIED MANGA SEARCH
        </div>
        <h1 className="font-mythic text-2xl sm:text-4xl font-bold text-ashram">
          Explore All Manga
        </h1>
        <p className="font-hud text-sm text-ashram-muted max-w-xl">
          Search thousands of manga titles with full chapter archives starting from Chapter 1. Read directly inside the app with zero external redirects.
        </p>
      </div>

      {/* Search Bar & Filters */}
      <div className="space-y-4 bg-sanctum/85 p-6 rounded-sm border border-sanctum-border">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search manga by title (e.g. One Piece, Berserk, Solo Leveling)..."
            className="w-full bg-void border border-sanctum-border text-sm font-mono text-ashram rounded px-4 py-3 pl-11 pr-24 outline-none focus:border-gada transition-all"
          />
          <Search className="w-5 h-5 text-ashram-muted absolute left-3.5 top-3.5 pointer-events-none" />
          <button
            type="submit"
            className="absolute right-2 top-2 px-5 py-2 bg-sindoor hover:bg-sindoor-glow text-white font-hud font-bold text-xs uppercase tracking-wider rounded transition-all shadow-sindoor-neon"
          >
            SEARCH
          </button>
        </form>

        {/* Category Preset Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-sanctum-border/60">
          <span className="font-mono text-xs text-ashram-muted uppercase mr-1">
            CATEGORY:
          </span>
          {PRESETS.map((p) => {
            const Icon = p.icon;
            const active = selectedPreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePresetChange(p.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-bold uppercase transition-all ${
                  active
                    ? "bg-sindoor text-white shadow-sindoor-neon border border-sindoor-glow"
                    : "bg-void border border-sanctum-border text-ashram-muted hover:text-ashram"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Source Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-sanctum-border/60">
          <span className="font-mono text-xs text-ashram-muted uppercase mr-1">
            SOURCE:
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
                className={`px-3 py-1 rounded text-xs font-mono font-bold uppercase transition-all ${
                  active
                    ? "bg-prana text-void shadow-prana-cyan font-bold"
                    : "bg-void border border-sanctum-border text-ashram-muted hover:text-ashram"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Genre Filter Chips */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-ashram-muted uppercase">
            <Filter className="w-3.5 h-3.5 text-gada" />
            <span>Filter By Genre:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((g) => {
              const active = selectedGenre === g;
              return (
                <button
                  key={g}
                  onClick={() => handleGenreToggle(g)}
                  className={`px-3 py-1 rounded text-xs font-hud font-semibold uppercase tracking-wider transition-all ${
                    active
                      ? "bg-gada text-void font-bold shadow-gada-gold border border-gada-bright"
                      : "bg-void border border-sanctum-border text-ashram-muted hover:text-ashram hover:border-sanctum-border"
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
        <div className="flex items-center justify-between text-xs font-mono text-ashram-muted">
          <span>RESULTS: {results.length} TITLES FOUND</span>
          <span className="text-gada-bright">VAJRA UNIFIED ARCHIVE // 100% READABLE</span>
        </div>

        {loading ? (
          <div className="py-20">
            <CyberGadaLoader
              size="md"
              text="ॐ SEARCHING MANGA ARCHIVES..."
              subtext="GATHERING VERIFIED CHAPTER STREAMS"
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
                latestChapter={(m as any).totalChapters ? `CH. ${(m as any).totalChapters}` : undefined}
                score={(m as any).score}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-sanctum/60 rounded border border-sanctum-border">
            <Sparkles className="w-8 h-8 text-gada mx-auto mb-2 opacity-50" />
            <h3 className="font-hud uppercase text-lg text-ashram font-bold">
              No Manga Found
            </h3>
            <p className="font-mono text-xs text-ashram-muted mt-1">
              Try a different search title or clear active genre filters.
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
        <div className="py-20">
          <CyberGadaLoader
            size="md"
            text="ॐ INITIALIZING EXPLORE MATRIX..."
            subtext="CONNECTING TO SACRED CODEX"
          />
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}
