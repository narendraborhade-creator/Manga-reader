"use client";

import React from "react";
import Link from "next/link";
import { Terminal, Shield, Sparkles, ExternalLink } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-void border-t border-sanctum-border mt-20 relative overflow-hidden text-ashram-muted">
      {/* Decorative Top Accent Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-gada to-transparent opacity-60" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Hanuman / Vajra Lore */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-mythic text-2xl text-gada-bright">ॐ</span>
              <span className="font-mythic font-bold text-lg text-ashram tracking-wider">
                VAJRA-NET
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sindoor/20 text-sindoor border border-sindoor/30">
                CYBER-MANDALA v2.5
              </span>
            </div>
            <p className="font-hud text-sm text-ashram leading-relaxed">
              मनोजवं मारुततुल्यवेगं जितेन्द्रियं बुद्धिमतां वरिष्ठम्। <br />
              वातात्मजं वानरयूथमुख्यं श्रीरामदूतं शरणं प्रपद्ये॥
            </p>
            <p className="font-mono text-xs text-ashram-muted/80 max-w-md">
              A high-velocity, decentralized manga discovery and reading platform uniting
              ancient Vedic aesthetics with cyberpunk telemetry. Powered by MangaDex v5 and
              multi-source extension feeds.
            </p>
          </div>

          {/* Col 2: Navigation */}
          <div className="space-y-3">
            <h4 className="font-hud uppercase text-xs tracking-widest text-gada font-bold">
              // SACRED CODEX
            </h4>
            <ul className="space-y-2 font-hud text-sm">
              <li>
                <Link href="/" className="hover:text-gada transition-colors">
                  Command Deck
                </Link>
              </li>
              <li>
                <Link href="/explore" className="hover:text-gada transition-colors">
                  Explore All Manga
                </Link>
              </li>
              <li>
                <Link href="/extensions" className="hover:text-gada transition-colors">
                  Keiyoushi Extensions
                </Link>
              </li>
              <li>
                <Link href="/bookmarks" className="hover:text-gada transition-colors">
                  Saved Bookmarks
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Engine Telemetry */}
          <div className="space-y-3">
            <h4 className="font-hud uppercase text-xs tracking-widest text-prana font-bold flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              // TELEMETRY
            </h4>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex items-center justify-between py-1 border-b border-sanctum-border">
                <span>MANGADEX API v5</span>
                <span className="text-prana">ONLINE (200 OK)</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-sanctum-border">
                <span>ANILIST GRAPHQL</span>
                <span className="text-prana">LINKED</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-sanctum-border">
                <span>STREAM PROXY</span>
                <span className="text-gada">ACTIVE</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span>SECURITY ENCLAVE</span>
                <span className="text-sindoor flex items-center gap-1">
                  <Shield className="w-3 h-3" /> VERIFIED
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-sanctum-border flex flex-col sm:flex-row items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span>VAJRA-NET ENGINE</span>
            <span>•</span>
            <span className="text-gada flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> JAI SHREE RAM
            </span>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-4 text-ashram-muted">
            <a
              href="https://github.com/narendraborhade-creator/Manga-reader"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-ashram transition-colors"
            >
              GitHub Repo <ExternalLink className="w-3 h-3" />
            </a>
            <span>•</span>
            <span>MIT Open Source</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
