import { NextRequest, NextResponse } from "next/server";
import { fetchUnifiedLatestChapters } from "@/lib/aggregator";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "32", 10);
    const lang = req.nextUrl.searchParams.get("lang") || "en";

    const unified = await fetchUnifiedLatestChapters(limit, lang);

    return NextResponse.json({
      success: true,
      data: unified,
      count: unified.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch latest chapters" },
      { status: 500 }
    );
  }
}
