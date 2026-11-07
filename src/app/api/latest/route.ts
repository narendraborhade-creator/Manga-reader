import { NextRequest, NextResponse } from "next/server";
import { fetchMangaDexLatestChapters } from "@/lib/adapters/mangadex";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "32", 10);
    const lang = req.nextUrl.searchParams.get("lang") || "en";

    const chapters = await fetchMangaDexLatestChapters(limit, lang);

    return NextResponse.json({
      success: true,
      data: chapters,
      count: chapters.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch latest chapters" },
      { status: 500 }
    );
  }
}
