"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Bookmark,
  Compass,
  Cpu,
  Menu,
  X,
  Flame,
  BookOpen,
  Sparkles,
  Loader2,
} from "lucide-react";

interface SuggestionItem {
  id: string;
  title: string;
  coverUrl?: string;
  totalChapters?: number;
  tags?: string[];
  status?: string;
}

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced live autocomplete search
  useEffect(() => {
    const cleanQ = searchQuery.replace(/[’‘`]/g, "'").trim();
    if (cleanQ.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(cleanQ)}&limit=6`);
        if (res.ok) {
          const json = await res.json();
          setSuggestions(json.data || []);
          setShowDropdown(true);
        }
      } catch (err) {
        console.error("Autocomplete search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQ = searchQuery.replace(/[’‘`]/g, "'").trim();
    if (cleanQ) {
      setShowDropdown(false);
      router.push(`/explore?q=${encodeURIComponent(cleanQ)}`);
      setMobileMenuOpen(false);
    }
  };

  const handleSelectSuggestion = (id: string) => {
    setShowDropdown(false);
    setSearchQuery("");
    const targetHref = id.startsWith("anilist-")
      ? `/explore?q=${encodeURIComponent(id.replace("anilist-", ""))}`
      : `/manga/${id}`;
    router.push(targetHref);
  };

  const navLinks = [
    { label: "Home Deck", href: "/", icon: Flame },
    { label: "Explore Codex", href: "/explore", icon: Compass },
    { label: "Extensions", href: "/extensions", icon: Cpu },
    { label: "Bookmarks", href: "/bookmarks", icon: Bookmark },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-void/90 backdrop-blur-xl border-b border-sanctum-border">
      {/* Top Cyber Telemetry Line */}
      <div className="w-full h-[2px] bg-gradient-to-r from-sindoor via-gada to-prana" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo & Hanuman Emblem */}
          <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
            <div className="relative w-10 h-10 rounded-sm bg-sanctum border border-gada/50 flex items-center justify-center shadow-gada-gold group-hover:border-sindoor transition-colors">
              <span className="font-mythic text-xl text-gada-bright group-hover:text-sindoor transition-colors">
                ॐ
              </span>
              <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-sindoor rounded-full animate-ping" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mythic font-bold text-lg text-ashram tracking-wider">
                  VAJRA
                </span>
                <span className="font-hud uppercase text-xs px-1.5 py-0.5 rounded bg-sindoor/20 text-sindoor font-semibold tracking-widest border border-sindoor/40">
                  HUD 2.5
                </span>
              </div>
              <div className="font-mono text-[10px] text-ashram-muted tracking-widest uppercase">
                HANUMAN CYBER-READER
              </div>
            </div>
          </Link>

          {/* Desktop Search Bar with Live Suggestions Dropdown */}
          <div ref={searchContainerRef} className="relative hidden md:block flex-1 max-w-md lg:max-w-lg">
            <form
              onSubmit={handleSearchSubmit}
              className="relative flex items-center bg-sanctum/95 border border-sanctum-border focus-within:border-gada focus-within:ring-1 focus-within:ring-gada rounded transition-all"
            >
              <div className="pl-3 flex items-center pointer-events-none">
                {isSearching ? (
                  <Loader2 className="w-4 h-4 text-gada animate-spin" />
                ) : (
                  <Search className="w-4 h-4 text-ashram-muted" />
                )}
              </div>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowDropdown(true);
                }}
                placeholder="Search manga or manhwa..."
                className="w-full bg-transparent text-xs font-mono text-ashram placeholder-ashram-muted/70 outline-none px-2.5 py-2 pr-14"
              />

              <button
                type="submit"
                className="absolute right-1 px-3 py-1 bg-gada/20 text-gada-bright font-hud text-[10px] uppercase font-bold rounded hover:bg-gada hover:text-void transition-colors shadow-sm"
              >
                SCAN
              </button>
            </form>

            {/* Live Autocomplete Suggestions HUD */}
            {showDropdown && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-sanctum/95 border border-gada/40 rounded-sm shadow-2xl backdrop-blur-xl z-50 overflow-hidden divide-y divide-sanctum-border/60">
                <div className="px-3 py-1.5 bg-void/80 flex items-center justify-between text-[10px] font-mono text-ashram-muted">
                  <span className="flex items-center gap-1 text-gada-bright uppercase font-bold">
                    <Sparkles className="w-3 h-3 text-gada" />
                    MATCHING MANGA ARCHIVES
                  </span>
                  <span>{suggestions.length} FOUND</span>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {suggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectSuggestion(item.id)}
                      className="w-full px-3 py-2 text-left flex items-center gap-3 hover:bg-gada-dim hover:border-l-2 hover:border-gada transition-all group"
                    >
                      {/* Thumbnail */}
                      <div className="w-9 h-12 bg-void flex-shrink-0 rounded overflow-hidden border border-sanctum-border relative flex items-center justify-center">
                        {item.coverUrl && !item.coverUrl.includes("placeholder") ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={
                              item.coverUrl.includes("s4.anilist.co") ||
                              item.coverUrl.includes("anilist.co")
                                ? item.coverUrl
                                : `/api/proxy/image?url=${encodeURIComponent(item.coverUrl)}`
                            }
                            alt={item.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-mythic text-gada text-xs">
                            ॐ
                          </div>
                        )}
                      </div>

                      {/* Title & Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-hud text-xs font-bold text-ashram group-hover:text-gada-bright truncate">
                          {item.title}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.totalChapters && item.totalChapters > 0 ? (
                            <span className="inline-flex items-center gap-1 font-mono text-[9px] text-prana uppercase font-bold">
                              <BookOpen className="w-2.5 h-2.5" />
                              {item.totalChapters} CH
                            </span>
                          ) : null}
                          {item.tags && item.tags.length > 0 && (
                            <span className="font-mono text-[9px] text-ashram-muted/80 truncate">
                              {item.tags.slice(0, 2).join(" • ")}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="font-hud text-[10px] text-gada uppercase font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        READ →
                      </span>
                    </button>
                  ))}
                </div>

                <div className="p-2 bg-void/90 text-center">
                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className="text-[11px] font-mono text-ashram-muted hover:text-gada-bright transition-colors uppercase font-bold"
                  >
                    PRESS ENTER OR CLICK SCAN TO VIEW ALL RESULTS
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1 flex-shrink-0">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-hud font-semibold uppercase tracking-wider transition-all ${
                    isActive
                      ? "text-gada-bright bg-gada-dim border border-gada/40 shadow-gada-gold"
                      : "text-ashram-muted hover:text-ashram hover:bg-sanctum-hover"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-gada" : ""}`} />
                  {item.label}
                </Link>
              );
            })}

            {/* Telemetry Status Indicator */}
            <div className="ml-2 pl-2 border-l border-sanctum-border flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-prana animate-pulse shadow-prana-cyan" />
              <span className="font-mono text-[10px] text-prana uppercase tracking-wider hidden lg:inline">
                PRANA: 100%
              </span>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded bg-sanctum border border-sanctum-border text-ashram hover:text-gada"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-sanctum/95 border-b border-sanctum-border px-4 pt-3 pb-5 space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH MANGA..."
              className="w-full bg-void border border-sanctum-border text-xs font-mono text-ashram rounded px-3 py-2 pl-9 outline-none focus:border-gada"
            />
            <Search className="w-4 h-4 text-ashram-muted absolute left-3 top-2.5 pointer-events-none" />
          </form>

          <div className="space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-hud uppercase tracking-wider ${
                    isActive
                      ? "text-gada-bright bg-gada-dim border border-gada/40"
                      : "text-ashram-muted hover:text-ashram"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};
