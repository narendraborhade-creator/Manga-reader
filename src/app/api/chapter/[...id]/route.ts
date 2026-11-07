import { NextRequest, NextResponse } from "next/server";
import { resolveMangaDexChapterPages } from "@/lib/adapters/mangadex";
import { fetchMangaPillChapterPages } from "@/lib/adapters/mangapill";
import { fetchWeebCentralChapterPages } from "@/lib/adapters/weebcentral";
import { fetchAllMangaChapterPages } from "@/lib/adapters/allmanga";

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
      if (!pillPages || !pillPages.pages.length) {
        return NextResponse.json(
          {
            success: false,
            error: "No pages found for this MangaPill chapter.",
          },
          { status: 404 }
        );
      }

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
          sourceName: pillPages.sourceName,
        },
      });

      response.headers.set("Cache-Control", "public, max-age=3600");
      return response;
    }

    // 2. Handle WeebCentral Source
    if (id.startsWith("weebcentral-")) {
      const weebPages = await fetchWeebCentralChapterPages(id);
      if (!weebPages || !weebPages.pages.length) {
        return NextResponse.json(
          {
            success: false,
            error: "No pages found for this WeebCentral chapter.",
          },
          { status: 404 }
        );
      }

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
          sourceName: weebPages.sourceName,
        },
      });

      response.headers.set("Cache-Control", "public, max-age=3600");
      return response;
    }

    // 3. Handle AllManga Source
    if (id.startsWith("allmanga-")) {
      const parts = id.replace(/^allmanga-/, "").split("-");
      const mangaId = parts[0];
      const chapterString = decodeURIComponent(parts.slice(1).join("-") || "1");

      const allMangaPages = await fetchAllMangaChapterPages(mangaId, chapterString);
      if (!allMangaPages || !allMangaPages.pages.length) {
        return NextResponse.json(
          {
            success: false,
            error: "No pages found for this AllManga chapter.",
          },
          { status: 404 }
        );
      }

      const response = NextResponse.json({
        success: true,
        data: {
          chapterId: id,
          baseUrl: "https://allanime.site",
          hash: "",
          quality,
          files: allMangaPages.pages,
          proxiedPages: allMangaPages.proxiedPages,
          directPages: allMangaPages.pages,
          sourceName: allMangaPages.sourceName,
        },
      });

      response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
      return response;
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
