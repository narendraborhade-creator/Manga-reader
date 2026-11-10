import { NextRequest, NextResponse } from "next/server";
import { fetchMangaDexDetails, fetchMangaDexChapterFeed, searchMangaDex } from "@/lib/adapters/mangadex";
import { fetchMangaPillDetails, searchMangaPill } from "@/lib/adapters/mangapill";
import { fetchWeebCentralDetails, searchWeebCentral } from "@/lib/adapters/weebcentral";
import { fetchAllMangaDetails, searchAllManga } from "@/lib/adapters/allmanga";
import { fetchAsuraDetails, searchAsura } from "@/lib/adapters/asura";
import { fetchMangaKatanaDetails, searchMangaKatana } from "@/lib/adapters/mangakatana";
import { fetchRichMangaMetadata } from "@/lib/adapters/anilist";
import { unifyAndSortChapters, cleanKey, isStrictTitleMatch } from "@/lib/aggregator";

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

    // 0. Handle AniList Source Directly (map to MangaDex, AllManga, MangaPill, or WeebCentral)
    if (id.startsWith("anilist-")) {
      const anilistId = id.replace(/^anilist-/, "");
      const q = `query($id: Int) {
        Media(id: $id, type: MANGA) {
          id
          title { english romaji native }
          description
          coverImage { extraLarge large }
          bannerImage
          status
          averageScore
          genres
        }
      }`;
      const alRes = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, variables: { id: parseInt(anilistId, 10) } }),
        signal: AbortSignal.timeout(6000),
      }).catch(() => null);

      let alMedia: any = null;
      if (alRes && alRes.ok) {
        const json = await alRes.json();
        alMedia = json.data?.Media;
      }

      const searchTitles = alMedia
        ? [alMedia.title.english, alMedia.title.romaji, alMedia.title.native].filter(Boolean)
        : [];

      let resolvedMangaId: string | null = null;
      for (const st of searchTitles) {
        const [katanaM, dexM, allM, pillM, weebM, asuraM] = await Promise.all([
          searchMangaKatana(st, 3).catch(() => []),
          searchMangaDex(st, 3).catch(() => []),
          searchAllManga(st, 3).catch(() => []),
          searchMangaPill(st, 3).catch(() => []),
          searchWeebCentral(st, 3).catch(() => []),
          searchAsura(st, 3).catch(() => []),
        ]);

        const katanaFound = katanaM.find((m) => isStrictTitleMatch(m.title, searchTitles));
        if (katanaFound && (katanaFound.totalChapters || 0) > 0) {
          resolvedMangaId = katanaFound.id;
          break;
        }
        const asuraFound = asuraM.find((m) => isStrictTitleMatch(m.title, searchTitles));
        if (asuraFound && (asuraFound.totalChapters || 0) > 0) {
          resolvedMangaId = asuraFound.id;
          break;
        }
        const weebFound = weebM.find((m) => isStrictTitleMatch(m.title, searchTitles));
        if (weebFound) {
          resolvedMangaId = weebFound.id;
          break;
        }
        const dexFound = dexM.find((m) => isStrictTitleMatch(m.title, searchTitles));
        if (dexFound) {
          resolvedMangaId = dexFound.id;
          break;
        }
        const allFound = allM.find((m) => isStrictTitleMatch(m.title, searchTitles));
        if (allFound) {
          resolvedMangaId = allFound.id;
          break;
        }
        const pillFound = pillM.find((m) => isStrictTitleMatch(m.title, searchTitles));
        if (pillFound) {
          resolvedMangaId = pillFound.id;
          break;
        }
        if (katanaFound) {
          resolvedMangaId = katanaFound.id;
          break;
        }
      }

      if (resolvedMangaId) {
        return GET(
          new NextRequest(new URL(`/api/manga/${resolvedMangaId}`, req.url)),
          { params: Promise.resolve({ id: resolvedMangaId }) }
        );
      }
    }

    // 0.5. Handle Asura Source Directly
    if (id.startsWith("asura-")) {
      const parts = id.replace(/^asura-/, "").split("/").filter(Boolean);
      const seriesSlug = parts[0];
      const asuraData = await fetchAsuraDetails(seriesSlug);
      if (!asuraData) {
        return NextResponse.json(
          { success: false, error: "Series not found on Asura Scans" },
          { status: 404 }
        );
      }

      const [richMeta, katanaMatches] = await Promise.all([
        fetchRichMangaMetadata(asuraData.title).catch(() => ({ source: "NONE", data: null })),
        searchMangaKatana(asuraData.title, 3).catch(() => []),
      ]);
      const meta = (richMeta?.data || {}) as any;

      let allChapters = asuraData.chapters.map((ch) => ({
        externalChapId: ch.id,
        mangaExternalId: asuraData.id,
        mangaTitle: asuraData.title,
        coverUrl: asuraData.coverUrl,
        chapterNumber: ch.chapterNumber,
        volumeNumber: null,
        title: ch.title,
        language: "en",
        scanlator: "Asura Scans HD Stream",
        publishedAt: ch.publishedAt,
        sourceId: "asura",
        sourceType: "ASURA" as any,
        pageCount: 0,
      }));

      const matchedKatana = katanaMatches.find((k) => isStrictTitleMatch(k.title, [asuraData.title, ...(asuraData.altTitles || [])]));
      if (matchedKatana) {
        const katanaData = await fetchMangaKatanaDetails(matchedKatana.id).catch(() => null);
        if (katanaData?.chapters?.length) {
          const katanaNorm = katanaData.chapters.map((ch) => ({
            externalChapId: ch.id,
            mangaExternalId: asuraData.id,
            mangaTitle: asuraData.title,
            coverUrl: asuraData.coverUrl,
            chapterNumber: ch.chapterNumber,
            volumeNumber: null,
            title: ch.title,
            language: "en",
            scanlator: "Mihon / MangaKatana Stream",
            publishedAt: new Date().toISOString(),
            sourceId: "mangakatana",
            sourceType: "MANGAKATANA" as any,
            pageCount: 0,
          }));
          allChapters = [...allChapters, ...katanaNorm];
        }
      }

      const chapterGroups = unifyAndSortChapters(allChapters as any);

      return NextResponse.json({
        success: true,
        data: {
          id: asuraData.id,
          title: asuraData.title,
          altTitles: asuraData.altTitles,
          description: asuraData.description || meta.description || meta.synopsis || "No synopsis available.",
          coverUrl: asuraData.coverUrl,
          bannerUrl: asuraData.bannerUrl || meta.bannerImage || asuraData.coverUrl,
          status: asuraData.status,
          score: meta.averageScore || meta.score || 94,
          year: null,
          author: "Manhwa Creator",
          artist: "Studio",
          genres: asuraData.genres,
          totalChapters: chapterGroups.length,
          chapterGroups,
          sourceType: "ASURA",
        },
      });
    }

    // 1. Handle MangaPill Source Directly
    if (id.startsWith("mangapill-")) {
      let pillData = await fetchMangaPillDetails(id);
      if (!pillData && id.includes("-")) {
        const match = id.match(/^mangapill-(\d+)(?:-\d+)?\/(.*)$/);
        if (match) {
          pillData = await fetchMangaPillDetails(`mangapill-${match[1]}/${match[2]}`);
        }
      }
      if (!pillData) {
        return NextResponse.json(
          { success: false, error: "Series not found on MangaPill" },
          { status: 404 }
        );
      }

      // Concurrently check WeebCentral, MangaKatana & AniList to maximize chapter count & rich banners
      const [weebMatches, katanaMatches, richMeta] = await Promise.all([
        searchWeebCentral(pillData.title, 3).catch(() => []),
        searchMangaKatana(pillData.title, 3).catch(() => []),
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

      // If WeebCentral has a strict match, merge its chapters
      if (weebMatches.length > 0) {
        const targetWeeb = weebMatches.find((w) => isStrictTitleMatch(w.title, [pillData.title]));
        if (targetWeeb) {
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
      }

      // If MangaKatana has a strict match, merge its complete archives
      if (katanaMatches.length > 0) {
        const targetKatana = katanaMatches.find((k) => isStrictTitleMatch(k.title, [pillData.title]));
        if (targetKatana) {
          const katanaData = await fetchMangaKatanaDetails(targetKatana.id).catch(() => null);
          if (katanaData?.chapters?.length) {
            const katanaNorm = katanaData.chapters.map((ch) => ({
              externalChapId: ch.id,
              mangaExternalId: pillData.id,
              mangaTitle: pillData.title,
              coverUrl: pillData.coverUrl,
              chapterNumber: ch.chapterNumber,
              volumeNumber: null,
              title: ch.title,
              language: "en",
              scanlator: "Mihon / MangaKatana Stream",
              publishedAt: new Date().toISOString(),
              sourceId: "mangakatana",
              sourceType: "MANGAKATANA" as any,
              pageCount: 0,
            }));
            allChapters = [...allChapters, ...katanaNorm];
          }
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

    // 2. Handle MangaKatana Source Directly
    if (id.startsWith("mangakatana-")) {
      const katanaData = await fetchMangaKatanaDetails(id);
      if (!katanaData) {
        return NextResponse.json(
          { success: false, error: "Series not found on MangaKatana" },
          { status: 404 }
        );
      }

      const richMeta = await fetchRichMangaMetadata(katanaData.title).catch(() => ({ source: "NONE", data: null }));

      const allChapters = katanaData.chapters.map((ch) => ({
        externalChapId: ch.id,
        mangaExternalId: katanaData.id,
        mangaTitle: katanaData.title,
        coverUrl: katanaData.coverUrl,
        chapterNumber: ch.chapterNumber,
        volumeNumber: null,
        title: ch.title,
        language: "en",
        scanlator: "Mihon / MangaKatana Stream",
        publishedAt: new Date().toISOString(),
        sourceId: "mangakatana",
        sourceType: "MANGAKATANA" as any,
        pageCount: 0,
      }));

      const chapterGroups = unifyAndSortChapters(allChapters as any);
      const meta = (richMeta?.data || {}) as any;

      return NextResponse.json({
        success: true,
        data: {
          id: katanaData.id,
          title: katanaData.title,
          altTitles: [],
          description: katanaData.description || meta.description || meta.synopsis || "No synopsis available.",
          coverUrl: meta?.coverImage?.extraLarge || meta?.coverImage?.large || katanaData.coverUrl,
          bannerUrl: meta.bannerImage || katanaData.coverUrl,
          status: katanaData.status,
          score: meta.averageScore || meta.score || 94,
          year: null,
          author: "Manga Author",
          artist: "Manga Artist",
          genres: katanaData.genres.length ? katanaData.genres : meta.genres || [],
          totalChapters: chapterGroups.length,
          chapterGroups,
          sourceType: "MANGAKATANA",
        },
      });
    }

    // 3. Handle WeebCentral Source Directly
    if (id.startsWith("weebcentral-")) {
      const weebData = await fetchWeebCentralDetails(id);
      if (!weebData) {
        return NextResponse.json(
          { success: false, error: "Series not found on WeebCentral" },
          { status: 404 }
        );
      }

      // Concurrently check MangaPill, MangaKatana & AniList
      const [pillMatches, katanaMatches, richMeta] = await Promise.all([
        searchMangaPill(weebData.title, 3).catch(() => []),
        searchMangaKatana(weebData.title, 3).catch(() => []),
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
        const targetPill = pillMatches.find((p) => isStrictTitleMatch(p.title, [weebData.title]));
        if (targetPill) {
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
      }

      if (katanaMatches.length > 0) {
        const targetKatana = katanaMatches.find((k) => isStrictTitleMatch(k.title, [weebData.title]));
        if (targetKatana) {
          const katanaData = await fetchMangaKatanaDetails(targetKatana.id).catch(() => null);
          if (katanaData?.chapters?.length) {
            const katanaNorm = katanaData.chapters.map((ch) => ({
              externalChapId: ch.id,
              mangaExternalId: weebData.id,
              mangaTitle: weebData.title,
              coverUrl: weebData.coverUrl,
              chapterNumber: ch.chapterNumber,
              volumeNumber: null,
              title: ch.title,
              language: "en",
              scanlator: "Mihon / MangaKatana Stream",
              publishedAt: new Date().toISOString(),
              sourceId: "mangakatana",
              sourceType: "MANGAKATANA" as any,
              pageCount: 0,
            }));
            allChapters = [...allChapters, ...katanaNorm];
          }
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
      const cleanMangaId = id.replace(/^allmanga-/, "").split("-")[0];
      const allData = await fetchAllMangaDetails(`allmanga-${cleanMangaId}`);
      if (!allData) {
        return NextResponse.json(
          { success: false, error: "Series not found on AllManga" },
          { status: 404 }
        );
      }

      const candidateTitles = [allData.title, ...(allData.altTitles || [])].filter(Boolean) as string[];

      const [asuraMatches, pillMatches, weebMatches, katanaMatches, richMeta] = await Promise.all([
        searchAsura(allData.title, 5).catch(() => []),
        searchMangaPill(allData.title, 5).catch(() => []),
        searchWeebCentral(allData.title, 5).catch(() => []),
        searchMangaKatana(allData.title, 5).catch(() => []),
        fetchRichMangaMetadata(allData.title).catch(() => ({ source: "NONE", data: null })),
      ]);

      const matchedAsura = asuraMatches.find((m) => isStrictTitleMatch(m.title, candidateTitles));
      const matchedPill = pillMatches.find((m) => isStrictTitleMatch(m.title, candidateTitles));
      const matchedWeeb = weebMatches.find((w) => isStrictTitleMatch(w.title, candidateTitles));
      const matchedKatana = katanaMatches.find((k) => isStrictTitleMatch(k.title, candidateTitles));

      const [asuraData, pillData, weebData, katanaData] = await Promise.all([
        matchedAsura ? fetchAsuraDetails(matchedAsura.id).catch(() => null) : null,
        matchedPill ? fetchMangaPillDetails(matchedPill.id).catch(() => null) : null,
        matchedWeeb ? fetchWeebCentralDetails(matchedWeeb.id).catch(() => null) : null,
        matchedKatana ? fetchMangaKatanaDetails(matchedKatana.id).catch(() => null) : null,
      ]);

      const meta = (richMeta?.data || {}) as any;
      const bestCover =
        (meta.coverImage?.extraLarge && meta.coverImage.extraLarge.includes("anilist.co"))
          ? meta.coverImage.extraLarge
          : (meta.coverImage?.large && meta.coverImage.large.includes("anilist.co"))
          ? meta.coverImage.large
          : (katanaData?.coverUrl && !katanaData.coverUrl.includes("placeholder"))
          ? katanaData.coverUrl
          : (weebData?.coverUrl && !weebData.coverUrl.includes("placeholder"))
          ? weebData.coverUrl
          : (pillData?.coverUrl && !pillData.coverUrl.includes("placeholder"))
          ? pillData.coverUrl
          : (asuraData?.coverUrl && !asuraData.coverUrl.includes("placeholder"))
          ? asuraData.coverUrl
          : allData.coverUrl;

      let allChapters = allData.chapters.map((ch) => ({
        externalChapId: ch.id,
        mangaExternalId: allData.id,
        mangaTitle: allData.title,
        coverUrl: bestCover,
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

      if (asuraData?.chapters?.length) {
        const asuraNorm = asuraData.chapters.map((ch) => ({
          externalChapId: ch.id,
          mangaExternalId: allData.id,
          mangaTitle: allData.title,
          coverUrl: allData.coverUrl,
          chapterNumber: ch.chapterNumber,
          volumeNumber: null,
          title: ch.title,
          language: "en",
          scanlator: "Asura Scans HD Stream",
          publishedAt: ch.publishedAt,
          sourceId: "asura",
          sourceType: "ASURA" as any,
          pageCount: 0,
        }));
        allChapters = [...allChapters, ...asuraNorm];
      }

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

      if (weebData?.chapters?.length) {
        const weebNorm = weebData.chapters.map((ch) => ({
          externalChapId: ch.id,
          mangaExternalId: allData.id,
          mangaTitle: allData.title,
          coverUrl: allData.coverUrl,
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

      if (katanaData?.chapters?.length) {
        const katanaNorm = katanaData.chapters.map((ch) => ({
          externalChapId: ch.id,
          mangaExternalId: allData.id,
          mangaTitle: allData.title,
          coverUrl: bestCover,
          chapterNumber: ch.chapterNumber,
          volumeNumber: null,
          title: ch.title,
          language: "en",
          scanlator: "Mihon / MangaKatana Stream",
          publishedAt: new Date().toISOString(),
          sourceId: "mangakatana",
          sourceType: "MANGAKATANA" as any,
          pageCount: 0,
        }));
        allChapters = [...allChapters, ...katanaNorm];
      }

      const chapterGroups = unifyAndSortChapters(allChapters as any);

      return NextResponse.json({
        success: true,
        data: {
          id: allData.id,
          title: allData.title,
          altTitles: [],
          description: allData.description || meta.description || meta.synopsis || "No synopsis available.",
          coverUrl: bestCover,
          bannerUrl: meta.bannerImage || bestCover,
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
    let mangaDexData = await fetchMangaDexDetails(id);
    if (!mangaDexData) {
      try {
        const chRes = await fetch(`https://api.mangadex.org/chapter/${id}?includes[]=manga`, {
          headers: { "User-Agent": "VajraMangaReader/1.0" },
          signal: AbortSignal.timeout(3000),
        });
        if (chRes.ok) {
          const chJson = await chRes.json();
          const rel = chJson.data?.relationships?.find((r: any) => r.type === "manga");
          if (rel?.id) {
            mangaDexData = await fetchMangaDexDetails(rel.id);
          }
        }
      } catch {}
    }
    if (!mangaDexData) {
      return NextResponse.json(
        { success: false, error: "Manga not found" },
        { status: 404 }
      );
    }

    const canonicalTitle = mangaDexData.title;

    // Search query terms: canonical English title, altTitles, and root titles without subtitle punctuation
    const extraTerms: string[] = [];
    for (const t of [canonicalTitle, ...(mangaDexData.altTitles || [])]) {
      if (t && (t.includes(":") || t.includes("-") || t.includes("–"))) {
        const split = t.split(/[:\-–]/)[0].trim();
        if (split.length >= 4) extraTerms.push(split);
      }
    }

    const candidateTerms = Array.from(
      new Set([canonicalTitle, ...(mangaDexData.altTitles?.slice(0, 6) || []), ...extraTerms])
    ).filter(Boolean);

    // Concurrently fetch Rich Metadata, MangaDex Chapters, MangaPill, WeebCentral, AllManga, Asura, MangaKatana
    const [richMeta, rawChapters, pillSearches, weebSearches, allSearches, asuraSearches, katanaSearches] = await Promise.all([
      fetchRichMangaMetadata(canonicalTitle).catch(() => ({ source: "NONE", data: null })),
      fetchMangaDexChapterFeed(id, lang).catch(() => []),
      Promise.all(candidateTerms.map((t) => searchMangaPill(t, 2).catch(() => []))),
      Promise.all(candidateTerms.map((t) => searchWeebCentral(t, 2).catch(() => []))),
      Promise.all(candidateTerms.map((t) => searchAllManga(t, 2).catch(() => []))),
      Promise.all(candidateTerms.map((t) => searchAsura(t, 2).catch(() => []))),
      Promise.all(candidateTerms.map((t) => searchMangaKatana(t, 2).catch(() => []))),
    ]);

    // Flatten search matches
    const allPillMatches = pillSearches.flat();
    const allWeebMatches = weebSearches.flat();
    const allAllMangaMatches = allSearches.flat();
    const allAsuraMatches = asuraSearches.flat();
    const allKatanaMatches = katanaSearches.flat();

    const bestPill = allPillMatches.find((p) => isStrictTitleMatch(p.title, candidateTerms));
    const bestWeeb = allWeebMatches.find((w) => isStrictTitleMatch(w.title, candidateTerms));
    const bestAllManga = allAllMangaMatches.find((a) => isStrictTitleMatch(a.title, candidateTerms));
    const bestAsura = allAsuraMatches.find((a) => isStrictTitleMatch(a.title, candidateTerms));
    const bestKatana = allKatanaMatches.find((k) => isStrictTitleMatch(k.title, candidateTerms));

    // Concurrently fetch chapter feeds from all alternate sources
    const [pillDetails, weebDetails, allMangaDetails, asuraDetails, katanaDetails] = await Promise.all([
      bestPill ? fetchMangaPillDetails(bestPill.id).catch(() => null) : null,
      bestWeeb ? fetchWeebCentralDetails(bestWeeb.id).catch(() => null) : null,
      bestAllManga ? fetchAllMangaDetails(bestAllManga.id).catch(() => null) : null,
      bestAsura ? fetchAsuraDetails(bestAsura.id).catch(() => null) : null,
      bestKatana ? fetchMangaKatanaDetails(bestKatana.id).catch(() => null) : null,
    ]);

    // Choose cleanest, highest-resolution cover art (prefer AniList official HD, then Asura, then MangaKatana, then AllManga, then MangaDex)
    const metaData = richMeta?.data as any;
    let finalCover = mangaDexData.coverUrl;
    if (metaData?.coverImage?.extraLarge || metaData?.coverImage?.large) {
      finalCover = metaData.coverImage.extraLarge || metaData.coverImage.large;
    } else if (typeof metaData?.coverImage === "string") {
      finalCover = metaData.coverImage;
    } else if (bestAsura?.coverUrl && !bestAsura.coverUrl.includes("placeholder")) {
      finalCover = bestAsura.coverUrl;
    } else if (bestKatana?.coverUrl && !bestKatana.coverUrl.includes("placeholder")) {
      finalCover = bestKatana.coverUrl;
    } else if (bestWeeb?.coverUrl && !bestWeeb.coverUrl.includes("placeholder")) {
      finalCover = bestWeeb.coverUrl;
    } else if (bestPill?.coverUrl && !bestPill.coverUrl.includes("placeholder")) {
      finalCover = bestPill.coverUrl;
    }

    // Base MangaDex chapters
    const normalizedChapters = rawChapters.map((ch) => ({
      ...ch,
      mangaTitle: canonicalTitle,
      coverUrl: finalCover,
    }));

    let allChapters: any[] = [...normalizedChapters];

    // Merge Asura Scans chapters
    if (asuraDetails?.chapters?.length) {
      const asuraNorm = asuraDetails.chapters.map((ch) => ({
        externalChapId: ch.id,
        mangaExternalId: mangaDexData.id,
        mangaTitle: canonicalTitle,
        coverUrl: finalCover,
        chapterNumber: ch.chapterNumber,
        volumeNumber: null,
        title: ch.title,
        language: "en",
        scanlator: "Asura Scans HD Stream",
        publishedAt: ch.publishedAt,
        sourceId: "asura",
        sourceType: "ASURA" as any,
        pageCount: 0,
      }));
      allChapters = [...allChapters, ...asuraNorm];
    }

    // Merge AllManga chapters (often contains 20-100+ chapters for manhwa/webtoons where MangaDex only has teasers)
    if (allMangaDetails?.chapters?.length) {
      const allNorm = allMangaDetails.chapters.map((ch) => ({
        externalChapId: ch.id,
        mangaExternalId: mangaDexData.id,
        mangaTitle: canonicalTitle,
        coverUrl: finalCover,
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
        coverUrl: finalCover,
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
        coverUrl: finalCover,
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

    // Merge MangaKatana chapters (massive full-coverage archives: 100-200+ chapters)
    if (katanaDetails?.chapters?.length) {
      const katanaNorm = katanaDetails.chapters.map((ch) => ({
        externalChapId: ch.id,
        mangaExternalId: mangaDexData.id,
        mangaTitle: canonicalTitle,
        coverUrl: finalCover,
        chapterNumber: ch.chapterNumber,
        volumeNumber: null,
        title: ch.title,
        language: "en",
        scanlator: "Mihon / MangaKatana Stream",
        publishedAt: new Date().toISOString(),
        sourceId: "mangakatana",
        sourceType: "MANGAKATANA" as any,
        pageCount: 0,
      }));
      allChapters = [...allChapters, ...katanaNorm];
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
        coverUrl: finalCover,
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
