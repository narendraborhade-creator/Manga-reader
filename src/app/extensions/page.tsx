"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getExtensionsCatalog,
  getAwesomeSourcesCatalog,
  searchManga,
  MangayomiExtension,
  AwesomeSourceItem,
} from "@/lib/api-client";
import { MangaDexManga } from "@/lib/adapters/mangadex";
import { MangaCard } from "@/components/hud/MangaCard";
import { CyberGadaLoader } from "@/components/hud/CyberGadaLoader";
import {
  Cpu,
  Search,
  ExternalLink,
  BookOpen,
  Layers,
  Sparkles,
  Loader2,
  Globe,
  ShieldCheck,
  Code2,
  Bookmark,
  Tv,
  CheckCircle,
  Database,
  Compass,
} from "lucide-react";

const CORE_ENGINES = [
  {
    id: "all",
    name: "Unified Multi-Source Engine",
    lang: "MULTI",
    status: "Active & Verified",
    description: "Queries all connected archives in parallel with automatic title deduplication and instant fallback.",
    badge: "Aggregator",
  },
  {
    id: "mangakatana",
    name: "MangaKatana Engine",
    lang: "EN",
    status: "Active & Verified",
    description: "High-coverage manga and manhwa engine with complete 100-250+ chapter sets and direct token streaming.",
    badge: "High Coverage",
  },
  {
    id: "asura",
    name: "Asura Scans Engine",
    lang: "EN",
    status: "Active & Verified",
    description: "The primary source for HD English manhwa releases including Solo Leveling, Swordmaster's Son, and Reaper.",
    badge: "Manhwa HD",
  },
  {
    id: "weebcentral",
    name: "WeebCentral Stream",
    lang: "EN",
    status: "Active & Verified",
    description: "High-speed English manga and digital color archive with complete chapter sets starting from Chapter 1.",
    badge: "High-Speed",
  },
  {
    id: "mangapill",
    name: "MangaPill Mirror",
    lang: "EN",
    status: "Active & Verified",
    description: "Direct clean image CDN for Shonen Jump, Kodansha, and weekly English scanlations with zero ads.",
    badge: "Clean Stream",
  },
  {
    id: "mangadex",
    name: "MangaDex v5 Global API",
    lang: "MULTI",
    status: "Active & Verified",
    description: "Official decentralized API supporting thousands of series, multiple languages, and community translations.",
    badge: "Official API",
  },
];

const LANG_TABS = [
  { id: "all", label: "All Languages" },
  { id: "en", label: "English (EN)" },
  { id: "es", label: "Spanish (ES)" },
  { id: "fr", label: "French (FR)" },
  { id: "id", label: "Indonesian (ID)" },
  { id: "pt", label: "Portuguese (PT)" },
  { id: "ja", label: "Japanese (JA)" },
];

const AWESOME_CATEGORIES = [
  { id: "all", label: "All Categories", icon: Globe },
  { id: "manga", label: "Manga Readers", icon: BookOpen },
  { id: "official", label: "Official Publishers", icon: ShieldCheck },
  { id: "database", label: "Databases & Trackers", icon: Database },
  { id: "anime", label: "Anime Streaming", icon: Tv },
  { id: "apps", label: "Apps & Ecosystem", icon: Layers },
];

export default function ExtensionsPage() {
  const router = useRouter();

  // Active Store Tab: "mangayomi" vs "awesome" vs "core"
  const [activeCatalogTab, setActiveCatalogTab] = useState<"mangayomi" | "awesome">("mangayomi");

  // Mangayomi Extensions state
  const [catalog, setCatalog] = useState<MangayomiExtension[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [activeLang, setActiveLang] = useState("all");

  // Awesome Anime Sources state
  const [awesomeSources, setAwesomeSources] = useState<AwesomeSourceItem[]>([]);
  const [loadingAwesome, setLoadingAwesome] = useState(true);
  const [awesomeCategory, setAwesomeCategory] = useState("all");
  const [awesomeSearch, setAwesomeSearch] = useState("");

  // In-page search console
  const [selectedEngine, setSelectedEngine] = useState<string>("all");
  const [consoleQuery, setConsoleQuery] = useState("");
  const [consoleResults, setConsoleResults] = useState<MangaDexManga[]>([]);
  const [isSearchingConsole, setIsSearchingConsole] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    getExtensionsCatalog()
      .then((data) => setCatalog(data))
      .finally(() => setLoadingCatalog(false));

    getAwesomeSourcesCatalog()
      .then((data) => setAwesomeSources(data))
      .finally(() => setLoadingAwesome(false));
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
    const matchesQuery =
      !catalogSearch ||
      ext.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      ext.baseUrl.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      ext.typeSource.toLowerCase().includes(catalogSearch.toLowerCase());

    const matchesLang =
      activeLang === "all" ||
      ext.lang.toLowerCase() === activeLang.toLowerCase();

    return matchesQuery && matchesLang;
  });

  const filteredAwesome = awesomeSources.filter((item) => {
    const matchesCategory =
      awesomeCategory === "all" || item.category === awesomeCategory;

    const q = awesomeSearch.toLowerCase().trim();
    const matchesQuery =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.tags.some((t) => t.toLowerCase().includes(q)) ||
      item.url.toLowerCase().includes(q);

    return matchesCategory && matchesQuery;
  });

  return (
    <div className="space-y-12 pb-16">
      {/* Header */}
      <div className="space-y-3 pb-4 border-b border-[#20273a]">
        <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs uppercase tracking-wider font-semibold">
          <Layers className="w-4 h-4" />
          Multi-Source Extension & Registry Hub
        </div>
        <h1 className="font-sans text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          Source Engines & Community Catalogs
        </h1>
        <p className="font-sans text-sm text-slate-400 max-w-2xl leading-relaxed">
          Powered by both the official{" "}
          <a
            href="https://github.com/kodjodevf/mangayomi"
            target="_blank"
            rel="noreferrer"
            className="text-indigo-400 underline hover:text-indigo-300 font-medium"
          >
            Mangayomi Extension Repository
          </a>{" "}
          and the community-curated{" "}
          <a
            href="https://github.com/anshumanv/awesome-anime-sources"
            target="_blank"
            rel="noreferrer"
            className="text-indigo-400 underline hover:text-indigo-300 font-medium"
          >
            Awesome Anime &amp; Manga Sources
          </a>{" "}
          registry.
        </p>
      </div>

      {/* 1. Core Built-In Engines */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-sans text-lg font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            Core In-App Streaming Engines
          </h2>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            5 Engines Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CORE_ENGINES.map((eng) => (
            <div
              key={eng.id}
              className="p-5 rounded-2xl bg-[#121622] border border-[#23293e] hover:border-indigo-500/50 flex flex-col justify-between space-y-4 transition-all duration-300 shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase font-semibold bg-indigo-600/20 text-indigo-300 border border-indigo-500/30">
                    {eng.badge}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {eng.status}
                  </span>
                </div>
                <h3 className="font-sans font-bold text-base text-white">
                  {eng.name}
                </h3>
                <p className="font-sans text-xs text-slate-400 mt-2 leading-relaxed">
                  {eng.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[#1e2538] flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-500">
                  LANG: {eng.lang}
                </span>
                <button
                  onClick={() => {
                    setSelectedEngine(eng.id);
                    setConsoleQuery("Solo Leveling");
                    searchManga("Solo Leveling", 12, eng.id).then((r) => {
                      setConsoleResults(r);
                      setHasSearched(true);
                    });
                  }}
                  className="text-xs font-sans font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  Test Query →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Interactive In-Page Query Console */}
      <section className="space-y-5 bg-[#121622] p-6 rounded-2xl border border-[#23293e] shadow-xl">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <div>
            <h2 className="font-sans text-base font-bold text-white">
              Live Source Query Sandbox
            </h2>
            <p className="font-sans text-xs text-slate-400">
              Directly query titles across specific source adapters to inspect availability
            </p>
          </div>
        </div>

        <form onSubmit={handleConsoleSearch} className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedEngine}
            onChange={(e) => setSelectedEngine(e.target.value)}
            className="bg-[#0b0e14] border border-[#23293e] text-xs font-sans text-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors sm:w-56"
          >
            <option value="all">Unified Codex (All)</option>
            <option value="asura">Asura Scans (Manhwa)</option>
            <option value="weebcentral">WeebCentral</option>
            <option value="mangapill">MangaPill</option>
            <option value="mangadex">MangaDex</option>
          </select>

          <div className="relative flex-1">
            <input
              type="text"
              value={consoleQuery}
              onChange={(e) => setConsoleQuery(e.target.value)}
              placeholder="Enter series title to test (e.g. Solo Leveling, Berserk, One Piece)..."
              className="w-full bg-[#0b0e14] border border-[#23293e] text-xs font-sans text-slate-100 rounded-xl px-4 py-2.5 pl-10 outline-none focus:border-indigo-500 transition-colors"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
          </div>

          <button
            type="submit"
            disabled={isSearchingConsole}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-sans font-semibold text-xs shadow-md shadow-indigo-600/25 transition-all"
          >
            {isSearchingConsole ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Querying...
              </>
            ) : (
              "Run Query"
            )}
          </button>
        </form>

        {/* Console Search Results */}
        {hasSearched && (
          <div className="pt-4 border-t border-[#1e2538] space-y-3">
            <div className="flex items-center justify-between text-xs font-sans text-slate-400">
              <span>{consoleResults.length} series resolved from engine</span>
              <span className="text-indigo-400 font-mono uppercase font-semibold">
                Engine: {selectedEngine}
              </span>
            </div>

            {consoleResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {consoleResults.map((manga) => (
                  <MangaCard
                    key={manga.id}
                    id={manga.id}
                    title={manga.title}
                    coverUrl={manga.coverUrl}
                    status={manga.status}
                    genres={manga.tags}
                    latestChapter={(manga as any).totalChapters || undefined}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-6">
                No titles matched this engine query. Try another keyword or switch source.
              </p>
            )}
          </div>
        )}
      </section>

      {/* 3. Catalog Selection Tabs: Mangayomi vs Awesome Anime Sources */}
      <section className="space-y-6">
        <div className="flex border-b border-[#20273a] gap-4">
          <button
            onClick={() => setActiveCatalogTab("mangayomi")}
            className={`pb-3 text-sm font-sans font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeCatalogTab === "mangayomi"
                ? "border-indigo-500 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Globe className="w-4 h-4 text-indigo-400" />
            Mangayomi Extensions ({catalog.length})
          </button>

          <button
            onClick={() => setActiveCatalogTab("awesome")}
            className={`pb-3 text-sm font-sans font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeCatalogTab === "awesome"
                ? "border-indigo-500 text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Awesome Anime &amp; Manga Sources ({awesomeSources.length})
          </button>
        </div>

        {/* Tab A: Mangayomi Extension Store */}
        {activeCatalogTab === "mangayomi" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-sans text-lg font-bold text-white">
                  Official Mangayomi Extensions Directory
                </h3>
                <p className="font-sans text-xs text-slate-400">
                  Dart extension scrapers synchronized from{" "}
                  <a
                    href="https://github.com/kodjodevf/mangayomi"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:underline"
                  >
                    kodjodevf/mangayomi
                  </a>
                </p>
              </div>

              {/* Catalog Search */}
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Filter 360+ extensions..."
                  className="w-full bg-[#121622] border border-[#23293e] text-xs font-sans text-slate-100 rounded-xl px-4 py-2 pl-9 outline-none focus:border-indigo-500 transition-colors"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Language Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
              {LANG_TABS.map((tab) => {
                const active = activeLang === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveLang(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-sans font-medium whitespace-nowrap transition-all ${
                      active
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "bg-[#121622] border border-[#23293e] text-slate-400 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Catalog Grid */}
            {loadingCatalog ? (
              <div className="py-20">
                <CyberGadaLoader
                  size="md"
                  text="Loading Mangayomi Extension Directory..."
                  subtext="Fetching 360+ extension repositories"
                />
              </div>
            ) : filteredExtensions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredExtensions.map((ext) => (
                  <div
                    key={ext.id}
                    className="p-4 rounded-xl bg-[#121622] border border-[#23293e] hover:border-indigo-500/40 flex flex-col justify-between space-y-3 transition-all duration-300 shadow-md group"
                  >
                    <div className="flex items-start gap-3">
                      {/* Extension Icon */}
                      <div className="w-10 h-10 rounded-lg bg-[#0b0e14] border border-[#23293e] overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {ext.iconUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={`/api/proxy/image?url=${encodeURIComponent(ext.iconUrl)}`}
                            alt={ext.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <BookOpen className="w-5 h-5 text-indigo-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-sans font-bold text-sm text-slate-100 truncate group-hover:text-indigo-400 transition-colors">
                          {ext.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold bg-[#0b0e14] text-indigo-400 border border-[#23293e]">
                            {ext.lang.toUpperCase()}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            v{ext.version}
                          </span>
                          {ext.isNsfw && (
                            <span className="px-1 py-0.5 rounded text-[9px] font-mono uppercase bg-rose-500/10 text-rose-400 border border-rose-500/30">
                              18+
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#1e2538] flex items-center justify-between text-xs">
                      <span className="font-mono text-[10px] text-slate-500 uppercase">
                        TYPE: {ext.typeSource}
                      </span>

                      <div className="flex items-center gap-2">
                        {ext.sourceCodeUrl && (
                          <a
                            href={ext.sourceCodeUrl}
                            target="_blank"
                            rel="noreferrer"
                            title="View Dart Source on GitHub"
                            className="text-slate-500 hover:text-slate-300 transition-colors p-1"
                          >
                            <Code2 className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <Link
                          href={`/explore?q=${encodeURIComponent(ext.name.split(" ")[0])}`}
                          className="text-xs font-sans font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                        >
                          Browse →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-[#121622] rounded-2xl border border-[#23293e]">
                <p className="text-sm font-sans text-slate-400">
                  No extensions match &quot;{catalogSearch}&quot; for language &quot;{activeLang}&quot;.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab B: Awesome Anime & Manga Sources Registry */}
        {activeCatalogTab === "awesome" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-sans text-lg font-bold text-white flex items-center gap-2">
                  <span>Awesome Anime &amp; Manga Sources Directory</span>
                  <a
                    href="https://github.com/anshumanv/awesome-anime-sources"
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 text-slate-400 hover:text-white"
                    title="View GitHub Repository"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </h3>
                <p className="font-sans text-xs text-slate-400">
                  Curated registry of streaming sites, readers, tracking databases, and legal portals from{" "}
                  <a
                    href="https://github.com/anshumanv/awesome-anime-sources"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:underline"
                  >
                    anshumanv/awesome-anime-sources
                  </a>
                </p>
              </div>

              {/* Awesome Search */}
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  value={awesomeSearch}
                  onChange={(e) => setAwesomeSearch(e.target.value)}
                  placeholder="Search awesome sources..."
                  className="w-full bg-[#121622] border border-[#23293e] text-xs font-sans text-slate-100 rounded-xl px-4 py-2 pl-9 outline-none focus:border-indigo-500 transition-colors"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {AWESOME_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const active = awesomeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setAwesomeCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-medium whitespace-nowrap transition-all ${
                      active
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "bg-[#121622] border border-[#23293e] text-slate-400 hover:text-white"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Awesome Sources Grid */}
            {loadingAwesome ? (
              <div className="py-20">
                <CyberGadaLoader
                  size="md"
                  text="Loading Awesome Sources Directory..."
                  subtext="Parsing anshumanv/awesome-anime-sources"
                />
              </div>
            ) : filteredAwesome.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAwesome.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl bg-[#121622] border border-[#23293e] hover:border-indigo-500/50 flex flex-col justify-between space-y-4 transition-all duration-300 shadow-lg group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase font-semibold bg-indigo-600/20 text-indigo-300 border border-indigo-500/30">
                          {item.categoryLabel}
                        </span>

                        {item.inAppSupported ? (
                          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-semibold">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Integrated In-App
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-500">
                            External Mirror
                          </span>
                        )}
                      </div>

                      <h4 className="font-sans font-bold text-base text-white group-hover:text-indigo-400 transition-colors">
                        {item.name}
                      </h4>

                      <p className="font-sans text-xs text-slate-400 mt-2 leading-relaxed">
                        {item.description}
                      </p>

                      {/* Tags */}
                      {item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {item.tags.map((t) => (
                            <span
                              key={t}
                              className="px-2 py-0.5 rounded-md text-[10px] font-sans bg-[#0b0e14] border border-[#23293e] text-slate-400"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[#1e2538] flex items-center justify-between text-xs">
                      {item.inAppSupported ? (
                        <Link
                          href={`/explore?source=${item.id}`}
                          className="text-xs font-sans font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                        >
                          <Compass className="w-3.5 h-3.5" />
                          Query in Reader →
                        </Link>
                      ) : (
                        <span className="text-slate-500 text-[11px] font-mono">
                          Directory Entry
                        </span>
                      )}

                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-white flex items-center gap-1 font-sans text-xs transition-colors"
                      >
                        Visit Website
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-[#121622] rounded-2xl border border-[#23293e]">
                <p className="text-sm font-sans text-slate-400">
                  No sources match &quot;{awesomeSearch}&quot; in category &quot;{awesomeCategory}&quot;.
                </p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
