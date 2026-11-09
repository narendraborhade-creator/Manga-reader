"use client";

import React, { useState } from "react";
import { MangaCard } from "./MangaCard";
import { Sparkles, Flame, BookOpen, Trophy, Zap } from "lucide-react";

export interface RecommendationItem {
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
  mangaPillItems: RecommendationItem[];
  weebCentralItems: RecommendationItem[];
  mangaDexItems: RecommendationItem[];
  aniListItems: RecommendationItem[];
}

export const MultiSourceRecommendations: React.FC<MultiSourceRecommendationsProps> = ({
  initialItems,
  mangaPillItems,
  weebCentralItems,
  mangaDexItems,
  aniListItems,
}) => {
  const [activeTab, setActiveTab] = useState<
    "all" | "shonen" | "seinen" | "top" | "awards"
  >("all");

  const displayedItems = (() => {
    switch (activeTab) {
      case "shonen":
        return mangaPillItems.length > 0 ? mangaPillItems : initialItems;
      case "seinen":
        return weebCentralItems.length > 0 ? weebCentralItems : initialItems;
      case "top":
        return mangaDexItems.length > 0 ? mangaDexItems : initialItems;
      case "awards":
        return aniListItems.length > 0 ? aniListItems : initialItems;
      case "all":
      default:
        return initialItems;
    }
  })();

  const tabs = [
    { id: "all", label: "Trending Worldwide", icon: Flame },
    { id: "shonen", label: "Action & Shonen", icon: Zap },
    { id: "seinen", label: "Seinen & Drama", icon: BookOpen },
    { id: "top", label: "Community Favorites", icon: Sparkles },
    { id: "awards", label: "Top Rated", icon: Trophy },
  ] as const;

  return (
    <section className="space-y-6">
      {/* Header and Category Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#20273a]">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Curated Catalog
          </div>
          <h2 className="font-sans text-xl sm:text-2xl font-bold text-white tracking-tight">
            Recommended for You
          </h2>
        </div>

        {/* Category Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#121622] p-1.5 rounded-xl border border-[#23293e]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white hover:bg-[#1b2234]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
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
