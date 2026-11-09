import { NextRequest, NextResponse } from "next/server";
import { getFilteredAwesomeSources } from "@/lib/adapters/awesome-sources";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get("category") || "all";
    const query = req.nextUrl.searchParams.get("q") || "";

    const items = await getFilteredAwesomeSources(category, query);

    return NextResponse.json({
      success: true,
      repository: "https://github.com/anshumanv/awesome-anime-sources",
      data: items,
      count: items.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch awesome anime sources" },
      { status: 500 }
    );
  }
}
