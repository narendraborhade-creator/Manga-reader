"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Bookmark,
  Compass,
  Layers,
  Home,
  Menu,
  X,
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
    }, 200);

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
    { label: "Home", href: "/", icon: Home },
    { label: "Browse", href: "/explore", icon: Compass },
    { label: "Sources", href: "/extensions", icon: Layers },
    { label: "Library", href: "/bookmarks", icon: Bookmark },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-dark/95 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-9 h-9 rounded-xl overflow-hidden ring-1 ring-white/20 group-hover:ring-brand shadow-lg shadow-brand/20 group-hover:scale-105 transition-all duration-200 bg-dark-surface">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand-icon.png"
                alt="Website Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-sans font-bold text-lg tracking-tight text-white group-hover:text-brand-light transition-colors">
                Mangayomi
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-brand/20 text-brand-light border border-brand/30">
                Web
              </span>
            </div>
          </Link>

          {/* Desktop Search Bar with Live Suggestions Dropdown */}
          <div ref={searchContainerRef} className="relative hidden md:block flex-1 max-w-md lg:max-w-lg">
            <form
              onSubmit={handleSearchSubmit}
              className="relative flex items-center bg-dark-surface border border-dark-border focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 rounded-xl transition-all"
            >
              <div className="pl-3.5 flex items-center pointer-events-none text-slate-400">
                {isSearching ? (
                  <Loader2 className="w-4 h-4 text-brand animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </div>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowDropdown(true);
                }}
                placeholder="Search manga, manhwa, authors..."
                className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-400/80 outline-none px-3 py-2 pr-16"
              />

              <button
                type="submit"
                className="absolute right-1.5 px-3 py-1 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
              >
                Search
              </button>
            </form>

            {/* Live Autocomplete Suggestions */}
            {showDropdown && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-dark-elevated border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl z-50 overflow-hidden divide-y divide-white/5">
                <div className="px-3.5 py-2 bg-dark-surface/80 flex items-center justify-between text-xs font-medium text-slate-400">
                  <span className="flex items-center gap-1.5 text-brand-light font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-brand" />
                    Quick Results
                  </span>
                  <span>{suggestions.length} titles</span>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {suggestions.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectSuggestion(item.id)}
                      className="w-full px-3.5 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors text-left group"
                    >
                      <div className="w-10 h-14 rounded-lg bg-dark overflow-hidden flex-shrink-0 relative border border-white/10">
                        {item.coverUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={
                              item.coverUrl.includes("anilist.co")
                                ? item.coverUrl
                                : `/api/proxy/image?url=${encodeURIComponent(item.coverUrl)}`
                            }
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500">
                            <BookOpen className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-100 truncate group-hover:text-brand-light transition-colors">
                          {item.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {item.status && (
                            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-online/10 text-emerald-online">
                              {item.status}
                            </span>
                          )}
                          {item.totalChapters !== undefined && item.totalChapters > 0 && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              {item.totalChapters} Chs
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleSearchSubmit}
                  className="w-full py-2.5 bg-dark-surface/90 hover:bg-white/5 text-xs font-semibold text-brand-light text-center transition-colors"
                >
                  View all results for &ldquo;{searchQuery}&rdquo; →
                </button>
              </div>
            )}
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-brand text-white shadow-lg shadow-brand/20 font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-dark-surface/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-4">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search manga..."
              className="w-full bg-dark border border-dark-border rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-400 outline-none focus:border-brand"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 p-1 text-slate-400 hover:text-white"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-brand text-white font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};
