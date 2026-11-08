import { NextRequest, NextResponse } from "next/server";
import { resolveMangaDexChapterPages } from "@/lib/adapters/mangadex";
import { fetchMangaPillChapterPages, searchMangaPill, fetchMangaPillDetails } from "@/lib/adapters/mangapill";
import { fetchWeebCentralChapterPages, searchWeebCentral, fetchWeebCentralDetails } from "@/lib/adapters/weebcentral";
import { fetchAllMangaChapterPages, fetchAllMangaDetails } from "@/lib/adapters/allmanga";
import { fetchAsuraChapterPages } from "@/lib/adapters/asura";

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

      const allMangaPages = await fetchAllMangaChapterPages(mangaId, chapterString);
      if (allMangaPages && allMangaPages.pages.length > 0) {
        return NextResponse.json({
          success: true,
          data: {
            chapterId: id,
            mangaId: `allmanga-${mangaId}`,
            mangaTitle: `Chapter ${chapterString}`,
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

      // Fallback to MangaPill or WeebCentral
      const allMangaMeta = await fetchAllMangaDetails(mangaId);
      const title = allMangaMeta?.title;
      if (title) {
        const pillMatches = await searchMangaPill(title, 2).catch(() => []);
        if (pillMatches.length > 0) {
          const pillData = await fetchMangaPillDetails(pillMatches[0].id);
          const targetNum = parseFloat(chapterString) || 1;
          const matchedCh =
            pillData?.chapters.find(
              (c) => Math.abs(c.chapterNumber - targetNum) < 0.05
            ) || pillData?.chapters[0];

          if (matchedCh) {
            const fallbackPages = await fetchMangaPillChapterPages(matchedCh.id);
            if (fallbackPages && fallbackPages.pages.length > 0) {
              return NextResponse.json({
                success: true,
                data: {
                  chapterId: id,
                  baseUrl: "https://mangapill.com",
                  hash: "",
                  quality,
                  files: fallbackPages.pages,
                  proxiedPages: fallbackPages.proxiedPages,
                  directPages: fallbackPages.pages,
                  sourceName: "Vajra Cloud Stream",
                },
              });
            }
          }
        }
      }
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
      const altTitles = mangaRel?.attributes?.altTitles || [];
      const title =
        titleObj.en ||
        altTitles.find((a: any) => a?.en)?.en ||
        Object.values(titleObj)[0];

      if (title) {
        // Try MangaPill
        const pillMatches = await searchMangaPill(title, 2).catch(() => []);
        if (pillMatches.length > 0) {
          const pillData = await fetchMangaPillDetails(pillMatches[0].id).catch(() => null);
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
                  baseUrl: "https://mangapill.com",
                  hash: "",
                  quality,
                  files: pages.pages,
                  proxiedPages: pages.proxiedPages,
                  directPages: pages.pages,
                  sourceName: "Vajra Cloud Stream",
                },
              });
            }
          }
        }

        // Try WeebCentral
        const weebMatches = await searchWeebCentral(title, 2).catch(() => []);
        if (weebMatches.length > 0) {
          const weebData = await fetchWeebCentralDetails(weebMatches[0].id).catch(() => null);
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
                  baseUrl: "https://weebcentral.com",
                  hash: "",
                  quality,
                  files: pages.pages,
                  proxiedPages: pages.proxiedPages,
                  directPages: pages.pages,
                  sourceName: "Vajra Cloud Stream",
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
