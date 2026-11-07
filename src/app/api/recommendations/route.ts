import { NextRequest, NextResponse } from "next/server";
import { fetchAniListPopular, fetchAniListTrending } from "@/lib/adapters/anilist";
import { searchMangaDex } from "@/lib/adapters/mangadex";
import { searchMangaPill } from "@/lib/adapters/mangapill";
import { searchWeebCentral } from "@/lib/adapters/weebcentral";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const source = (req.nextUrl.searchParams.get("source") || "all").toLowerCase();
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "12", 10);

    if (source === "mangapill") {
      const pill = await searchMangaPill("Piece", limit);
      return NextResponse.json({ success: true, source: "MANGAPILL", data: pill });
    }

    if (source === "weebcentral") {
      const weeb = await searchWeebCentral("Piece", limit);
      return NextResponse.json({ success: true, source: "WEEBCENTRAL", data: weeb });
    }

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

    if (source === "mangadex") {
      const mangaDex = await searchMangaDex("", limit);
      const tagged = mangaDex.map((m) => ({ ...m, source: "MANGADEX" }));
      return NextResponse.json({ success: true, source: "MANGADEX", data: tagged });
    }

    // Default: Multi-Source Curated Recommendations across MangaPill, WeebCentral, MangaDex, and AniList
    const [pillRes, weebRes, dexRes, aniList] = await Promise.all([
      searchMangaPill("One", 6).catch(() => []),
      searchWeebCentral("Piece", 6).catch(() => []),
      searchMangaDex("", 6).catch(() => []),
      fetchAniListTrending(6).catch(() => []),
    ]);

    const pillFormatted = pillRes.map((m) => ({ ...m, source: "MANGAPILL" }));
    const weebFormatted = weebRes.map((m) => ({ ...m, source: "WEEBCENTRAL" }));
    const dexFormatted = dexRes.map((m) => ({ ...m, source: "MANGADEX" }));
    const aniFormatted = aniList.map((m) => ({
      id: `anilist-${m.id}`,
      title: m.title.english || m.title.romaji || "Sacred Series",
      coverUrl: m.coverImage?.extraLarge || m.coverImage?.large || "/placeholder-manga.jpg",
      status: m.status || "RELEASING",
      score: m.averageScore,
      genres: m.genres,
      source: "ANILIST",
    }));

    const combined = [...pillFormatted, ...weebFormatted, ...dexFormatted, ...aniFormatted];

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
