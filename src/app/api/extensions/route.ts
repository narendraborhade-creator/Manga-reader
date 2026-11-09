import { NextRequest, NextResponse } from "next/server";
import { fetchMangayomiExtensions, getFilteredMangayomiExtensions } from "@/lib/adapters/mangayomi";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const lang = req.nextUrl.searchParams.get("lang") || "all";
    const query = req.nextUrl.searchParams.get("q") || "";

    const extensions = await getFilteredMangayomiExtensions(lang, query);

    return NextResponse.json({
      success: true,
      repository: "https://github.com/kodjodevf/mangayomi",
      data: extensions,
      count: extensions.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch Mangayomi extensions" },
      { status: 500 }
    );
  }
}
