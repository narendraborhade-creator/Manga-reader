import { NextRequest, NextResponse } from "next/server";
import { fetchMangaDexDetails, fetchMangaDexChapterFeed } from "@/lib/adapters/mangadex";
import { fetchRichMangaMetadata } from "@/lib/adapters/anilist";
import { unifyAndSortChapters } from "@/lib/aggregator";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lang = req.nextUrl.searchParams.get("lang") || "en";

    // 1. Fetch MangaDex Details
    const mangaDexData = await fetchMangaDexDetails(id);
    if (!mangaDexData) {
      return NextResponse.json(
        { success: false, error: "Manga not found" },
        { status: 404 }
      );
    }

    // 2. Fetch Rich Metadata (AniList / Jikan / Kitsu)
    const richMeta = await fetchRichMangaMetadata(mangaDexData.title);

    // 3. Fetch all chapters for this series
    const rawChapters = await fetchMangaDexChapterFeed(id, lang);

    // Attach manga title & cover to chapters
    const normalizedChapters = rawChapters.map((ch) => ({
      ...ch,
      mangaTitle: mangaDexData.title,
      coverUrl: mangaDexData.coverUrl,
    }));

    // 4. Unify and Sort chapters
    const chapterGroups = unifyAndSortChapters(normalizedChapters);

    // Merge rich metadata
    let enrichedBanner: string | undefined = undefined;
    let enrichedScore: number | undefined = undefined;
    let enrichedGenres: string[] = mangaDexData.tags;
    let enrichedSynopsis = mangaDexData.description;

    if (richMeta.data) {
      const data = richMeta.data as any;
      if (data.bannerImage) enrichedBanner = data.bannerImage;
      if (data.averageScore) enrichedScore = data.averageScore;
      if (data.score) enrichedScore = data.score;
      if (data.genres && data.genres.length > 0) enrichedGenres = data.genres;
      if (!enrichedSynopsis && data.description) enrichedSynopsis = data.description;
      if (!enrichedSynopsis && data.synopsis) enrichedSynopsis = data.synopsis;
    }

    return NextResponse.json({
      success: true,
      data: {
        id: mangaDexData.id,
        title: mangaDexData.title,
        altTitles: mangaDexData.altTitles,
        description: enrichedSynopsis || "No synopsis available.",
        coverUrl: mangaDexData.coverUrl,
        bannerUrl: enrichedBanner || null,
        status: mangaDexData.status,
        score: enrichedScore || null,
        year: mangaDexData.year || null,
        author: mangaDexData.author || "Unknown",
        artist: mangaDexData.artist || "Unknown",
        genres: enrichedGenres,
        totalChapters: normalizedChapters.length,
        chapterGroups,
      },
    });
  } catch (error: any) {
    console.error("Manga detail route error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load manga details" },
      { status: 500 }
    );
  }
}
