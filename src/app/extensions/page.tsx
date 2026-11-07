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
  CheckCircle2,
  ArrowRight,
  Zap,
  BookOpen,
  Layers,
  Sparkles,
} from "lucide-react";

const CORE_ENGINES = [
  {
    name: "MangaPill Reading Engine",
    lang: "EN",
    status: "100% ACTIVE & INTEGRATED",
    description: "High-speed English scanlation mirror with full archives starting from Chapter 1. Direct page streaming with zero external redirects.",
    category: "Action, Shonen, Seinen",
    searchQuery: "One Piece Berserk",
  },
  {
    name: "WeebCentral HD CDN Engine",
    lang: "EN",
    status: "100% ACTIVE & INTEGRATED",
    description: "High-definition manga image stream with official digital color and Shonen Jump archives.",
    category: "HD Scans, Color Manga",
    searchQuery: "Chainsaw Man Jujutsu Kaisen",
  },
  {
    name: "MangaDex v5 Global Engine",
    lang: "MULTI",
    status: "100% ACTIVE & INTEGRATED",
    description: "Decentralized open-source manga database. Verified community scanlations with real-time updates.",
    category: "Global Community Scans",
    searchQuery: "Solo Leveling",
  },
  {
    name: "AniList Metadata Engine",
    lang: "GLOBAL",
    status: "100% ACTIVE & INTEGRATED",
    description: "Rich ratings, trending lists, and official cover art aggregated seamlessly across all series.",
    category: "Metadata & Ratings",
    searchQuery: "Bleach Naruto",
  },
];

export default function ExtensionsPage() {
  const [catalog, setCatalog] = useState<KeiyoushiExtension[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getExtensionsCatalog()
      .then((data) => {
        setCatalog(data);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filteredExtensions = catalog.filter((ext) => {
    const q = search.toLowerCase();
    return (
      ext.name.toLowerCase().includes(q) ||
      ext.pkg.toLowerCase().includes(q) ||
      ext.sources.some((s) => s.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="space-y-2 pb-4 border-b border-sanctum-border">
        <div className="flex items-center gap-2 text-gada-bright font-mono text-xs uppercase tracking-widest">
          <Layers className="w-4 h-4 text-gada" />
          INTEGRATED ENGINE HUB // MIHON & KEIYOUSHI
        </div>
        <h1 className="font-mythic text-2xl sm:text-4xl font-bold text-ashram">
          In-App Reading Engines
        </h1>
        <p className="font-hud text-sm text-ashram-muted max-w-2xl">
          All top Mihon and Keiyoushi source engines are integrated natively into the website. No APKs, no GitHub downloads, and no external redirects. Everything searches and streams directly inside the built-in reader.
        </p>
      </div>

      {/* Core Built-in Engines Deck */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-sindoor" />
          <h2 className="font-hud uppercase text-lg font-bold text-ashram tracking-wider">
            ACTIVE READING ENGINES
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

                  <Link
                    href={`/explore?q=${encodeURIComponent(engine.searchQuery)}`}
                    className="flex items-center gap-1.5 px-4 py-2 bg-sindoor hover:bg-sindoor-glow text-white font-hud font-bold uppercase text-xs rounded transition-all shadow-sindoor-neon"
                  >
                    <span>BROWSE MANGA</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </YantraCard>
          ))}
        </div>
      </div>

      {/* Keiyoushi Extended Catalog */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-sanctum-border">
          <div className="space-y-0.5">
            <h2 className="font-hud uppercase text-lg font-bold text-ashram tracking-wider">
              EXTENDED MIHON / KEIYOUSHI ARCHIVE ({catalog.length} SOURCES)
            </h2>
            <p className="font-mono text-xs text-ashram-muted">
              Search any series across our decentralized index to read it immediately.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="SEARCH SOURCES OR MANGA..."
              className="w-full bg-void border border-sanctum-border text-xs font-mono text-ashram rounded px-3 py-2 pl-9 outline-none focus:border-gada"
            />
            <Search className="w-3.5 h-3.5 text-ashram-muted absolute left-3 top-2.5 pointer-events-none" />
          </div>
        </div>

        {loading ? (
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

                  <Link
                    href={`/explore?q=${encodeURIComponent(ext.sources[0]?.name || ext.name)}`}
                    className="px-3 py-1 bg-gada/20 text-gada-bright hover:bg-gada hover:text-void font-hud text-[11px] font-bold uppercase rounded transition-all shadow-gada-gold flex items-center gap-1"
                  >
                    <span>SEARCH MANGA</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </YantraCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
