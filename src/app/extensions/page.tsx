"use client";

import React, { useState, useEffect } from "react";
import { getExtensionsCatalog } from "@/lib/api-client";
import { KeiyoushiExtension } from "@/lib/adapters/keiyoushi-parser";
import { YantraCard } from "@/components/hud/YantraCard";
import { CyberGadaLoader } from "@/components/hud/CyberGadaLoader";
import { Cpu, Search, Globe, Shield, Terminal, Download, ExternalLink } from "lucide-react";

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
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="space-y-2 pb-4 border-b border-sanctum-border">
        <div className="flex items-center gap-2 text-gada-bright font-mono text-xs uppercase tracking-widest">
          <Cpu className="w-4 h-4 text-gada" />
          KEIYOUSHI REPOSITORY // PROTOBUF & JSON REPO
        </div>
        <h1 className="font-mythic text-2xl sm:text-4xl font-bold text-ashram">
          Extension Source Ecosystem
        </h1>
        <p className="font-hud text-sm text-ashram-muted max-w-2xl leading-relaxed">
          Cataloging 500+ decentralized community manga sources from the official Keiyoushi
          Extensions repository. Supported by our headless Suwayomi-Server GraphQL bridge.
        </p>
      </div>

      {/* Suwayomi Sidecar Architecture Info Banner */}
      <div className="bg-sanctum/90 border border-gada/40 p-6 rounded-sm shadow-hud-glow space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-gada font-bold uppercase">
          <Terminal className="w-4 h-4" />
          <span>SUWAYOMI-SERVER JVM BRIDGE // DOCKER INTEGRATION</span>
        </div>
        <p className="font-hud text-xs text-ashram leading-relaxed">
          The Keiyoushi ecosystem packages compiled Android APK extensions. To execute them
          server-side without Android runtime errors, run the bundled Docker Compose sidecar
          (<code className="text-prana font-mono">docker compose up -d</code>). The Vajra-Net
          GraphQL client (<code className="text-gada font-mono">/api/graphql</code>) automatically
          discovers installed sources.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <a
            href="https://github.com/keiyoushi/extensions"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-void border border-sanctum-border text-xs font-mono text-ashram hover:border-gada rounded transition-colors"
          >
            <span>Keiyoushi Repo</span>
            <ExternalLink className="w-3 h-3 text-gada" />
          </a>
          <a
            href="https://github.com/Suwayomi/Suwayomi-Server"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-void border border-sanctum-border text-xs font-mono text-ashram hover:border-gada rounded transition-colors"
          >
            <span>Suwayomi-Server</span>
            <ExternalLink className="w-3 h-3 text-gada" />
          </a>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-sanctum/85 p-4 rounded-sm border border-sanctum-border">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search extension or source..."
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
            <option value="all">ALL LANGUAGES</option>
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
            text="ॐ PARSING EXTENSION INDEX PROTOBUF..."
            subtext="STREAMING FROM GITHUB REPO INDEX"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ext) => (
            <YantraCard
              key={ext.pkg}
              glowColor="gada"
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
                <span>v{ext.version}</span>
                <span className="flex items-center gap-1 text-prana">
                  <Shield className="w-3 h-3" /> VERIFIED
                </span>
              </div>
            </YantraCard>
          ))}
        </div>
      )}
    </div>
  );
}
