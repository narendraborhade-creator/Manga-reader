import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const targetUrl = req.nextUrl.searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Determine optimal Referer based on target host
  let referer = req.nextUrl.searchParams.get("referer") || "https://mangadex.org/";
  if (targetUrl.includes("planeptune.us")) {
    referer = "https://mangasee123.com/";
  } else if (targetUrl.includes("allanime") || targetUrl.includes("allmanga")) {
    referer = "https://allmanga.to/";
  } else if (targetUrl.includes("mangadex")) {
    referer = "https://mangadex.org/";
  }

  try {
    const upstream = await fetch(targetUrl, {
      headers: {
        Referer: referer,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
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
