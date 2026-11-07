"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { searchManga } from "@/lib/api-client";
import { MangaDexManga } from "@/lib/adapters/mangadex";
import { MangaCard } from "@/components/hud/MangaCard";
import { CyberGadaLoader } from "@/components/hud/CyberGadaLoader";
import { Search, Filter, Compass, Sparkles } from "lucide-react";

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

function ExploreContent() {
  const searchParams = useSearchParams();
  const qParam = searchParams.get("q") || "";

  const [query, setQuery] = useState(qParam);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [results, setResults] = useState<MangaDexManga[]>([]);
  const [loading, setLoading] = useState(true);

  const executeSearch = (q: string, genre: string | null, src = selectedSource) => {
    setLoading(true);
    const effectiveQuery = [q.trim(), genre || ""].filter(Boolean).join(" ");
    searchManga(effectiveQuery, 36, src)
      .then((items) => {
        setResults(items);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    setQuery(qParam);
    executeSearch(qParam, selectedGenre, selectedSource);
  }, [qParam]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query, selectedGenre, selectedSource);
  };

  const handleSourceChange = (src: string) => {
    setSelectedSource(src);
    executeSearch(query, selectedGenre, src);
  };

  const handleGenreToggle = (genre: string) => {
    const next = selectedGenre === genre ? null : genre;
    setSelectedGenre(next);
    executeSearch(query, next, selectedSource);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="space-y-2 pb-4 border-b border-sanctum-border">
        <div className="flex items-center gap-2 text-gada-bright font-mono text-xs uppercase tracking-widest">
          <Compass className="w-4 h-4 text-gada" />
          VAJRA CODEX ARCHIVE // DEEP EXPLORATION
        </div>
        <h1 className="font-mythic text-2xl sm:text-4xl font-bold text-ashram">
          Explore Sacred Manga Scrolls
        </h1>
        <p className="font-hud text-sm text-ashram-muted max-w-xl">
          Search across thousands of titles cataloged in MangaDex v5 and connected
          extension repositories with real-time metadata.
        </p>
      </div>

      {/* Search Bar & Filters */}
      <div className="space-y-4 bg-sanctum/85 p-6 rounded-sm border border-sanctum-border">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search manga by title, author, or keyword (e.g. Solo Leveling, Berserk)..."
            className="w-full bg-void border border-sanctum-border text-sm font-mono text-ashram rounded px-4 py-3 pl-11 outline-none focus:border-gada transition-all"
          />
          <Search className="w-5 h-5 text-ashram-muted absolute left-3.5 top-3.5 pointer-events-none" />
          <button
            type="submit"
            className="absolute right-2 top-2 px-4 py-1.5 bg-sindoor hover:bg-sindoor-glow text-white font-hud font-bold text-xs uppercase tracking-wider rounded transition-all shadow-sindoor-neon"
          >
            SEARCH
          </button>
        </form>

        {/* Source Selector */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-sanctum-border/60">
          <span className="font-mono text-xs text-ashram-muted uppercase mr-1">
            SOURCE:
          </span>
          {[
            { id: "all", label: "ALL SOURCES (RECOMMENDED)" },
            { id: "mangapill", label: "MANGAPILL (100% READABLE)" },
            { id: "weebcentral", label: "WEEBCENTRAL STREAM" },
            { id: "mangadex", label: "MANGADEX API v5" },
            { id: "allmanga", label: "ALLMANGA ARCHIVE" },
          ].map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSourceChange(s.id)}
              className={`px-3 py-1 rounded text-xs font-mono font-bold uppercase transition-all ${
                selectedSource === s.id
                  ? "bg-sindoor text-white shadow-sindoor-neon border border-sindoor-glow"
                  : "bg-void border border-sanctum-border text-ashram-muted hover:text-ashram"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Genre Filter Chips */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-ashram-muted uppercase">
            <Filter className="w-3.5 h-3.5 text-gada" />
            <span>Filter By Sacred Genre:</span>
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
          <span className="text-prana">MANGADEX API v5 VERIFIED</span>
        </div>

        {loading ? (
          <div className="py-20">
            <CyberGadaLoader
              size="md"
              text="ॐ SCANNING CODEX MATRIX..."
              subtext="FILTERING HIGH-PRECISION MANGA RESULTS"
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
                source={(m as any).source}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-sanctum/60 rounded border border-sanctum-border">
            <Sparkles className="w-8 h-8 text-gada mx-auto mb-2 opacity-50" />
            <h3 className="font-hud uppercase text-lg text-ashram font-bold">
              No Sacred Scrolls Found
            </h3>
            <p className="font-mono text-xs text-ashram-muted mt-1">
              Try a different search term or remove genre filters.
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
