"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getExtensionsCatalog, searchManga } from "@/lib/api-client";
import { MangaDexManga } from "@/lib/adapters/mangadex";
import { KeiyoushiExtension } from "@/lib/adapters/keiyoushi-parser";
import { YantraCard } from "@/components/hud/YantraCard";
import { CyberGadaLoader } from "@/components/hud/CyberGadaLoader";
import {
  Cpu,
  Search,
  CheckCircle2,
  ArrowRight,
  Zap,
  BookOpen,
  Layers,
  Sparkles,
  Loader2,
} from "lucide-react";

const CORE_ENGINES = [
  {
    id: "allmanga",
    name: "AllManga & Manhwa Engine",
    lang: "EN",
    status: "100% ACTIVE & INTEGRATED",
    description: "Massive library of Korean manhwa, otome isekai, and webtoons with full 30-100+ chapter archives. Automatic chapter comparison.",
    category: "Korean Manhwa, Webtoons & Global Manga",
  },
  {
    id: "mangadex",
    name: "MangaDex v5 Global Engine",
    lang: "MULTI",
    status: "100% ACTIVE & INTEGRATED",
    description: "Decentralized open-source manga database. Verified community scanlations with real-time updates and clean English titles.",
    category: "Global Community Scans",
  },
  {
    id: "mangapill",
    name: "MangaPill Reading Engine",
    lang: "EN",
    status: "100% ACTIVE & INTEGRATED",
    description: "High-speed English scanlation mirror with full archives starting from Chapter 1. Direct page streaming with zero external redirects.",
    category: "Action, Shonen, Seinen",
  },
  {
    id: "weebcentral",
    name: "WeebCentral HD CDN Engine",
    lang: "EN",
    status: "100% ACTIVE & INTEGRATED",
    description: "High-definition manga image stream with official digital color and Shonen Jump archives.",
    category: "HD Scans, Color Manga",
  },
];

export default function ExtensionsPage() {
  const router = useRouter();
  const [catalog, setCatalog] = useState<KeiyoushiExtension[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  // In-page search console
  const [selectedEngine, setSelectedEngine] = useState<string>("all");
  const [consoleQuery, setConsoleQuery] = useState("");
  const [consoleResults, setConsoleResults] = useState<MangaDexManga[]>([]);
  const [isSearchingConsole, setIsSearchingConsole] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Extended catalog search filter
  const [catalogSearch, setCatalogSearch] = useState("");

  useEffect(() => {
    getExtensionsCatalog()
      .then((data) => {
        setCatalog(data);
      })
      .finally(() => {
        setLoadingCatalog(false);
      });
  }, []);

  const handleConsoleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = consoleQuery.replace(/[’‘`]/g, "'").trim();
    if (!q) return;

    setIsSearchingConsole(true);
    setHasSearched(true);
    try {
      const results = await searchManga(q, 24, selectedEngine);
      setConsoleResults(results);
    } catch (err) {
      console.error("Console search error:", err);
      setConsoleResults([]);
    } finally {
      setIsSearchingConsole(false);
    }
  };

  const filteredExtensions = catalog.filter((ext) => {
    const q = catalogSearch.toLowerCase();
    return (
      ext.name.toLowerCase().includes(q) ||
      ext.pkg.toLowerCase().includes(q) ||
      ext.sources.some((s) => s.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-10 pb-16">
      {/* Header */}
      <div className="space-y-2 pb-4 border-b border-sanctum-border">
        <div className="flex items-center gap-2 text-gada-bright font-mono text-xs uppercase tracking-widest">
          <Layers className="w-4 h-4 text-gada" />
          INTEGRATED ENGINE HUB // MIHON & KEIYOUSHI EXTENSIONS
        </div>
        <h1 className="font-mythic text-2xl sm:text-4xl font-bold text-ashram">
          In-App Reading Engines
        </h1>
        <p className="font-hud text-sm text-ashram-muted max-w-2xl">
          All top Mihon and Keiyoushi source engines are integrated natively into the website. No APKs, no GitHub downloads, and no external redirects. Everything searches, compares chapter counts, and streams directly inside the built-in reader.
        </p>
      </div>

      {/* Interactive Multi-Source Search Console */}
      <section className="space-y-4 bg-sanctum/90 p-6 rounded-sm border border-gada/30 shadow-gada-gold">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gada" />
            <h2 className="font-hud uppercase text-lg font-bold text-ashram tracking-wider">
              NATIVE MULTI-SOURCE SEARCH CONSOLE
            </h2>
          </div>
          <span className="font-mono text-[10px] text-prana uppercase tracking-wider hidden sm:inline">
            ZERO EXTERNAL REDIRECTS // 100% IN-APP
          </span>
        </div>

        <form onSubmit={handleConsoleSearch} className="space-y-3">
          {/* Source Engine Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-ashram-muted uppercase mr-1">
              SEARCH SOURCE:
            </span>
            {[
              { id: "all", label: "All Sources Unified" },
              { id: "allmanga", label: "AllManga (Manhwa 30+ CH)" },
              { id: "mangadex", label: "MangaDex v5" },
              { id: "mangapill", label: "MangaPill" },
              { id: "weebcentral", label: "WeebCentral HD" },
            ].map((eng) => (
              <button
                key={eng.id}
                type="button"
                onClick={() => setSelectedEngine(eng.id)}
                className={`px-3 py-1 rounded text-xs font-mono font-bold uppercase transition-all ${
                  selectedEngine === eng.id
                    ? "bg-sindoor text-white shadow-sindoor-neon border border-sindoor-glow"
                    : "bg-void border border-sanctum-border text-ashram-muted hover:text-ashram"
                }`}
              >
                {eng.label}
              </button>
            ))}
          </div>

          {/* Search Input Bar */}
          <div className="relative flex items-center">
            <input
              type="text"
              value={consoleQuery}
              onChange={(e) => setConsoleQuery(e.target.value)}
              placeholder="Search any series (e.g. How to Ride the Hero's Coattails, Solo Leveling, One Piece)..."
              className="w-full bg-void border border-sanctum-border text-sm font-mono text-ashram rounded px-4 py-3 pl-11 pr-28 outline-none focus:border-gada transition-all"
            />
            <Search className="w-5 h-5 text-ashram-muted absolute left-3.5 pointer-events-none" />
            <button
              type="submit"
              disabled={isSearchingConsole}
              className="absolute right-2 px-5 py-2 bg-gada text-void hover:bg-gada-bright font-hud font-bold text-xs uppercase tracking-wider rounded transition-all shadow-gada-gold flex items-center gap-1.5"
            >
              {isSearchingConsole ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>SCANNING</span>
                </>
              ) : (
                <span>SEARCH</span>
              )}
            </button>
          </div>
        </form>

        {/* Live Search Results */}
        {hasSearched && (
          <div className="pt-4 border-t border-sanctum-border/60 space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-ashram-muted">
              <span>FOUND {consoleResults.length} RESULTS</span>
              <span className="text-gada-bright">COMPARISON ENGINE ACTIVE</span>
            </div>

            {isSearchingConsole ? (
              <div className="py-12">
                <CyberGadaLoader
                  size="sm"
                  text="ॐ SCANNING SOURCES..."
                  subtext="AGGREGATING FULL CHAPTER LISTINGS"
                />
              </div>
            ) : consoleResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {consoleResults.map((manga) => (
                  <Link
                    key={manga.id}
                    href={`/manga/${manga.id}`}
                    className="p-3 bg-void/90 border border-sanctum-border hover:border-gada rounded flex gap-3 group transition-all"
                  >
                    <div className="w-16 h-22 bg-sanctum flex-shrink-0 rounded overflow-hidden relative">
                      {manga.coverUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={
                            manga.coverUrl.includes("uploads.mangadex.org") ||
                            manga.coverUrl.includes("anilist.co")
                              ? manga.coverUrl
                              : `/api/proxy/image?url=${encodeURIComponent(manga.coverUrl)}`
                          }
                          alt={manga.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-mythic text-gada text-sm">
                          ॐ
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h4 className="font-hud font-bold text-xs text-ashram group-hover:text-gada-bright truncate leading-tight">
                          {manga.title}
                        </h4>
                        {(manga as any).totalChapters ? (
                          <div className="flex items-center gap-1 font-mono text-[10px] text-prana mt-1 font-bold">
                            <BookOpen className="w-3 h-3" />
                            <span>{(manga as any).totalChapters} CHAPTERS</span>
                          </div>
                        ) : null}
                      </div>
                      <span className="font-hud text-[10px] text-sindoor font-bold uppercase tracking-wider flex items-center gap-1">
                        <span>OPEN CHAPTERS</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-ashram-muted font-mono text-xs">
                No matching series found for this query in the selected engine. Try "All Sources Unified" or check the title spelling.
              </div>
            )}
          </div>
        )}
      </section>

      {/* Core Built-in Engines Deck */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-sindoor" />
          <h2 className="font-hud uppercase text-lg font-bold text-ashram tracking-wider">
            INTEGRATED READING ENGINES
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CORE_ENGINES.map((engine) => (
            <YantraCard
              key={engine.name}
              glowColor="sindoor"
              className="p-5 bg-sanctum/90 border border-sanctum-border hover:border-sindoor/60 transition-all"
            >
              <div className="flex flex-col justify-between h-full space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-sindoor" />
                      <h3 className="font-hud font-bold text-base text-ashram">
                        {engine.name}
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-prana/20 text-prana border border-prana/40 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-prana" />
                      {engine.status}
                    </span>
                  </div>

                  <p className="font-hud text-xs text-ashram-muted leading-relaxed">
                    {engine.description}
                  </p>

                  <div className="font-mono text-[10px] text-ashram-muted/80">
                    Category: <span className="text-gada-bright">{engine.category}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-sanctum-border/60 flex items-center justify-between">
                  <span className="font-mono text-[10px] text-prana">
                    NATIVE WEB STREAM // NO APK NEEDED
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEngine(engine.id);
                      window.scrollTo({ top: 120, behavior: "smooth" });
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-sindoor hover:bg-sindoor-glow text-white font-hud font-bold uppercase text-xs rounded transition-all shadow-sindoor-neon"
                  >
                    <span>SEARCH THIS ENGINE</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </YantraCard>
          ))}
        </div>
      </section>

      {/* Keiyoushi Extended Catalog */}
      <section className="space-y-4 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-sanctum-border">
          <div className="space-y-0.5">
            <h2 className="font-hud uppercase text-lg font-bold text-ashram tracking-wider">
              EXTENDED MIHON / KEIYOUSHI INDEX ({catalog.length} SOURCES)
            </h2>
            <p className="font-mono text-xs text-ashram-muted">
              Discover extensions and search across all supported sources directly in the reader.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              placeholder="FILTER EXTENSION CATALOG..."
              className="w-full bg-void border border-sanctum-border text-xs font-mono text-ashram rounded px-3 py-2 pl-9 outline-none focus:border-gada"
            />
            <Search className="w-3.5 h-3.5 text-ashram-muted absolute left-3 top-2.5 pointer-events-none" />
          </div>
        </div>

        {loadingCatalog ? (
          <div className="py-20">
            <CyberGadaLoader
              size="md"
              text="ॐ CONNECTING TO DECENTRALIZED CATALOG..."
              subtext="SYNCHRONIZING REPOSITORIES"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExtensions.slice(0, 36).map((ext) => (
              <YantraCard
                key={ext.pkg}
                glowColor="gada"
                className="p-4 bg-sanctum/85 hover:border-gada/50 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-hud font-bold text-sm text-ashram">
                        {ext.name}
                      </h3>
                      <div className="font-mono text-[10px] text-ashram-muted truncate">
                        {ext.sources.map((s) => s.name).join(", ") || "General Manga"}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-gada/20 text-gada-bright border border-gada/40">
                      {ext.lang}
                    </span>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-sanctum-border/60 flex items-center justify-between">
                  <span className="font-mono text-[10px] text-prana">
                    NATIVE IN-APP
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setConsoleQuery(ext.name.replace(/Extension|Manga|Source/gi, "").trim());
                      setSelectedEngine("all");
                      window.scrollTo({ top: 120, behavior: "smooth" });
                      handleConsoleSearch();
                    }}
                    className="px-3 py-1 bg-gada/20 text-gada-bright hover:bg-gada hover:text-void font-hud text-[11px] font-bold uppercase rounded transition-all shadow-gada-gold flex items-center gap-1"
                  >
                    <span>SEARCH MANGA</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </YantraCard>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
