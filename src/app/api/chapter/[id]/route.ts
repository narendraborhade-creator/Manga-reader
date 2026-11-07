import { NextRequest, NextResponse } from "next/server";
import { resolveMangaDexChapterPages } from "@/lib/adapters/mangadex";

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
