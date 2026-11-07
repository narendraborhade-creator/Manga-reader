import { NextRequest, NextResponse } from "next/server";
import { resolveMangaDexChapterPages } from "@/lib/adapters/mangadex";
import { fetchMangaPillChapterPages, searchMangaPill, fetchMangaPillDetails } from "@/lib/adapters/mangapill";
import { fetchWeebCentralChapterPages, searchWeebCentral, fetchWeebCentralDetails } from "@/lib/adapters/weebcentral";
import { fetchAllMangaChapterPages, fetchAllMangaDetails } from "@/lib/adapters/allmanga";

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

    // 1. Handle MangaPill Source
    if (id.startsWith("mangapill-")) {
      const pillPages = await fetchMangaPillChapterPages(id);
      if (pillPages && pillPages.pages.length > 0) {
        const response = NextResponse.json({
          success: true,
          data: {
            chapterId: id,
            baseUrl: "https://mangapill.com",
            hash: "",
            quality,
            files: pillPages.pages,
            proxiedPages: pillPages.proxiedPages,
            directPages: pillPages.pages,
            sourceName: "Vajra Cloud Stream",
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
            baseUrl: "https://allanime.site",
            hash: "",
            quality,
            files: allMangaPages.pages,
            proxiedPages: allMangaPages.proxiedPages,
            directPages: allMangaPages.pages,
            sourceName: "Vajra Cloud Stream",
          },
        });
      }

      // Fallback: If AllManga fails or requires CAPTCHA, resolve title from AllManga and fetch from MangaPill/WeebCentral
      const allMangaMeta = await fetchAllMangaDetails(mangaId);
      const title = allMangaMeta?.title;
      if (title) {
        const pillMatches = await searchMangaPill(title, 1).catch(() => []);
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

    // 4. Handle MangaDex@Home Resolver
    const result = await resolveMangaDexChapterPages(id, quality);

    const response = NextResponse.json({
      success: true,
      data: result,
    });

    response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
    return response;
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
