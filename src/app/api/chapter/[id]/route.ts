import { NextRequest, NextResponse } from "next/server";
import { resolveMangaDexChapterPages } from "@/lib/adapters/mangadex";
import { fetchAllMangaChapterPages } from "@/lib/adapters/allmanga";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const quality =
      req.nextUrl.searchParams.get("quality") === "data-saver"
        ? "data-saver"
        : "data";

    // 1. Check if Chapter belongs to AllManga
    if (id.startsWith("allmanga-")) {
      // Format: allmanga-{mangaId}-{chapterString}
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

    // 2. Default to MangaDex@Home Resolver
    const result = await resolveMangaDexChapterPages(id, quality);

    const response = NextResponse.json({
      success: true,
      data: result,
    });

    // Enforce no-store because MangaDex@Home URLs expire in 15 minutes
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
