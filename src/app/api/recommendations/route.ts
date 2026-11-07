import { NextRequest, NextResponse } from "next/server";
import { fetchAniListPopular, fetchAniListTrending } from "@/lib/adapters/anilist";
import { searchMangaDex } from "@/lib/adapters/mangadex";
import { searchAllManga } from "@/lib/adapters/allmanga";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const source = req.nextUrl.searchParams.get("source") || "all";
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "12", 10);

    if (source === "anilist") {
      const aniList = await fetchAniListPopular(limit);
      const items = aniList.map((m) => ({
        id: `anilist-${m.id}`,
        title: m.title.english || m.title.romaji || "Sacred Series",
        coverUrl: m.coverImage?.extraLarge || m.coverImage?.large || "/placeholder-manga.jpg",
        status: m.status || "RELEASING",
        score: m.averageScore,
        genres: m.genres,
        source: "ANILIST",
      }));
      return NextResponse.json({ success: true, source: "ANILIST", data: items });
    }

    if (source === "allmanga") {
      const allManga = await searchAllManga("Piece", limit);
      return NextResponse.json({ success: true, source: "ALLMANGA", data: allManga });
    }

    if (source === "mangadex") {
      const mangaDex = await searchMangaDex("", limit);
      const tagged = mangaDex.map((m) => ({ ...m, source: "MANGADEX" }));
      return NextResponse.json({ success: true, source: "MANGADEX", data: tagged });
    }

    // Default: Combined recommendations across AniList, MangaDex, and AllManga
    const [aniList, mangaDex, allManga] = await Promise.all([
      fetchAniListTrending(6).catch(() => []),
      searchMangaDex("", 6).catch(() => []),
      searchAllManga("", 6).catch(() => []),
    ]);

    const aniFormatted = aniList.map((m) => ({
      id: `anilist-${m.id}`,
      title: m.title.english || m.title.romaji || "Sacred Series",
      coverUrl: m.coverImage?.extraLarge || m.coverImage?.large || "/placeholder-manga.jpg",
      status: m.status || "RELEASING",
      score: m.averageScore,
      genres: m.genres,
      source: "ANILIST",
    }));

    const dexFormatted = mangaDex.map((m) => ({ ...m, source: "MANGADEX" }));
    const allFormatted = allManga.map((m) => ({ ...m, source: "ALLMANGA" }));

    const combined = [...dexFormatted, ...allFormatted, ...aniFormatted];

    return NextResponse.json({
      success: true,
      source: "ALL",
      data: combined,
      count: combined.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch recommendations" },
      { status: 500 }
    );
  }
}
