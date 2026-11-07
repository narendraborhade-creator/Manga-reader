import { NextRequest, NextResponse } from "next/server";
import { searchMangaDex } from "@/lib/adapters/mangadex";
import { searchMangaPill } from "@/lib/adapters/mangapill";
import { searchWeebCentral } from "@/lib/adapters/weebcentral";

export const dynamic = "force-dynamic";

function normalizeKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s*\(colored\)/gi, "")
    .replace(/\s*\(official\)/gi, "")
    .replace(/\s*\(digital colored comics\)/gi, " colored")
    .replace(/[^a-z0-9]/g, "");
}

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get("q") || "";
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "36", 10);

    // Parallel multi-engine search across all top sources
    const [pillResults, weebResults, dexResults] = await Promise.all([
      searchMangaPill(query, 24).catch(() => []),
      searchWeebCentral(query, 24).catch(() => []),
      searchMangaDex(query, 24).catch(() => []),
    ]);

    // Unified deduplication map keyed by normalized title
    const unifiedMap = new Map<string, any>();

    // 1. First add MangaDex items (richest metadata and tags)
    for (const dex of dexResults) {
      const key = normalizeKey(dex.title);
      if (!key) continue;
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

    // 2. Merge MangaPill items
    for (const pill of pillResults) {
      const key = normalizeKey(pill.title);
      if (!key) continue;

      const existing = unifiedMap.get(key);
      if (existing) {
        // Enrich existing entry
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

    let combined = Array.from(unifiedMap.values());

    // Sort with highest precision:
    // Exact match > StartsWith match > Word match > Partial match
    if (query.trim()) {
      const q = query.trim().toLowerCase();
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
