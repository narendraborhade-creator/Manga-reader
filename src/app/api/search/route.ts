import { NextRequest, NextResponse } from "next/server";
import { searchMangaDex } from "@/lib/adapters/mangadex";
import { searchAllManga } from "@/lib/adapters/allmanga";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get("q") || "";
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "24", 10);
    const source = req.nextUrl.searchParams.get("source") || "all";

    let combinedResults: any[] = [];

    if (source === "allmanga") {
      combinedResults = await searchAllManga(query, limit);
    } else if (source === "mangadex") {
      combinedResults = await searchMangaDex(query, limit);
    } else {
      // Fetch concurrently from both MangaDex and AllManga
      const [mangaDexResults, allMangaResults] = await Promise.all([
        searchMangaDex(query, Math.ceil(limit / 2)).catch(() => []),
        searchAllManga(query, Math.ceil(limit / 2)).catch(() => []),
      ]);

      // Tag each source clearly
      const taggedMangaDex = mangaDexResults.map((m) => ({
        ...m,
        source: "MANGADEX",
      }));
      const taggedAllManga = allMangaResults.map((m) => ({
        ...m,
        source: "ALLMANGA",
      }));

      // Interleave or combine results
      combinedResults = [...taggedMangaDex, ...taggedAllManga];
    }

    // Sort to ensure exact title matches always appear first
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
