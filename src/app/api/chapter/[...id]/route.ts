import { NextRequest, NextResponse } from "next/server";
import { resolveMangaDexChapterPages, fetchMangaDexChapterFeed, searchMangaDex } from "@/lib/adapters/mangadex";
import { fetchMangaPillChapterPages, searchMangaPill, fetchMangaPillDetails } from "@/lib/adapters/mangapill";
import { fetchWeebCentralChapterPages, searchWeebCentral, fetchWeebCentralDetails } from "@/lib/adapters/weebcentral";
import { fetchAllMangaChapterPages, fetchAllMangaDetails } from "@/lib/adapters/allmanga";
import { fetchAsuraChapterPages, searchAsura, fetchAsuraDetails } from "@/lib/adapters/asura";
import { isStrictTitleMatch } from "@/lib/aggregator";

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
    const quality =
      req.nextUrl.searchParams.get("quality") === "data-saver"
        ? "data-saver"
        : "data";

    // 0. Handle Asura Source
    if (id.startsWith("asura-")) {
      const parts = id.replace(/^asura-/, "").split("/").filter(Boolean);
      const seriesSlug = parts[0];
      const chapterSlug = parts[parts.length - 1];
      const asuraPages = await fetchAsuraChapterPages(seriesSlug, chapterSlug);
      if (asuraPages && asuraPages.pages.length > 0) {
        const response = NextResponse.json({
          success: true,
          data: {
            chapterId: id,
            mangaId: `asura-${seriesSlug}`,
            mangaTitle: seriesSlug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
            chapterTitle: chapterSlug.replace(/-/g, " ").toUpperCase(),
            baseUrl: "https://asurascans.com",
            hash: "",
            quality,
            files: asuraPages.pages,
            proxiedPages: asuraPages.proxiedPages,
            directPages: asuraPages.pages,
            sourceName: "Asura Scans HD Stream",
          },
        });
        response.headers.set("Cache-Control", "public, max-age=3600");
        return response;
      }
    }

    // 1. Handle MangaPill Source
    if (id.startsWith("mangapill-")) {
      const pillPages = await fetchMangaPillChapterPages(id);
      if (pillPages && pillPages.pages.length > 0) {
        const match = id.match(/^mangapill-(\d+)(?:-\d+)?\/(.*)$/);
        const resolvedMangaId = match ? `mangapill-${match[1]}/${match[2]}` : id;
        const response = NextResponse.json({
          success: true,
          data: {
            chapterId: id,
            mangaId: resolvedMangaId,
            mangaTitle: match ? match[2].replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) : "Manga",
            baseUrl: "https://mangapill.com",
            hash: "",
            quality,
            files: pillPages.pages,
            proxiedPages: pillPages.proxiedPages,
            directPages: pillPages.pages,
            sourceName: "MangaPill Mirror",
          },
        });
        response.headers.set("Cache-Control", "public, max-age=3600");
        return response;
      }
    }

    // 2. Handle WeebCentral Source
    if (id.startsWith("weebcentral-")) {
      const weebPages = await fetchWeebCentralChapterPages(id);
      if (weebPages && weebPages.pages.length > 0) {
        const response = NextResponse.json({
          success: true,
          data: {
            chapterId: id,
            mangaId: id,
            mangaTitle: "WeebCentral Stream",
            baseUrl: "https://weebcentral.com",
            hash: "",
            quality,
            files: weebPages.pages,
            proxiedPages: weebPages.proxiedPages,
            directPages: weebPages.pages,
            sourceName: "Vajra Cloud Stream",
          },
        });
        response.headers.set("Cache-Control", "public, max-age=3600");
        return response;
      }
    }

    // 3. Handle AllManga Source with automatic fallback
    if (id.startsWith("allmanga-")) {
      const parts = id.replace(/^allmanga-/, "").split("-");
      const mangaId = parts[0];
      const chapterString = decodeURIComponent(parts.slice(1).join("-") || "1");
      const targetNum = parseFloat(chapterString) || 0;

      // Look up series title to cross-reference with clean high-definition sources first
      const allMangaMeta = await fetchAllMangaDetails(mangaId);
      const title = allMangaMeta?.title;
      const candidateTitles = [title, ...((allMangaMeta as any)?.altTitles || [])].filter(Boolean) as string[];

      if (title && candidateTitles.length > 0) {
        // 1. Try Asura Scans first (unblocked HD manhwa/manga stream)
        const asuraMatches = await searchAsura(title, 5).catch(() => []);
        const matchedAsura = asuraMatches.find((m) => isStrictTitleMatch(m.title, candidateTitles));
        if (matchedAsura) {
          const asuraData = await fetchAsuraDetails(matchedAsura.id).catch(() => null);
          const matchedCh = asuraData?.chapters.find(
            (c) => Math.abs(c.chapterNumber - targetNum) < 0.05 || (targetNum === 0 && (c.chapterNumber === 1 || c.title.toLowerCase().includes('prologue') || c.title.toLowerCase().includes('chapter 0')))
          );
          if (matchedCh) {
            const asuraPages = await fetchAsuraChapterPages(matchedCh.seriesSlug, matchedCh.chapterSlug);
            if (asuraPages && asuraPages.pages.length > 0) {
              return NextResponse.json({
                success: true,
                data: {
                  chapterId: id,
                  mangaId: `allmanga-${mangaId}`,
                  mangaTitle: title,
                  chapterNumber: targetNum,
                  chapterTitle: `Chapter ${chapterString}`,
                  baseUrl: "https://asurascans.com",
                  hash: "",
                  quality,
                  files: asuraPages.pages,
                  proxiedPages: asuraPages.proxiedPages,
                  directPages: asuraPages.pages,
                  sourceName: "Asura Scans HD Stream",
                },
              });
            }
          }
        }

        // 2. Try WeebCentral (huge verified catalog & high-speed direct CDN)
        const weebMatches = await searchWeebCentral(title, 5).catch(() => []);
        const matchedWeeb = weebMatches.find((w) => isStrictTitleMatch(w.title, candidateTitles));
        if (matchedWeeb) {
          const weebData = await fetchWeebCentralDetails(matchedWeeb.id).catch(() => null);
          const matchedCh = weebData?.chapters.find(
            (c) => Math.abs(c.chapterNumber - targetNum) < 0.05 || (targetNum === 0 && (c.chapterNumber === 1 || c.title.toLowerCase().includes('prologue') || c.title.toLowerCase().includes('chapter 0')))
          );
          if (matchedCh) {
            const weebPages = await fetchWeebCentralChapterPages(matchedCh.id);
            if (weebPages && weebPages.pages.length > 0) {
              return NextResponse.json({
                success: true,
                data: {
                  chapterId: id,
                  mangaId: `allmanga-${mangaId}`,
                  mangaTitle: title,
                  chapterNumber: targetNum,
                  chapterTitle: `Chapter ${chapterString}`,
                  baseUrl: "https://weebcentral.com",
                  hash: "",
                  quality,
                  files: weebPages.pages,
                  proxiedPages: weebPages.proxiedPages,
                  directPages: weebPages.pages,
                  sourceName: "WeebCentral Stream",
                },
              });
            }
          }
        }

        // 3. Try MangaPill (strictly verifying title & exact chapter number)
        const pillMatches = await searchMangaPill(title, 5).catch(() => []);
        const matchedPill = pillMatches.find((p) => isStrictTitleMatch(p.title, candidateTitles));
        if (matchedPill) {
          const pillData = await fetchMangaPillDetails(matchedPill.id).catch(() => null);
          const matchedCh = pillData?.chapters.find(
            (c) => Math.abs(c.chapterNumber - targetNum) < 0.05 || (targetNum === 0 && (c.chapterNumber === 1 || c.title.toLowerCase().includes('prologue') || c.title.toLowerCase().includes('chapter 0')))
          );
          if (matchedCh) {
            const fallbackPages = await fetchMangaPillChapterPages(matchedCh.id);
            if (fallbackPages && fallbackPages.pages.length > 0) {
              return NextResponse.json({
                success: true,
                data: {
                  chapterId: id,
                  mangaId: `allmanga-${mangaId}`,
                  mangaTitle: title,
                  chapterNumber: targetNum,
                  chapterTitle: `Chapter ${chapterString}`,
                  baseUrl: "https://mangapill.com",
                  hash: "",
                  quality,
                  files: fallbackPages.pages,
                  proxiedPages: fallbackPages.proxiedPages,
                  directPages: fallbackPages.pages,
                  sourceName: "MangaPill Mirror",
                },
              });
            }
          }
        }

        // 4. Try MangaDex cross-reference
        const dexMatches = await searchMangaDex(title, 5).catch(() => []);
        const matchedDex = dexMatches.find((d) => isStrictTitleMatch(d.title, candidateTitles));
        if (matchedDex) {
          const dexChapters = await fetchMangaDexChapterFeed(matchedDex.id, "en").catch(() => []);
          const matchedCh = dexChapters.find(
            (c) => Math.abs(c.chapterNumber - targetNum) < 0.05 || (targetNum === 0 && (c.chapterNumber === 1 || c.title.toLowerCase().includes('prologue') || c.title.toLowerCase().includes('chapter 0')))
          );
          if (matchedCh) {
            const dexPages = await resolveMangaDexChapterPages(matchedCh.externalChapId, quality);
            if (dexPages && dexPages.proxiedPages?.length > 0) {
              return NextResponse.json({
                success: true,
                data: {
                  ...dexPages,
                  chapterId: id,
                  mangaId: `allmanga-${mangaId}`,
                  mangaTitle: title,
                  chapterNumber: targetNum,
                  chapterTitle: `Chapter ${chapterString}`,
                  sourceName: "MangaDex Stream",
                },
              });
            }
          }
        }
      }

      // 5. Fallback to AllManga direct stream
      const allMangaPages = await fetchAllMangaChapterPages(mangaId, chapterString);
      if (allMangaPages && allMangaPages.pages.length > 0) {
        return NextResponse.json({
          success: true,
          data: {
            chapterId: id,
            mangaId: `allmanga-${mangaId}`,
            mangaTitle: title || `Chapter ${chapterString}`,
            chapterNumber: targetNum,
            chapterTitle: `Chapter ${chapterString}`,
            baseUrl: "https://allanime.site",
            hash: "",
            quality,
            files: allMangaPages.pages,
            proxiedPages: allMangaPages.proxiedPages,
            directPages: allMangaPages.pages,
            sourceName: "AllManga Stream",
          },
        });
      }

      return NextResponse.json(
        {
          success: false,
          error: `Chapter ${chapterString} of "${title || mangaId}" is not currently available from verified English mirrors.`,
        },
        { status: 404 }
      );
    }

    // 4. Handle MangaDex@Home Resolver with Automatic Mirror Failover
    try {
      const [result, chRes] = await Promise.all([
        resolveMangaDexChapterPages(id, quality),
        fetch(`https://api.mangadex.org/chapter/${id}?includes[]=manga`, {
          headers: { "User-Agent": "VajraMangaReader/1.0" },
          signal: AbortSignal.timeout(3000),
        }).catch(() => null),
      ]);

      if (result && result.proxiedPages && result.proxiedPages.length > 0) {
        let mangaId = "";
        let mangaTitle = "";
        let chapterNum = 1;
        if (chRes && chRes.ok) {
          try {
            const chJson = await chRes.json();
            const rel = chJson.data?.relationships?.find((r: any) => r.type === "manga");
            if (rel?.id) mangaId = rel.id;
            const tObj = rel?.attributes?.title || {};
            mangaTitle = tObj.en || Object.values(tObj)[0] || "";
            chapterNum = parseFloat(chJson.data?.attributes?.chapter || "1") || 1;
          } catch {}
        }

        const response = NextResponse.json({
          success: true,
          data: {
            ...result,
            mangaId: mangaId || id,
            mangaTitle: mangaTitle || "Manga Codex",
            chapterNumber: chapterNum,
            chapterTitle: `Chapter ${chapterNum}`,
          },
        });
        response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
        return response;
      }
    } catch (dexErr) {
      console.warn("MangaDex chapter resolve failed, attempting failover:", dexErr);
    }

    // Fallback: Query MangaDex Chapter info to find Title + Chapter #
    const chRes = await fetch(
      `https://api.mangadex.org/chapter/${id}?includes[]=manga`,
      { headers: { "User-Agent": "VajraMangaReader/1.0" } }
    ).catch(() => null);

    if (chRes && chRes.ok) {
      const chJson = await chRes.json();
      const chData = chJson.data;
      const chNum = parseFloat(chData?.attributes?.chapter || "1") || 1;
      const mangaRel = chData?.relationships?.find((r: any) => r.type === "manga");
      const titleObj = mangaRel?.attributes?.title || {};
      const altTitles = (mangaRel?.attributes?.altTitles || []).map((a: any) => a?.en || Object.values(a || {})[0]).filter(Boolean);
      const title =
        titleObj.en ||
        altTitles[0] ||
        Object.values(titleObj)[0];

      if (title) {
        const candidateTitles = [title, ...altTitles];

        // 1. Try Asura Scans
        const asuraMatches = await searchAsura(title, 5).catch(() => []);
        const matchedAsura = asuraMatches.find((m) => isStrictTitleMatch(m.title, candidateTitles));
        if (matchedAsura) {
          const asuraData = await fetchAsuraDetails(matchedAsura.id).catch(() => null);
          const matchedCh = asuraData?.chapters.find(
            (c) => Math.abs(c.chapterNumber - chNum) < 0.05
          );
          if (matchedCh) {
            const pages = await fetchAsuraChapterPages(matchedCh.seriesSlug, matchedCh.chapterSlug);
            if (pages && pages.pages.length > 0) {
              return NextResponse.json({
                success: true,
                data: {
                  chapterId: id,
                  mangaId: mangaRel?.id || id,
                  mangaTitle: title,
                  chapterNumber: chNum,
                  chapterTitle: `Chapter ${chNum}`,
                  baseUrl: "https://asurascans.com",
                  hash: "",
                  quality,
                  files: pages.pages,
                  proxiedPages: pages.proxiedPages,
                  directPages: pages.pages,
                  sourceName: "Asura Scans HD Stream",
                },
              });
            }
          }
        }

        // 2. Try WeebCentral
        const weebMatches = await searchWeebCentral(title, 5).catch(() => []);
        const matchedWeeb = weebMatches.find((w) => isStrictTitleMatch(w.title, candidateTitles));
        if (matchedWeeb) {
          const weebData = await fetchWeebCentralDetails(matchedWeeb.id).catch(() => null);
          const matchedCh = weebData?.chapters.find(
            (c) => Math.abs(c.chapterNumber - chNum) < 0.05
          );
          if (matchedCh) {
            const pages = await fetchWeebCentralChapterPages(matchedCh.id);
            if (pages && pages.pages.length > 0) {
              return NextResponse.json({
                success: true,
                data: {
                  chapterId: id,
                  mangaId: mangaRel?.id || id,
                  mangaTitle: title,
                  chapterNumber: chNum,
                  chapterTitle: `Chapter ${chNum}`,
                  baseUrl: "https://weebcentral.com",
                  hash: "",
                  quality,
                  files: pages.pages,
                  proxiedPages: pages.proxiedPages,
                  directPages: pages.pages,
                  sourceName: "WeebCentral Stream",
                },
              });
            }
          }
        }

        // 3. Try MangaPill
        const pillMatches = await searchMangaPill(title, 5).catch(() => []);
        const matchedPill = pillMatches.find((p) => isStrictTitleMatch(p.title, candidateTitles));
        if (matchedPill) {
          const pillData = await fetchMangaPillDetails(matchedPill.id).catch(() => null);
          const matchedCh = pillData?.chapters.find(
            (c) => Math.abs(c.chapterNumber - chNum) < 0.05
          );
          if (matchedCh) {
            const pages = await fetchMangaPillChapterPages(matchedCh.id);
            if (pages && pages.pages.length > 0) {
              return NextResponse.json({
                success: true,
                data: {
                  chapterId: id,
                  mangaId: mangaRel?.id || id,
                  mangaTitle: title,
                  chapterNumber: chNum,
                  chapterTitle: `Chapter ${chNum}`,
                  baseUrl: "https://mangapill.com",
                  hash: "",
                  quality,
                  files: pages.pages,
                  proxiedPages: pages.proxiedPages,
                  directPages: pages.pages,
                  sourceName: "MangaPill Mirror",
                },
              });
            }
          }
        }
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Unable to retrieve pages from any connected stream node.",
      },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("Resolve chapter pages error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to resolve chapter pages",
      },
      { status: 500 }
    );
  }
}
