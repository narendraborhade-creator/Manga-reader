import React from "react";
import Link from "next/link";
import { BookOpen, Github, Layers, ShieldCheck, Heart } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-dark-surface border-t border-white/10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand to-accent flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="font-sans font-bold text-lg text-white">Mangayomi Web</span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              A modern, free, and open-source manga reader inspired by Mangayomi.
              Enjoy seamless reading across unified multi-source community catalogs with zero intrusive ads.
            </p>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
              Navigation
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/" className="hover:text-brand-light transition-colors">
                  Home Discover
                </Link>
              </li>
              <li>
                <Link href="/explore" className="hover:text-brand-light transition-colors">
                  Browse Catalog
                </Link>
              </li>
              <li>
                <Link href="/extensions" className="hover:text-brand-light transition-colors">
                  Mangayomi Sources
                </Link>
              </li>
              <li>
                <Link href="/bookmarks" className="hover:text-brand-light transition-colors">
                  Library &amp; History
                </Link>
              </li>
            </ul>
          </div>

          {/* Connected Services */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
              Source Network
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-online" />
                <span>MangaDex API v5</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-online" />
                <span>Asura Scans HD</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-online" />
                <span>WeebCentral CDN</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-online" />
                <span>Mangayomi Extensions</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Mangayomi Web. Built for manga enthusiasts worldwide.</p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/kodjodevf/mangayomi"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-slate-300 transition-colors"
            >
              <Github className="w-4 h-4" />
              <span>Mangayomi Project</span>
            </a>
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-brand-light" />
              <span>Community Driven</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
