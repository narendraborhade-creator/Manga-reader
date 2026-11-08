import { NextRequest, NextResponse } from "next/server";
import { fetchMangaDexDetails, fetchMangaDexChapterFeed, searchMangaDex } from "@/lib/adapters/mangadex";
import { fetchMangaPillDetails, searchMangaPill } from "@/lib/adapters/mangapill";
import { fetchWeebCentralDetails, searchWeebCentral } from "@/lib/adapters/weebcentral";
import { fetchAllMangaDetails, searchAllManga } from "@/lib/adapters/allmanga";
import { fetchRichMangaMetadata } from "@/lib/adapters/anilist";
import { unifyAndSortChapters } from "@/lib/aggregator";

export const dynamic = "force-dynamic";

function cleanKey(t: string): string {
  return t.toLowerCase().replace(/[^a-z0-9]/g, "");
}

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

    // 1. Handle MangaPill Source Directly
    if (id.startsWith("mangapill-")) {
      const pillData = await fetchMangaPillDetails(id);
      if (!pillData) {
        return NextResponse.json(
          { success: false, error: "Series not found on MangaPill" },
          { status: 404 }
        );
      }

      // Concurrently check WeebCentral & AniList to maximize chapter count & rich banners
      const [weebMatches, richMeta] = await Promise.all([
        searchWeebCentral(pillData.title, 3).catch(() => []),
        fetchRichMangaMetadata(pillData.title).catch(() => ({ source: "NONE", data: null })),
      ]);

      let allChapters = pillData.chapters.map((ch) => ({
        externalChapId: ch.id,
        mangaExternalId: pillData.id,
        mangaTitle: pillData.title,
        coverUrl: pillData.coverUrl,
        chapterNumber: ch.chapterNumber,
        volumeNumber: null,
        title: ch.title,
        language: "en",
        scanlator: "Mihon / MangaPill Stream",
        publishedAt: new Date().toISOString(),
        sourceId: "mangapill",
        sourceType: "MANGAPILL" as any,
        pageCount: 0,
      }));

      // If WeebCentral has a close match, merge its chapters
      if (weebMatches.length > 0) {
        const targetWeeb =
          weebMatches.find((w) => cleanKey(w.title) === cleanKey(pillData.title)) ||
          weebMatches[0];
        const weebData = await fetchWeebCentralDetails(targetWeeb.id).catch(() => null);
        if (weebData?.chapters?.length) {
          const weebNorm = weebData.chapters.map((ch) => ({
            externalChapId: ch.id,
            mangaExternalId: pillData.id,
            mangaTitle: pillData.title,
            coverUrl: pillData.coverUrl,
            chapterNumber: ch.chapterNumber,
            volumeNumber: null,
            title: ch.title,
            language: "en",
            scanlator: "Mihon / WeebCentral Stream",
            publishedAt: new Date().toISOString(),
            sourceId: "weebcentral",
            sourceType: "WEEBCENTRAL" as any,
            pageCount: 0,
          }));
          allChapters = [...allChapters, ...weebNorm];
        }
      }

      const chapterGroups = unifyAndSortChapters(allChapters as any);
      const meta = (richMeta?.data || {}) as any;

      return NextResponse.json({
        success: true,
        data: {
          id: pillData.id,
          title: pillData.title,
          altTitles: [],
          description: pillData.description || meta.description || meta.synopsis || "No synopsis available.",
          coverUrl: pillData.coverUrl,
          bannerUrl: meta.bannerImage || pillData.coverUrl,
          status: pillData.status,
          score: meta.averageScore || meta.score || 92,
          year: null,
          author: "Manga Scanlation",
          artist: "Manga Scanlation",
          genres: pillData.genres.length ? pillData.genres : meta.genres || [],
          totalChapters: chapterGroups.length,
          chapterGroups,
          sourceType: "MANGAPILL",
        },
      });
    }

    // 2. Handle WeebCentral Source Directly
    if (id.startsWith("weebcentral-")) {
      const weebData = await fetchWeebCentralDetails(id);
      if (!weebData) {
        return NextResponse.json(
          { success: false, error: "Series not found on WeebCentral" },
          { status: 404 }
        );
      }

      // Concurrently check MangaPill & AniList
      const [pillMatches, richMeta] = await Promise.all([
        searchMangaPill(weebData.title, 3).catch(() => []),
        fetchRichMangaMetadata(weebData.title).catch(() => ({ source: "NONE", data: null })),
      ]);

      let allChapters = weebData.chapters.map((ch) => ({
        externalChapId: ch.id,
        mangaExternalId: weebData.id,
        mangaTitle: weebData.title,
        coverUrl: weebData.coverUrl,
        chapterNumber: ch.chapterNumber,
        volumeNumber: null,
        title: ch.title,
        language: "en",
        scanlator: "Mihon / WeebCentral Stream",
        publishedAt: new Date().toISOString(),
        sourceId: "weebcentral",
        sourceType: "WEEBCENTRAL" as any,
        pageCount: 0,
      }));

      if (pillMatches.length > 0) {
        const targetPill =
          pillMatches.find((p) => cleanKey(p.title) === cleanKey(weebData.title)) ||
          pillMatches[0];
        const pillData = await fetchMangaPillDetails(targetPill.id).catch(() => null);
        if (pillData?.chapters?.length) {
          const pillNorm = pillData.chapters.map((ch) => ({
            externalChapId: ch.id,
            mangaExternalId: weebData.id,
            mangaTitle: weebData.title,
            coverUrl: weebData.coverUrl,
            chapterNumber: ch.chapterNumber,
            volumeNumber: null,
            title: ch.title,
            language: "en",
            scanlator: "Mihon / MangaPill Stream",
            publishedAt: new Date().toISOString(),
            sourceId: "mangapill",
            sourceType: "MANGAPILL" as any,
            pageCount: 0,
          }));
          allChapters = [...allChapters, ...pillNorm];
        }
      }

      const chapterGroups = unifyAndSortChapters(allChapters as any);
      const meta = (richMeta?.data || {}) as any;

      return NextResponse.json({
        success: true,
        data: {
          id: weebData.id,
          title: weebData.title,
          altTitles: [],
          description: weebData.description || meta.description || meta.synopsis || "No synopsis available.",
          coverUrl: weebData.coverUrl,
          bannerUrl: meta.bannerImage || weebData.coverUrl,
          status: weebData.status,
          score: meta.averageScore || meta.score || 95,
          year: null,
          author: weebData.authors.join(", ") || "Manga Creator",
          artist: "Manga Creator",
          genres: weebData.genres.length ? weebData.genres : meta.genres || [],
          totalChapters: chapterGroups.length,
          chapterGroups,
          sourceType: "WEEBCENTRAL",
        },
      });
    }

    // 3. Handle AllManga Source Directly
    if (id.startsWith("allmanga-")) {
      const allData = await fetchAllMangaDetails(id);
      if (!allData) {
        return NextResponse.json(
          { success: false, error: "Series not found on AllManga" },
          { status: 404 }
        );
      }

      const [pillMatches, weebMatches, richMeta] = await Promise.all([
        searchMangaPill(allData.title, 2).catch(() => []),
        searchWeebCentral(allData.title, 2).catch(() => []),
        fetchRichMangaMetadata(allData.title).catch(() => ({ source: "NONE", data: null })),
      ]);

      let allChapters = allData.chapters.map((ch) => ({
        externalChapId: ch.id,
        mangaExternalId: allData.id,
        mangaTitle: allData.title,
        coverUrl: allData.coverUrl,
        chapterNumber: ch.chapterNumber,
        volumeNumber: null,
        title: ch.title,
        language: "en",
        scanlator: "Mihon / AllManga Engine",
        publishedAt: new Date().toISOString(),
        sourceId: "allmanga",
        sourceType: "ALLMANGA" as any,
        pageCount: 0,
      }));

      if (pillMatches.length > 0) {
        const pillData = await fetchMangaPillDetails(pillMatches[0].id).catch(() => null);
        if (pillData?.chapters?.length) {
          const pillNorm = pillData.chapters.map((ch) => ({
            externalChapId: ch.id,
            mangaExternalId: allData.id,
            mangaTitle: allData.title,
            coverUrl: allData.coverUrl,
            chapterNumber: ch.chapterNumber,
            volumeNumber: null,
            title: ch.title,
            language: "en",
            scanlator: "Mihon / MangaPill Mirror",
            publishedAt: new Date().toISOString(),
            sourceId: "mangapill",
            sourceType: "MANGAPILL" as any,
            pageCount: 0,
          }));
          allChapters = [...allChapters, ...pillNorm];
        }
      }

      const chapterGroups = unifyAndSortChapters(allChapters as any);
      const meta = (richMeta?.data || {}) as any;

      return NextResponse.json({
        success: true,
        data: {
          id: allData.id,
          title: allData.title,
          altTitles: [],
          description: allData.description || meta.description || meta.synopsis || "No synopsis available.",
          coverUrl: allData.coverUrl,
          bannerUrl: meta.bannerImage || allData.coverUrl,
          status: allData.status,
          score: meta.averageScore || meta.score || 91,
          year: null,
          author: allData.authors.join(", ") || "Manga Creator",
          artist: "Manga Creator",
          genres: allData.genres.length ? allData.genres : meta.genres || [],
          totalChapters: chapterGroups.length,
          chapterGroups,
          sourceType: "ALLMANGA",
        },
      });
    }

    // 4. Handle MangaDex Source (and cross-merge with AllManga, MangaPill & WeebCentral)
    const mangaDexData = await fetchMangaDexDetails(id);
    if (!mangaDexData) {
      return NextResponse.json(
        { success: false, error: "Manga not found" },
        { status: 404 }
      );
    }

    const canonicalTitle = mangaDexData.title;

    // Search query terms: canonical English title first, then raw title, then altTitles
    const candidateTerms = Array.from(
      new Set([canonicalTitle, ...(mangaDexData.altTitles?.slice(0, 4) || [])])
    ).filter(Boolean);

    // Concurrently fetch Rich Metadata, MangaDex Chapters, MangaPill search, WeebCentral search, AllManga search
    const [richMeta, rawChapters, pillSearches, weebSearches, allSearches] = await Promise.all([
      fetchRichMangaMetadata(canonicalTitle).catch(() => ({ source: "NONE", data: null })),
      fetchMangaDexChapterFeed(id, lang).catch(() => []),
      Promise.all(candidateTerms.map((t) => searchMangaPill(t, 2).catch(() => []))),
      Promise.all(candidateTerms.map((t) => searchWeebCentral(t, 2).catch(() => []))),
      Promise.all(candidateTerms.map((t) => searchAllManga(t, 2).catch(() => []))),
    ]);

    // Flatten search matches
    const allPillMatches = pillSearches.flat();
    const allWeebMatches = weebSearches.flat();
    const allAllMangaMatches = allSearches.flat();

    const bestPill =
      allPillMatches.find((p) => cleanKey(p.title) === cleanKey(canonicalTitle)) ||
      allPillMatches[0];

    const bestWeeb =
      allWeebMatches.find((w) => cleanKey(w.title) === cleanKey(canonicalTitle)) ||
      allWeebMatches[0];

    const bestAllManga =
      allAllMangaMatches.find((a) => cleanKey(a.title) === cleanKey(canonicalTitle)) ||
      allAllMangaMatches.find((a) => candidateTerms.some((t) => cleanKey(a.title) === cleanKey(t))) ||
      allAllMangaMatches[0];

    // Concurrently fetch chapter feeds from all alternate sources
    const [pillDetails, weebDetails, allMangaDetails] = await Promise.all([
      bestPill ? fetchMangaPillDetails(bestPill.id).catch(() => null) : null,
      bestWeeb ? fetchWeebCentralDetails(bestWeeb.id).catch(() => null) : null,
      bestAllManga ? fetchAllMangaDetails(bestAllManga.id).catch(() => null) : null,
    ]);

    // Base MangaDex chapters
    const normalizedChapters = rawChapters.map((ch) => ({
      ...ch,
      mangaTitle: canonicalTitle,
      coverUrl: mangaDexData.coverUrl,
    }));

    let allChapters: any[] = [...normalizedChapters];

    // Merge AllManga chapters (often contains 20-100+ chapters for manhwa/webtoons where MangaDex only has teasers)
    if (allMangaDetails?.chapters?.length) {
      const allNorm = allMangaDetails.chapters.map((ch) => ({
        externalChapId: ch.id,
        mangaExternalId: mangaDexData.id,
        mangaTitle: canonicalTitle,
        coverUrl: mangaDexData.coverUrl,
        chapterNumber: ch.chapterNumber,
        volumeNumber: null,
        title: ch.title,
        language: "en",
        scanlator: "Mihon / AllManga Stream",
        publishedAt: new Date().toISOString(),
        sourceId: "allmanga",
        sourceType: "ALLMANGA" as any,
        pageCount: 0,
      }));
      allChapters = [...allChapters, ...allNorm];
    }

    // Merge MangaPill chapters
    if (pillDetails?.chapters?.length) {
      const pillNorm = pillDetails.chapters.map((ch) => ({
        externalChapId: ch.id,
        mangaExternalId: mangaDexData.id,
        mangaTitle: canonicalTitle,
        coverUrl: mangaDexData.coverUrl,
        chapterNumber: ch.chapterNumber,
        volumeNumber: null,
        title: ch.title,
        language: "en",
        scanlator: "Mihon / MangaPill Mirror",
        publishedAt: new Date().toISOString(),
        sourceId: "mangapill",
        sourceType: "MANGAPILL" as any,
        pageCount: 0,
      }));
      allChapters = [...allChapters, ...pillNorm];
    }

    // Merge WeebCentral chapters
    if (weebDetails?.chapters?.length) {
      const weebNorm = weebDetails.chapters.map((ch) => ({
        externalChapId: ch.id,
        mangaExternalId: mangaDexData.id,
        mangaTitle: canonicalTitle,
        coverUrl: mangaDexData.coverUrl,
        chapterNumber: ch.chapterNumber,
        volumeNumber: null,
        title: ch.title,
        language: "en",
        scanlator: "Mihon / WeebCentral HD Stream",
        publishedAt: new Date().toISOString(),
        sourceId: "weebcentral",
        sourceType: "WEEBCENTRAL" as any,
        pageCount: 0,
      }));
      allChapters = [...allChapters, ...weebNorm];
    }

    const chapterGroups = unifyAndSortChapters(allChapters);

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
        title: canonicalTitle,
        altTitles: mangaDexData.altTitles,
        description: enrichedSynopsis || "No synopsis available.",
        coverUrl: mangaDexData.coverUrl,
        bannerUrl: enrichedBanner || null,
        status: mangaDexData.status,
        score: enrichedScore || null,
        year: mangaDexData.year || null,
        author: mangaDexData.author || "Manga Creator",
        artist: mangaDexData.artist || "Manga Creator",
        genres: enrichedGenres,
        totalChapters: chapterGroups.length,
        chapterGroups,
        sourceType: "UNIFIED",
        alternateAllManga: allMangaDetails
          ? {
              id: allMangaDetails.id,
              title: allMangaDetails.title,
              totalChapters: allMangaDetails.chapters.length,
            }
          : null,
      },
    });
  } catch (error: any) {
    console.error("Manga details error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load manga details" },
      { status: 500 }
    );
  }
}
