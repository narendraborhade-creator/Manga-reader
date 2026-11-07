import { NextRequest, NextResponse } from "next/server";
import { searchMangaDex } from "@/lib/adapters/mangadex";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get("q") || "";
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "24", 10);

    const mangaList = await searchMangaDex(query, limit);

    return NextResponse.json({
      success: true,
      data: mangaList,
      count: mangaList.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to search manga" },
      { status: 500 }
    );
  }
}
