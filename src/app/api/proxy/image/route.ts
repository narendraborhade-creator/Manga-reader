import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400" fill="#0B0F19">
  <rect width="100%" height="100%" fill="#080C14"/>
  <rect x="5" y="5" width="290" height="390" fill="none" stroke="#FF9933" stroke-width="1.5" stroke-dasharray="4 2" opacity="0.4"/>
  <circle cx="150" cy="180" r="50" fill="#131B2E" stroke="#FF9933" stroke-width="2"/>
  <text x="150" y="195" font-family="system-ui, sans-serif" font-size="42" font-weight="bold" fill="#FF9933" text-anchor="middle">ॐ</text>
  <text x="150" y="270" font-family="system-ui, monospace" font-size="14" font-weight="bold" fill="#F5F5F0" text-anchor="middle" letter-spacing="2">VAJRA ARCHIVE</text>
  <text x="150" y="295" font-family="system-ui, monospace" font-size="10" fill="#00FFA3" text-anchor="middle" letter-spacing="1">SACRED MANGA STREAM</text>
</svg>`;

export async function GET(req: NextRequest) {
  const targetUrl = req.nextUrl.searchParams.get("url");

  if (!targetUrl) {
    return new NextResponse(FALLBACK_SVG, {
      status: 200,
      headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" },
    });
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
    userAgent = "VajraMangaReader/1.0";
    referer = undefined;
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
      signal: AbortSignal.timeout(8000),
    });

    if (!upstream.ok || !upstream.body) {
      // Return beautiful fallback SVG instead of breaking the img tag
      return new NextResponse(FALLBACK_SVG, {
        status: 200,
        headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" },
      });
    }

    const contentType = upstream.headers.get("content-type") || "image/jpeg";

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    return new NextResponse(FALLBACK_SVG, {
      status: 200,
      headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" },
    });
  }
}
