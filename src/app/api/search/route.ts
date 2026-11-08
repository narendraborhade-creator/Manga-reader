import { NextRequest, NextResponse } from "next/server";
import { searchMangaDex } from "@/lib/adapters/mangadex";
import { searchMangaPill } from "@/lib/adapters/mangapill";
import { searchWeebCentral } from "@/lib/adapters/weebcentral";
import { searchAllManga } from "@/lib/adapters/allmanga";
import { searchAsura } from "@/lib/adapters/asura";

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

export async function GET(req: NextRequest) {
  try {
    const rawQuery = req.nextUrl.searchParams.get("q") || "";
    const cleanQuery = rawQuery.replace(/[’‘`]/g, "'").trim();
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "36", 10);
    const sourceFilter = req.nextUrl.searchParams.get("source") || "all";

    // Parallel multi-engine search across all top sources
    const [pillResults, weebResults, dexResults, allResults, asuraResults] = await Promise.all([
      searchMangaPill(cleanQuery, 24).catch(() => []),
      searchWeebCentral(cleanQuery, 24).catch(() => []),
      searchMangaDex(cleanQuery, 24).catch(() => []),
      searchAllManga(cleanQuery, 24).catch(() => []),
      searchAsura(cleanQuery, 24).catch(() => []),
    ]);

    // Unified deduplication map keyed by normalized title
    const unifiedMap = new Map<string, any>();

    // 1. Add MangaDex items
    for (const dex of dexResults) {
      const entry = {
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
      };

      const key = normalizeKey(dex.title);
      if (key) unifiedMap.set(key, entry);

      // Register alternative titles so English variants point to the same entry
      for (const alt of dex.altTitles || []) {
        const altKey = normalizeKey(alt);
        if (altKey && !unifiedMap.has(altKey)) {
          unifiedMap.set(altKey, entry);
        }
      }
    }

    // 2. Merge MangaPill items
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
        // Prefer English title from MangaPill if existing is non-ascii or romaji
        if (/^[\x20-\x7E]+$/.test(pill.title) && !/^[\x20-\x7E]+$/.test(existing.title)) {
          existing.title = pill.title;
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

    // 3. Merge WeebCentral items
    for (const weeb of weebResults) {
      const key = normalizeKey(weeb.title);
      if (!key) continue;

      const existing = unifiedMap.get(key);
      if (existing) {
        if (!existing.coverUrl || existing.coverUrl.includes("placeholder")) {
          existing.coverUrl = weeb.coverUrl;
        }
        if (weeb.totalChapters && (!existing.totalChapters || weeb.totalChapters > existing.totalChapters)) {
          existing.totalChapters = weeb.totalChapters;
        }
        if (weeb.genres?.length) {
          existing.tags = Array.from(new Set([...existing.tags, ...weeb.genres]));
        }
        // WeebCentral always uses clean English titles (e.g. "Solo Leveling", "Tower of God")
        if (/^[\x20-\x7E]+$/.test(weeb.title)) {
          existing.title = weeb.title;
        }
      } else {
        unifiedMap.set(key, {
          id: weeb.id,
          title: weeb.title,
          altTitles: [],
          description: "",
          coverUrl: weeb.coverUrl,
          bannerUrl: weeb.coverUrl,
          status: "ONGOING",
          score: 92,
          tags: weeb.genres || [],
          totalChapters: weeb.totalChapters || 0,
        });
      }
    }

    // 4. Merge AllManga items
    for (const allItem of allResults) {
      const key = normalizeKey(allItem.title);
      if (!key) continue;

      const existing = unifiedMap.get(key);
      if (existing) {
        if (allItem.totalChapters && (!existing.totalChapters || allItem.totalChapters > existing.totalChapters)) {
          existing.totalChapters = allItem.totalChapters;
        }
        if (!existing.coverUrl || existing.coverUrl.includes("placeholder")) {
          existing.coverUrl = allItem.coverUrl;
        }
        if (allItem.genres?.length) {
          existing.tags = Array.from(new Set([...existing.tags, ...allItem.genres]));
        }
        if (allItem.englishName && !existing.altTitles?.includes(allItem.englishName)) {
          existing.altTitles = [...(existing.altTitles || []), allItem.englishName];
        }
      } else {
        unifiedMap.set(key, {
          id: allItem.id,
          title: allItem.title,
          altTitles: allItem.englishName ? [allItem.englishName] : [],
          description: "",
          coverUrl: allItem.coverUrl,
          bannerUrl: allItem.coverUrl,
          status: allItem.status || "ONGOING",
          score: 89,
          tags: allItem.genres || [],
          totalChapters: allItem.totalChapters || 0,
        });
      }
    }

    // 5. Merge Asura Scans items
    for (const asuraItem of asuraResults) {
      const key = normalizeKey(asuraItem.title);
      if (!key) continue;

      const existing = unifiedMap.get(key);
      if (existing) {
        if (asuraItem.totalChapters && (!existing.totalChapters || asuraItem.totalChapters > existing.totalChapters)) {
          existing.totalChapters = asuraItem.totalChapters;
        }
        if (!existing.coverUrl || existing.coverUrl.includes("placeholder")) {
          existing.coverUrl = asuraItem.coverUrl;
        }
        if (asuraItem.genres?.length) {
          existing.tags = Array.from(new Set([...existing.tags, ...asuraItem.genres]));
        }
        if (asuraItem.altTitles?.length) {
          existing.altTitles = Array.from(new Set([...(existing.altTitles || []), ...asuraItem.altTitles]));
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

    // Precision sorting:
    if (cleanQuery) {
      const q = cleanQuery.toLowerCase();
      const qClean = q.replace(/[^a-z0-9]/g, "");

      combined.sort((a, b) => {
        const aTitle = a.title.toLowerCase();
        const bTitle = b.title.toLowerCase();
        const aClean = aTitle.replace(/[^a-z0-9]/g, "");
        const bClean = bTitle.replace(/[^a-z0-9]/g, "");

        // 1. Exact title match
        const aExact = aClean === qClean;
        const bExact = bClean === qClean;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        // 2. Starts with query
        const aStarts = aClean.startsWith(qClean);
        const bStarts = bClean.startsWith(qClean);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        // 3. Main series over spin-offs/doujinshi
        const aDoujin = aTitle.includes("doujinshi") || aTitle.includes("omake") || aTitle.includes("academy");
        const bDoujin = bTitle.includes("doujinshi") || bTitle.includes("omake") || bTitle.includes("academy");
        if (!aDoujin && bDoujin) return -1;
        if (aDoujin && !bDoujin) return 1;

        // 4. Higher chapter count first
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
