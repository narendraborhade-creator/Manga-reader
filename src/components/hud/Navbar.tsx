"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Bookmark, Compass, Cpu, Menu, X, Flame } from "lucide-react";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
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
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Hanuman Emblem */}
          <Link href="/" className="flex items-center gap-3 group">
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

          {/* Desktop Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex items-center relative w-72 lg:w-96"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH SACRED CODEX (E.G. ONE PIECE)..."
              className="w-full bg-sanctum/90 border border-sanctum-border focus:border-gada focus:ring-1 focus:ring-gada text-xs font-mono text-ashram placeholder-ashram-muted/60 rounded px-3 py-2 pl-9 transition-all outline-none"
            />
            <Search className="w-4 h-4 text-ashram-muted absolute left-3 pointer-events-none" />
            <button
              type="submit"
              className="absolute right-1.5 px-2 py-1 bg-gada/20 text-gada-bright font-hud text-[10px] uppercase font-bold rounded hover:bg-gada hover:text-void transition-colors"
            >
              SCAN
            </button>
          </form>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
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
            <div className="ml-3 pl-3 border-l border-sanctum-border flex items-center gap-2">
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
              className="w-full bg-void border border-sanctum-border text-xs font-mono text-ashram rounded px-3 py-2 pl-9 outline-none"
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
