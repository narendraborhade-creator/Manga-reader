"use client";

import React, { useState } from "react";
import { MangaCard } from "./MangaCard";
import { Sparkles, Flame, Cpu, Compass } from "lucide-react";

interface RecommendationItem {
  id: string;
  title: string;
  coverUrl: string;
  status?: string;
  score?: number | null;
  genres?: string[];
  source?: string;
}

interface MultiSourceRecommendationsProps {
  initialItems: RecommendationItem[];
  mangaDexItems: RecommendationItem[];
  allMangaItems: RecommendationItem[];
  aniListItems: RecommendationItem[];
}

export const MultiSourceRecommendations: React.FC<MultiSourceRecommendationsProps> = ({
  initialItems,
  mangaDexItems,
  allMangaItems,
  aniListItems,
}) => {
  const [activeTab, setActiveTab] = useState<"all" | "mangadex" | "allmanga" | "anilist">("all");

  const displayedItems = (() => {
    switch (activeTab) {
      case "mangadex":
        return mangaDexItems;
      case "allmanga":
        return allMangaItems;
      case "anilist":
        return aniListItems;
      case "all":
      default:
        return initialItems;
    }
  })();

  const tabs = [
    { id: "all", label: "All Curated", icon: Sparkles, color: "text-gada" },
    { id: "mangadex", label: "MangaDex Most Followed", icon: Flame, color: "text-sindoor" },
    { id: "allmanga", label: "AllManga Scanlations", icon: Cpu, color: "text-prana" },
    { id: "anilist", label: "AniList Highest Rated", icon: Compass, color: "text-gada-bright" },
  ] as const;

  return (
    <section className="space-y-6">
      {/* Header and Source Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-sanctum-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-gada-bright font-mono text-xs uppercase tracking-widest">
            <Sparkles className="w-4 h-4 text-gada" />
            MULTI-SOURCE SANCTUM // CURATED RECOMMENDATIONS
          </div>
          <h2 className="font-hud uppercase text-lg sm:text-xl font-bold text-ashram tracking-wider">
            RECOMMENDED FOR YOU
          </h2>
        </div>

        {/* Source Switcher Pill Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-sanctum/90 p-1 rounded-sm border border-sanctum-border">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-mono font-bold uppercase transition-all ${
                  isActive
                    ? "bg-sindoor text-white shadow-sindoor-neon border border-sindoor-glow"
                    : "text-ashram-muted hover:text-ashram hover:bg-void/60"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : tab.color}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Manga Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {displayedItems.map((m) => (
          <MangaCard
            key={m.id}
            id={m.id}
            title={m.title}
            coverUrl={m.coverUrl}
            status={m.status}
            score={m.score}
            genres={m.genres}
            source={m.source}
          />
        ))}
      </div>
    </section>
  );
};
