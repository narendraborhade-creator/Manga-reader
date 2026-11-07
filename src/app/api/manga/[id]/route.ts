import { NextRequest, NextResponse } from "next/server";
import { fetchMangaDexDetails, fetchMangaDexChapterFeed } from "@/lib/adapters/mangadex";
import { fetchAllMangaDetails, searchAllManga } from "@/lib/adapters/allmanga";
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

    // 1. Handle AllManga Source Directly
    if (id.startsWith("allmanga-")) {
      const allMangaData = await fetchAllMangaDetails(id);
      if (!allMangaData) {
        return NextResponse.json(
          { success: false, error: "AllManga series not found" },
          { status: 404 }
        );
      }

      // Format AllManga chapters into unified chapter groups
      const normalizedChapters = allMangaData.chapters.map((ch) => ({
        externalChapId: ch.id,
        mangaExternalId: allMangaData.id,
        mangaTitle: allMangaData.title,
        coverUrl: allMangaData.coverUrl,
        chapterNumber: ch.chapterNumber,
        volumeNumber: null,
        title: ch.title,
        language: "en",
        scanlator: ch.sourceName,
        publishedAt: new Date().toISOString(),
        sourceId: "allmanga",
        sourceType: "ALLMANGA" as const,
        pageCount: 0,
      }));

      const chapterGroups = unifyAndSortChapters(normalizedChapters as any);

      return NextResponse.json({
        success: true,
        data: {
          id: allMangaData.id,
          title: allMangaData.title,
          altTitles: [],
          description: allMangaData.description || "No synopsis available.",
          coverUrl: allMangaData.coverUrl,
          bannerUrl: allMangaData.coverUrl,
          status: allMangaData.status,
          score: 88,
          year: null,
          author: allMangaData.authors.join(", ") || "Unknown",
          artist: "Unknown",
          genres: allMangaData.genres,
          totalChapters: allMangaData.totalChapters,
          chapterGroups,
          sourceType: "ALLMANGA",
        },
      });
    }

    // 2. Handle MangaDex Source
    const mangaDexData = await fetchMangaDexDetails(id);
    if (!mangaDexData) {
      return NextResponse.json(
        { success: false, error: "Manga not found" },
        { status: 404 }
      );
    }

    // Concurrently fetch Rich Metadata, MangaDex Chapters, and AllManga counterpart
    const [richMeta, rawChapters, allMangaMatches] = await Promise.all([
      fetchRichMangaMetadata(mangaDexData.title).catch(() => ({ source: "NONE", data: null })),
      fetchMangaDexChapterFeed(id, lang).catch(() => []),
      searchAllManga(mangaDexData.title, 1).catch(() => []),
    ]);

    // Attach manga title & cover to chapters
    const normalizedChapters = rawChapters.map((ch) => ({
      ...ch,
      mangaTitle: mangaDexData.title,
      coverUrl: mangaDexData.coverUrl,
    }));

    // Unify and Sort chapters
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

    const alternateAllManga = allMangaMatches[0]
      ? {
          id: allMangaMatches[0].id,
          title: allMangaMatches[0].title,
          totalChapters: allMangaMatches[0].totalChapters,
        }
      : null;

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
        sourceType: "MANGADEX",
        alternateAllManga,
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
