import { NextResponse } from "next/server";
import { fetchKeiyoushiCatalog } from "@/lib/adapters/keiyoushi-parser";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const catalog = await fetchKeiyoushiCatalog();
    return NextResponse.json({
      success: true,
      data: catalog,
      count: catalog.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch extensions" },
      { status: 500 }
    );
  }
}
