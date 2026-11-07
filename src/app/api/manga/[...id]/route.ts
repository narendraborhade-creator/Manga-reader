import { NextRequest, NextResponse } from "next/server";
import { fetchMangaDexDetails, fetchMangaDexChapterFeed } from "@/lib/adapters/mangadex";
import { fetchMangaPillDetails, searchMangaPill } from "@/lib/adapters/mangapill";
import { fetchWeebCentralDetails, searchWeebCentral } from "@/lib/adapters/weebcentral";
import { fetchAllMangaDetails } from "@/lib/adapters/allmanga";
import { fetchRichMangaMetadata } from "@/lib/adapters/anilist";
import { unifyAndSortChapters } from "@/lib/aggregator";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string | string[] }> }
) {
  try {
    const { id: rawId } = await params;
    const id = Array.isArray(rawId)
      ? rawId.map(decodeURIComponent).join("/")
      : decodeURIComponent(rawId || "");
    const lang = req.nextUrl.searchParams.get("lang") || "en";

    // 1. Handle MangaPill Source
    if (id.startsWith("mangapill-")) {
      const data = await fetchMangaPillDetails(id);
      if (!data) {
        return NextResponse.json(
          { success: false, error: "MangaPill series not found" },
          { status: 404 }
        );
      }

      const normalizedChapters = data.chapters.map((ch) => ({
        externalChapId: ch.id,
        mangaExternalId: data.id,
        mangaTitle: data.title,
        coverUrl: data.coverUrl,
        chapterNumber: ch.chapterNumber,
        volumeNumber: null,
        title: ch.title,
        language: "en",
        scanlator: ch.sourceName,
        publishedAt: new Date().toISOString(),
        sourceId: "mangapill",
        sourceType: "MANGAPILL" as any,
        pageCount: 0,
      }));

      const chapterGroups = unifyAndSortChapters(normalizedChapters as any);

      return NextResponse.json({
        success: true,
        data: {
          id: data.id,
          title: data.title,
          altTitles: [],
          description: data.description,
          coverUrl: data.coverUrl,
          bannerUrl: data.coverUrl,
          status: data.status,
          score: 92,
          year: null,
          author: "Unknown",
          artist: "Unknown",
          genres: data.genres,
          totalChapters: data.totalChapters,
          chapterGroups,
          sourceType: "MANGAPILL",
        },
      });
    }

    // 2. Handle WeebCentral Source
    if (id.startsWith("weebcentral-")) {
      const data = await fetchWeebCentralDetails(id);
      if (!data) {
        return NextResponse.json(
          { success: false, error: "WeebCentral series not found" },
          { status: 404 }
        );
      }

      const normalizedChapters = data.chapters.map((ch) => ({
        externalChapId: ch.id,
        mangaExternalId: data.id,
        mangaTitle: data.title,
        coverUrl: data.coverUrl,
        chapterNumber: ch.chapterNumber,
        volumeNumber: null,
        title: ch.title,
        language: "en",
        scanlator: ch.sourceName,
        publishedAt: new Date().toISOString(),
        sourceId: "weebcentral",
        sourceType: "WEEBCENTRAL" as any,
        pageCount: 0,
      }));

      const chapterGroups = unifyAndSortChapters(normalizedChapters as any);

      return NextResponse.json({
        success: true,
        data: {
          id: data.id,
          title: data.title,
          altTitles: [],
          description: data.description,
          coverUrl: data.coverUrl,
          bannerUrl: data.coverUrl,
          status: data.status,
          score: 95,
          year: null,
          author: data.authors.join(", ") || "Unknown",
          artist: "Unknown",
          genres: data.genres,
          totalChapters: data.totalChapters,
          chapterGroups,
          sourceType: "WEEBCENTRAL",
        },
      });
    }

    // 3. Handle AllManga Source
    if (id.startsWith("allmanga-")) {
      const allMangaData = await fetchAllMangaDetails(id);
      if (!allMangaData) {
        return NextResponse.json(
          { success: false, error: "AllManga series not found" },
          { status: 404 }
        );
      }

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
        sourceType: "ALLMANGA" as any,
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

    // 4. Handle MangaDex Source
    const mangaDexData = await fetchMangaDexDetails(id);
    if (!mangaDexData) {
      return NextResponse.json(
        { success: false, error: "Manga not found" },
        { status: 404 }
      );
    }

    // Concurrently fetch Rich Metadata, MangaDex Chapters, and alternative sources (MangaPill, WeebCentral)
    const [richMeta, rawChapters, pillMatches, weebMatches] = await Promise.all([
      fetchRichMangaMetadata(mangaDexData.title).catch(() => ({ source: "NONE", data: null })),
      fetchMangaDexChapterFeed(id, lang).catch(() => []),
      searchMangaPill(mangaDexData.title, 1).catch(() => []),
      searchWeebCentral(mangaDexData.title, 1).catch(() => []),
    ]);

    // Attach manga title & cover to chapters
    const normalizedChapters = rawChapters.map((ch) => ({
      ...ch,
      mangaTitle: mangaDexData.title,
      coverUrl: mangaDexData.coverUrl,
    }));

    // If MangaDex has 0 chapters (or Shueisha external chapters taken down), merge chapters from MangaPill or WeebCentral!
    let chapterGroups = unifyAndSortChapters(normalizedChapters);
    let fallbackNotice: string | null = null;

    if (chapterGroups.length === 0) {
      // Auto-fallback to MangaPill or WeebCentral so the user ALWAYS has chapters to read!
      if (pillMatches.length > 0) {
        const pillData = await fetchMangaPillDetails(pillMatches[0].id);
        if (pillData && pillData.chapters.length > 0) {
          const pillNorm = pillData.chapters.map((ch) => ({
            externalChapId: ch.id,
            mangaExternalId: mangaDexData.id,
            mangaTitle: mangaDexData.title,
            coverUrl: mangaDexData.coverUrl,
            chapterNumber: ch.chapterNumber,
            volumeNumber: null,
            title: ch.title,
            language: "en",
            scanlator: "MangaPill Cloud Stream",
            publishedAt: new Date().toISOString(),
            sourceId: "mangapill",
            sourceType: "MANGAPILL" as any,
            pageCount: 0,
          }));
          chapterGroups = unifyAndSortChapters(pillNorm as any);
          fallbackNotice = "Chapters streamed via high-speed MangaPill mirror (MangaDex has no hosted chapters).";
        }
      } else if (weebMatches.length > 0) {
        const weebData = await fetchWeebCentralDetails(weebMatches[0].id);
        if (weebData && weebData.chapters.length > 0) {
          const weebNorm = weebData.chapters.map((ch) => ({
            externalChapId: ch.id,
            mangaExternalId: mangaDexData.id,
            mangaTitle: mangaDexData.title,
            coverUrl: mangaDexData.coverUrl,
            chapterNumber: ch.chapterNumber,
            volumeNumber: null,
            title: ch.title,
            language: "en",
            scanlator: "WeebCentral Stream",
            publishedAt: new Date().toISOString(),
            sourceId: "weebcentral",
            sourceType: "WEEBCENTRAL" as any,
            pageCount: 0,
          }));
          chapterGroups = unifyAndSortChapters(weebNorm as any);
          fallbackNotice = "Chapters streamed via WeebCentral mirror.";
        }
      }
    }

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

    const alternateSources = {
      mangapill: pillMatches[0] ? { id: pillMatches[0].id, title: pillMatches[0].title } : null,
      weebcentral: weebMatches[0] ? { id: weebMatches[0].id, title: weebMatches[0].title } : null,
    };

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
        totalChapters: chapterGroups.length,
        chapterGroups,
        sourceType: "MANGADEX",
        fallbackNotice,
        alternateSources,
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
