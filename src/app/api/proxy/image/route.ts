import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const targetUrl = req.nextUrl.searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Determine optimal Referer and User-Agent based on target host
  let referer: string | undefined = req.nextUrl.searchParams.get("referer") || undefined;
  let userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

  if (targetUrl.includes("planeptune.us")) {
    referer = referer || "https://mangasee123.com/";
  } else if (targetUrl.includes("compsci88.com") || targetUrl.includes("weebcentral.com")) {
    referer = referer || "https://weebcentral.com/";
  } else if (targetUrl.includes("readdetectiveconan.com") || targetUrl.includes("mangapill.com")) {
    referer = referer || "https://mangapill.com/";
  } else if (targetUrl.includes("allanime") || targetUrl.includes("allmanga")) {
    referer = referer || "https://allmanga.to/";
  } else if (targetUrl.includes("mangadex")) {
    // MangaDex blocks generic Chrome UA from cloud IPs; requires custom User-Agent
    userAgent = "VajraMangaReader/1.0";
    referer = undefined; // Omitting referer prevents anti-hotlink trigger
  }

  try {
    const headers: Record<string, string> = {
      "User-Agent": userAgent,
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    };
    if (referer) {
      headers["Referer"] = referer;
    }

    const upstream = await fetch(targetUrl, {
      headers,
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { error: `Upstream image error: ${upstream.status}` },
        { status: upstream.status }
      );
    }

    const contentType =
      upstream.headers.get("content-type") || "image/jpeg";

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Image proxy fetch failed", details: err.message },
      { status: 502 }
    );
  }
}
