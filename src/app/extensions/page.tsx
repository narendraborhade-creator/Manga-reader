"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getExtensionsCatalog } from "@/lib/api-client";
import { KeiyoushiExtension } from "@/lib/adapters/keiyoushi-parser";
import { YantraCard } from "@/components/hud/YantraCard";
import { CyberGadaLoader } from "@/components/hud/CyberGadaLoader";
import {
  Cpu,
  Search,
  Globe,
  Shield,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  Zap,
  BookOpen,
  Layers,
} from "lucide-react";

const FEATURED_MIHON_SOURCES = [
  {
    name: "MangaPill",
    pkg: "eu.kanade.tachiyomi.extension.en.mangapill",
    lang: "EN",
    version: "1.4.2",
    description: "Mihon's #1 high-speed English scanlation repository. 100% full readable chapters starting from Chapter 1 with zero missing early chapters.",
    sourceKey: "mangapill",
    color: "sindoor",
    badge: "100% READABLE // NATIVE WEB STREAM",
  },
  {
    name: "MangaSee / WeebCentral",
    pkg: "eu.kanade.tachiyomi.extension.en.mangasee",
    lang: "EN",
    version: "1.4.38",
    description: "Official MangaSee and MangaLife high-definition image stream CDN. Comprehensive Shonen Jump and Seinen archives.",
    sourceKey: "weebcentral",
    color: "cyan-400",
    badge: "HIGH-RES SCANS // NATIVE STREAM",
  },
  {
    name: "MangaDex (Official)",
    pkg: "eu.kanade.tachiyomi.extension.all.mangadex",
    lang: "MULTI",
    version: "2.5.0",
    description: "Decentralized open-source manga database. Verified community scanlators and real-time latest releases.",
    sourceKey: "mangadex",
    color: "prana",
    badge: "COMMUNITY VERIFIED // REST v5",
  },
  {
    name: "AllManga Engine",
    pkg: "eu.kanade.tachiyomi.extension.all.allanime",
    lang: "MULTI",
    version: "2.1.1",
    description: "Broad multi-scanlator archive indexed via GraphQL endpoints with chapter listings.",
    sourceKey: "allmanga",
    color: "gada",
    badge: "GRAPHQL ARCHIVE",
  },
];

function getNativeSourceMatch(extName: string, pkg: string) {
  const n = (extName + " " + pkg).toLowerCase();
  if (n.includes("mangapill")) return { source: "mangapill", label: "MangaPill" };
  if (n.includes("mangasee") || n.includes("weebcentral") || n.includes("mangalife"))
    return { source: "weebcentral", label: "MangaSee" };
  if (n.includes("mangadex")) return { source: "mangadex", label: "MangaDex" };
  if (n.includes("allmanga") || n.includes("allanime"))
    return { source: "allmanga", label: "AllManga" };
  return null;
}

export default function ExtensionsPage() {
  const [catalog, setCatalog] = useState<KeiyoushiExtension[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedLang, setSelectedLang] = useState<string>("all");

  useEffect(() => {
    getExtensionsCatalog()
      .then((data) => {
        setCatalog(data);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const languages = Array.from(new Set(catalog.map((e) => e.lang))).filter(Boolean);

  const filtered = catalog.filter((ext) => {
    const matchesSearch =
      ext.name.toLowerCase().includes(search.toLowerCase()) ||
      ext.pkg.toLowerCase().includes(search.toLowerCase()) ||
      ext.sources.some((s) => s.name.toLowerCase().includes(search.toLowerCase()));

    const matchesLang =
      selectedLang === "all" || ext.lang === selectedLang || ext.lang === "all";

    return matchesSearch && matchesLang;
  });

  return (
    <div className="space-y-10 pb-16">
      {/* Header */}
      <div className="space-y-2 pb-4 border-b border-sanctum-border">
        <div className="flex items-center gap-2 text-gada-bright font-mono text-xs uppercase tracking-widest">
          <Cpu className="w-4 h-4 text-gada" />
          MIHON & KEIYOUSHI REPOSITORY // INTEGRATED WEB CODEX
        </div>
        <h1 className="font-mythic text-2xl sm:text-4xl font-bold text-ashram">
          Extension Source Ecosystem
        </h1>
        <p className="font-hud text-sm text-ashram-muted max-w-3xl leading-relaxed">
          Integrated support for Mihon / Tachiyomi and Keiyoushi extensions. Top community
          sources are natively embedded into the Vajra Web Engine so you can search and read
          directly in your browser—no Android APK downloads or external apps needed.
        </p>
      </div>

      {/* 1. Featured Mihon Extensions (Natively Integrated) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-gada" />
          <h2 className="font-hud uppercase text-base sm:text-lg font-bold text-ashram tracking-wider">
            NATIVE MIHON WEB ENGINES (ONLINE & OPERATIONAL)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FEATURED_MIHON_SOURCES.map((src) => (
            <YantraCard
              key={src.pkg}
              glowColor="gada"
              className="p-5 bg-sanctum/90 border border-gada/40 hover:border-gada transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-hud font-bold text-lg text-ashram">
                      {src.name}
                    </h3>
                    <div className="font-mono text-xs text-ashram-muted">
                      {src.pkg}
                    </div>
                  </div>
                  <span className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono font-bold uppercase bg-prana/20 text-prana border border-prana/40 rounded-sm">
                    <CheckCircle2 className="w-3 h-3 text-prana" />
                    ONLINE
                  </span>
                </div>

                <p className="font-hud text-xs text-ashram leading-relaxed">
                  {src.description}
                </p>

                <div className="text-[10px] font-mono text-gada-bright tracking-wider">
                  {src.badge}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-sanctum-border flex items-center justify-between">
                <span className="text-xs font-mono text-ashram-muted">v{src.version}</span>
                <Link
                  href={`/explore?source=${src.sourceKey}`}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gada text-void hover:bg-gada-bright font-hud font-bold text-xs uppercase tracking-wider rounded transition-all shadow-gada-gold"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>BROWSE & READ MANGA</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </YantraCard>
          ))}
        </div>
      </div>

      {/* 2. Architecture & Ecosystem Info Banner */}
      <div className="bg-sanctum/90 border border-sanctum-border p-6 rounded-sm shadow-hud-glow space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-prana font-bold uppercase">
          <Layers className="w-4 h-4" />
          <span>ZERO EXTERNAL APPS OR GITHUB VISITS REQUIRED</span>
        </div>
        <p className="font-hud text-xs text-ashram leading-relaxed">
          Unlike Android reader apps (Mihon, TachiyomiSY) that require installing APK packages,
          our browser engine connects directly to the underlying CDNs and API endpoints. For advanced
          users with a local headless Suwayomi container (<code className="text-prana font-mono">docker compose up -d</code>),
          the GraphQL client (<code className="text-gada font-mono">/api/graphql</code>) can dynamically proxy
          any installed APK extension.
        </p>
      </div>

      {/* 3. Catalog Filter and Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-sanctum/85 p-4 rounded-sm border border-sanctum-border">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search 500+ Keiyoushi extensions..."
              className="w-full bg-void border border-sanctum-border text-xs font-mono text-ashram rounded px-3 py-2 pl-9 outline-none focus:border-gada"
            />
            <Search className="w-3.5 h-3.5 text-ashram-muted absolute left-3 top-2.5 pointer-events-none" />
          </div>

          {/* Language selector */}
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-gada" />
            <span className="font-hud uppercase text-xs text-ashram-muted">LANG:</span>
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="bg-void border border-sanctum-border text-xs font-mono text-ashram rounded px-2.5 py-1.5 outline-none focus:border-gada"
            >
              <option value="all">ALL LANGUAGES ({catalog.length} Total)</option>
              {languages.map((l) => (
                <option key={l} value={l}>
                  {l.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Catalog Grid */}
        {loading ? (
          <div className="py-20">
            <CyberGadaLoader
              size="md"
              text="ॐ PARSING KEIYOUSHI EXTENSION INDEX..."
              subtext="SYNCHRONIZING DECENTRALIZED CATALOG"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((ext) => {
              const native = getNativeSourceMatch(ext.name, ext.pkg);
              return (
                <YantraCard
                  key={ext.pkg}
                  glowColor={native ? "sindoor" : "gada"}
                  className="p-5 bg-sanctum/85 hover:border-gada/50 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-hud font-bold text-base text-ashram leading-snug">
                          {ext.name}
                        </h3>
                        <div className="font-mono text-[10px] text-ashram-muted truncate">
                          {ext.pkg}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-gada/20 text-gada-bright border border-gada/40">
                        {ext.lang}
                      </span>
                    </div>

                    {/* Sources list */}
                    {ext.sources.length > 0 && (
                      <div className="space-y-1">
                        <span className="font-mono text-[10px] text-ashram-muted/70 uppercase">
                          INCLUDED SOURCES:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {ext.sources.map((s) => (
                            <span
                              key={s.id || s.name}
                              className="px-2 py-0.5 rounded bg-void border border-sanctum-border text-[10px] font-mono text-ashram"
                            >
                              {s.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-sanctum-border/60 flex items-center justify-between text-xs font-mono text-ashram-muted">
                    <div className="flex items-center gap-1.5">
                      <span>v{ext.version}</span>
                      {native ? (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold text-prana bg-prana/10 rounded border border-prana/30">
                          NATIVE ACTIVE
                        </span>
                      ) : (
                        <span className="text-[10px] text-ashram-muted">VERIFIED</span>
                      )}
                    </div>

                    {/* One-click Action to browse/search directly */}
                    <Link
                      href={`/explore?q=${encodeURIComponent(ext.sources[0]?.name || ext.name)}&source=${
                        native?.source || "all"
                      }`}
                      className="px-3 py-1 bg-gada/20 text-gada-bright hover:bg-gada hover:text-void font-hud text-[11px] font-bold uppercase rounded transition-all shadow-gada-gold flex items-center gap-1"
                    >
                      <span>BROWSE</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </YantraCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
