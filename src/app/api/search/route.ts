import { NextRequest, NextResponse } from "next/server";
import { searchMangaDex } from "@/lib/adapters/mangadex";
import { searchMangaPill } from "@/lib/adapters/mangapill";
import { searchWeebCentral } from "@/lib/adapters/weebcentral";
import { searchAllManga } from "@/lib/adapters/allmanga";
import { searchAsura } from "@/lib/adapters/asura";
import { fetchAniListPopular } from "@/lib/adapters/anilist";

export const dynamic = "force-dynamic";

function normalizeKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/\s*\(colored\)/gi, "")
    .replace(/\s*\(official\)/gi, "")
    .replace(/\s*\(digital colored comics\)/gi, " colored")
    .replace(/[^a-z0-9]/g, "");
}

function isDoujinshiOrSpinoff(title: string): boolean {
  const t = title.toLowerCase();
  return (
    /\b(dj|doujin|doujinshi|omake|futanari|hentai|fan-comic|fancomic|anthology)\b/i.test(t) ||
    t.includes(" dj ") ||
    t.includes(" dj -") ||
    t.includes("dj -") ||
    t.includes("(dj)") ||
    t.includes("fan comic")
  );
}

export async function GET(req: NextRequest) {
  try {
    const rawQuery = req.nextUrl.searchParams.get("q") || "";
    const cleanQuery = rawQuery.replace(/[’‘`]/g, "'").trim();
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "36", 10);
    const sourceFilter = (req.nextUrl.searchParams.get("source") || "all").toLowerCase();

    // 1. Browsing with empty query: Return world-class verified top & trending catalog
    if (!cleanQuery) {
      const [aniListPopular, dexPopular] = await Promise.all([
        fetchAniListPopular(limit).catch(() => []),
        searchMangaDex("", limit).catch(() => []),
      ]);

      const popularItems: any[] = [
        ...aniListPopular.map((m) => ({
          id: `anilist-${m.id}`,
          title: m.title.english || m.title.romaji || "Popular Manga",
          altTitles: [m.title.romaji, m.title.native].filter(Boolean) as string[],
          description: m.description || "",
          coverUrl: m.coverImage?.extraLarge || m.coverImage?.large || "/placeholder-manga.jpg",
          bannerUrl: m.bannerImage || m.coverImage?.extraLarge || m.coverImage?.large,
          status: m.status || "RELEASING",
          score: m.averageScore || 92,
          tags: m.genres || [],
          totalChapters: m.chapters || 0,
        })),
        ...dexPopular.map((d) => ({
          id: d.id,
          title: d.title,
          altTitles: d.altTitles || [],
          description: d.description || "",
          coverUrl: d.coverUrl,
          bannerUrl: d.bannerUrl,
          status: d.status || "ONGOING",
          score: 90,
          tags: d.tags || [],
          totalChapters: 0,
        })),
      ];

      const seen = new Set<string>();
      const deduped: any[] = [];
      for (const item of popularItems) {
        const k = normalizeKey(item.title);
        if (k && !seen.has(k)) {
          seen.add(k);
          deduped.push(item);
        }
      }

      return NextResponse.json({
        success: true,
        data: deduped.slice(0, limit),
        count: Math.min(deduped.length, limit),
      });
    }

    // 2. Parallel multi-engine search across high-reliability primary sources
    const [weebResults, dexResults, pillResults, asuraResults] = await Promise.all([
      searchWeebCentral(cleanQuery, 24).catch(() => []),
      searchMangaDex(cleanQuery, 24).catch(() => []),
      searchMangaPill(cleanQuery, 24).catch(() => []),
      searchAsura(cleanQuery, 24).catch(() => []),
    ]);

    // Only query AllManga if explicitly filtered or if top 4 sources returned 0 results
    let allResults: any[] = [];
    if (sourceFilter === "allmanga" || (weebResults.length === 0 && dexResults.length === 0 && pillResults.length === 0)) {
      allResults = await searchAllManga(cleanQuery, 16).catch(() => []);
    }

    // Unified deduplication map keyed by normalized title
    const unifiedMap = new Map<string, any>();

    // Priority 1: WeebCentral (huge canon archives, 1000+ chapters, verified unblocked WebP CDN)
    for (const weeb of weebResults) {
      const key = normalizeKey(weeb.title);
      if (!key) continue;

      unifiedMap.set(key, {
        id: weeb.id,
        title: weeb.title,
        altTitles: [],
        description: "",
        coverUrl: weeb.coverUrl,
        bannerUrl: weeb.coverUrl,
        status: "ONGOING",
        score: 93,
        tags: weeb.genres || [],
        totalChapters: weeb.totalChapters || 0,
      });
    }

    // Priority 2: MangaDex (official verified API & high-res covers)
    for (const dex of dexResults) {
      const key = normalizeKey(dex.title);
      if (!key) continue;

      const existing = unifiedMap.get(key);
      if (existing) {
        if (!existing.coverUrl || existing.coverUrl.includes("placeholder")) {
          existing.coverUrl = dex.coverUrl;
        }
        if (dex.tags?.length) {
          existing.tags = Array.from(new Set([...existing.tags, ...dex.tags]));
        }
        if (dex.altTitles?.length) {
          existing.altTitles = Array.from(new Set([...(existing.altTitles || []), ...dex.altTitles]));
        }
      } else {
        unifiedMap.set(key, {
          id: dex.id,
          title: dex.title,
          altTitles: dex.altTitles || [],
          description: dex.description || "",
          coverUrl: dex.coverUrl,
          bannerUrl: dex.bannerUrl,
          status: dex.status || "ONGOING",
          score: (dex as any).score || 90,
          tags: dex.tags || [],
          totalChapters: (dex as any).totalChapters || 0,
          year: dex.year,
          author: dex.author,
          artist: dex.artist,
        });
      }
    }

    // Priority 3: MangaPill (high-speed mirror)
    for (const pill of pillResults) {
      const key = normalizeKey(pill.title);
      if (!key) continue;

      const existing = unifiedMap.get(key);
      if (existing) {
        if (!existing.coverUrl || existing.coverUrl.includes("placeholder")) {
          existing.coverUrl = pill.coverUrl;
        }
        if (pill.totalChapters && (!existing.totalChapters || pill.totalChapters > existing.totalChapters)) {
          existing.totalChapters = pill.totalChapters;
        }
        if (pill.genres?.length) {
          existing.tags = Array.from(new Set([...existing.tags, ...pill.genres]));
        }
      } else {
        unifiedMap.set(key, {
          id: pill.id,
          title: pill.title,
          altTitles: [],
          description: "",
          coverUrl: pill.coverUrl,
          bannerUrl: pill.coverUrl,
          status: "ONGOING",
          score: 88,
          tags: pill.genres || [],
          totalChapters: pill.totalChapters || 0,
        });
      }
    }

    // Priority 4: Asura Scans (unblocked HD manhwa stream)
    for (const asuraItem of asuraResults) {
      const key = normalizeKey(asuraItem.title);
      if (!key) continue;

      const existing = unifiedMap.get(key);
      if (existing) {
        if (asuraItem.totalChapters && (!existing.totalChapters || asuraItem.totalChapters > existing.totalChapters)) {
          existing.totalChapters = asuraItem.totalChapters;
        }
        if (asuraItem.genres?.length) {
          existing.tags = Array.from(new Set([...existing.tags, ...asuraItem.genres]));
        }
      } else {
        unifiedMap.set(key, {
          id: asuraItem.id,
          title: asuraItem.title,
          altTitles: asuraItem.altTitles || [],
          description: asuraItem.description || "",
          coverUrl: asuraItem.coverUrl,
          bannerUrl: asuraItem.bannerUrl || asuraItem.coverUrl,
          status: asuraItem.status || "ONGOING",
          score: asuraItem.score || 94,
          tags: asuraItem.genres || [],
          totalChapters: asuraItem.totalChapters || 0,
        });
      }
    }

    // Priority 5: AllManga (only non-placeholder, non-doujinshi items that are not in existing sources)
    for (const allItem of allResults) {
      const key = normalizeKey(allItem.title);
      if (!key || unifiedMap.has(key)) continue;

      // Skip entries with broken placeholder covers
      if (allItem.coverUrl === "/placeholder-manga.jpg" && !sourceFilter) continue;

      unifiedMap.set(key, {
        id: allItem.id,
        title: allItem.title,
        altTitles: allItem.englishName ? [allItem.englishName] : [],
        description: "",
        coverUrl: allItem.coverUrl,
        bannerUrl: allItem.coverUrl,
        status: allItem.status || "ONGOING",
        score: 85,
        tags: allItem.genres || [],
        totalChapters: allItem.totalChapters || 0,
      });
    }

    let combined = Array.from(new Set(unifiedMap.values()));

    // Filter by source if requested
    if (sourceFilter && sourceFilter !== "all") {
      const sf = sourceFilter.toLowerCase();
      if (sf === "mangadex") {
        combined = combined.filter((m) => !m.id.startsWith("mangapill-") && !m.id.startsWith("weebcentral-") && !m.id.startsWith("allmanga-") && !m.id.startsWith("asura-"));
      } else if (sf === "mangapill") {
        combined = combined.filter((m) => m.id.startsWith("mangapill-"));
      } else if (sf === "weebcentral") {
        combined = combined.filter((m) => m.id.startsWith("weebcentral-"));
      } else if (sf === "allmanga") {
        combined = combined.filter((m) => m.id.startsWith("allmanga-"));
      } else if (sf === "asura") {
        combined = combined.filter((m) => m.id.startsWith("asura-"));
      }
    }

    // Precision ranking
    if (cleanQuery) {
      const q = cleanQuery.toLowerCase();
      const qClean = q.replace(/[^a-z0-9]/g, "");

      combined.sort((a, b) => {
        const aTitle = a.title.toLowerCase();
        const bTitle = b.title.toLowerCase();
        const aClean = aTitle.replace(/[^a-z0-9]/g, "");
        const bClean = bTitle.replace(/[^a-z0-9]/g, "");

        // 1. Exact title match ALWAYS first (e.g. "One Piece" -> "One Piece")
        const aExact = aClean === qClean;
        const bExact = bClean === qClean;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        // 2. Canonical series ALWAYS before doujinshi/fan spin-offs
        const aDoujin = isDoujinshiOrSpinoff(a.title);
        const bDoujin = isDoujinshiOrSpinoff(b.title);
        if (!aDoujin && bDoujin) return -1;
        if (aDoujin && !bDoujin) return 1;

        // 3. Starts with query
        const aStarts = aClean.startsWith(qClean);
        const bStarts = bClean.startsWith(qClean);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        // 4. Higher chapter count first (canon 1100+ chapters beats 1-chapter doujinshi)
        const aCh = a.totalChapters || 0;
        const bCh = b.totalChapters || 0;
        return bCh - aCh;
      });
    }

    return NextResponse.json({
      success: true,
      data: combined.slice(0, limit),
      count: Math.min(combined.length, limit),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to search manga" },
      { status: 500 }
    );
  }
}
