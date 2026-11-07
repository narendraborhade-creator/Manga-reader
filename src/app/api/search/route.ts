import { NextRequest, NextResponse } from "next/server";
import { searchMangaDex } from "@/lib/adapters/mangadex";
import { searchMangaPill } from "@/lib/adapters/mangapill";
import { searchWeebCentral } from "@/lib/adapters/weebcentral";
import { searchAllManga } from "@/lib/adapters/allmanga";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get("q") || "";
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "32", 10);
    const source = (req.nextUrl.searchParams.get("source") || "all").toLowerCase();

    let combinedResults: any[] = [];

    if (source === "mangapill") {
      combinedResults = await searchMangaPill(query, limit);
    } else if (source === "weebcentral") {
      combinedResults = await searchWeebCentral(query, limit);
    } else if (source === "mangadex") {
      combinedResults = await searchMangaDex(query, limit);
    } else if (source === "allmanga") {
      combinedResults = await searchAllManga(query, limit);
    } else {
      // "all" source: Concurrent query across MangaPill, WeebCentral, and MangaDex
      const [mangaPillRes, weebCentralRes, mangaDexRes] = await Promise.all([
        searchMangaPill(query, 16).catch(() => []),
        searchWeebCentral(query, 16).catch(() => []),
        searchMangaDex(query, 16).catch(() => []),
      ]);

      const taggedPill = mangaPillRes.map((m) => ({ ...m, source: "MANGAPILL" }));
      const taggedWeeb = weebCentralRes.map((m) => ({ ...m, source: "WEEBCENTRAL" }));
      const taggedDex = mangaDexRes.map((m) => ({ ...m, source: "MANGADEX" }));

      // Group exact matches first, then partial matches
      combinedResults = [...taggedPill, ...taggedWeeb, ...taggedDex];
    }

    // Sort to prioritize exact title matches at index 0
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      combinedResults.sort((a, b) => {
        const aExact = a.title.toLowerCase() === q;
        const bExact = b.title.toLowerCase() === q;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        const aStarts = a.title.toLowerCase().startsWith(q);
        const bStarts = b.title.toLowerCase().startsWith(q);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        return 0;
      });
    }

    return NextResponse.json({
      success: true,
      data: combinedResults,
      count: combinedResults.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to search manga" },
      { status: 500 }
    );
  }
}
