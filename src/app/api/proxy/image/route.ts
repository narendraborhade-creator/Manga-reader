import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";

export const dynamic = "force-dynamic";

const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400" fill="#0B0F19">
  <rect width="100%" height="100%" fill="#080C14"/>
  <rect x="5" y="5" width="290" height="390" fill="none" stroke="#FF9933" stroke-width="1.5" stroke-dasharray="4 2" opacity="0.4"/>
  <circle cx="150" cy="180" r="50" fill="#131B2E" stroke="#FF9933" stroke-width="2"/>
  <text x="150" y="195" font-family="system-ui, sans-serif" font-size="42" font-weight="bold" fill="#FF9933" text-anchor="middle">ॐ</text>
  <text x="150" y="270" font-family="system-ui, monospace" font-size="14" font-weight="bold" fill="#F5F5F0" text-anchor="middle" letter-spacing="2">VAJRA ARCHIVE</text>
  <text x="150" y="295" font-family="system-ui, monospace" font-size="10" fill="#00FFA3" text-anchor="middle" letter-spacing="1">SACRED MANGA STREAM</text>
</svg>`;

const imageCache = new Map<string, { buffer: Buffer; contentType: string; time: number }>();
const MAX_CACHE_SIZE = 400;

function getCached(key: string) {
  const item = imageCache.get(key);
  if (!item) return null;
  // Cache for 6 hours
  if (Date.now() - item.time > 6 * 3600 * 1000) {
    imageCache.delete(key);
    return null;
  }
  return item;
}

function setCached(key: string, val: { buffer: Buffer; contentType: string }) {
  if (imageCache.size >= MAX_CACHE_SIZE) {
    const firstKey = imageCache.keys().next().value;
    if (firstKey) imageCache.delete(firstKey);
  }
  imageCache.set(key, { ...val, time: Date.now() });
}

function fetchWithCurl(
  url: string,
  referer?: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  return new Promise((resolve) => {
    const args = ["-s", "-L", "--max-time", "8"];
    if (referer) {
      args.push("-e", referer);
    }
    args.push(url);

    const cp = spawn("curl.exe", args);
    const chunks: Buffer[] = [];
    cp.stdout.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    cp.on("close", (code) => {
      if (code === 0 && chunks.length > 0) {
        const buffer = Buffer.concat(chunks);
        let contentType = "image/jpeg";
        if (
          buffer[0] === 0x89 &&
          buffer[1] === 0x50 &&
          buffer[2] === 0x4e &&
          buffer[3] === 0x47
        ) {
          contentType = "image/png";
        } else if (
          buffer[0] === 0x52 &&
          buffer[1] === 0x49 &&
          buffer[2] === 0x46 &&
          buffer[3] === 0x46
        ) {
          contentType = "image/webp";
        }
        resolve({ buffer, contentType });
      } else {
        resolve(null);
      }
    });
    cp.on("error", () => resolve(null));
  });
}

export async function GET(req: NextRequest) {
  const targetUrl = req.nextUrl.searchParams.get("url");

  if (!targetUrl) {
    return new NextResponse(FALLBACK_SVG, {
      status: 200,
      headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" },
    });
  }

  // Check in-memory cache first for instant 1ms response
  const cached = getCached(targetUrl);
  if (cached) {
    return new NextResponse(new Uint8Array(cached.buffer), {
      status: 200,
      headers: {
        "Content-Type": cached.contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400, immutable",
        "Access-Control-Allow-Origin": "*",
      },
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
  } else if (targetUrl.includes("asurascans.com") || targetUrl.includes("asuracomic.net")) {
    referer = referer || "https://asurascans.com/";
  } else if (targetUrl.includes("mangadex")) {
    userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
    referer = undefined;
  }

  // For MangaDex, Node fetch() gets 403 or times out in India; use curl.exe immediately
  if (targetUrl.includes("mangadex")) {
    const curlResult = await fetchWithCurl(targetUrl, referer);
    if (curlResult && curlResult.buffer.length > 0) {
      setCached(targetUrl, curlResult);
      return new NextResponse(new Uint8Array(curlResult.buffer), {
        status: 200,
        headers: {
          "Content-Type": curlResult.contentType,
          "Cache-Control": "public, max-age=86400, s-maxage=86400, immutable",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
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
      signal: AbortSignal.timeout(5000),
    });

    if (upstream.ok && upstream.body) {
      const contentType = upstream.headers.get("content-type") || "image/jpeg";
      const buffer = Buffer.from(await upstream.arrayBuffer());
      setCached(targetUrl, { buffer, contentType });
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400, s-maxage=86400, immutable",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Upstream failed or returned bot challenge (403) -> Fallback to curl
    const curlResult = await fetchWithCurl(targetUrl, referer);
    if (curlResult && curlResult.buffer.length > 0) {
      setCached(targetUrl, curlResult);
      return new NextResponse(new Uint8Array(curlResult.buffer), {
        status: 200,
        headers: {
          "Content-Type": curlResult.contentType,
          "Cache-Control": "public, max-age=86400, s-maxage=86400, immutable",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Both failed -> return beautiful fallback SVG
    return new NextResponse(FALLBACK_SVG, {
      status: 200,
      headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" },
    });
  } catch {
    // If fetch threw (e.g. timeout or socket drop), try curl
    const curlResult = await fetchWithCurl(targetUrl, referer);
    if (curlResult && curlResult.buffer.length > 0) {
      setCached(targetUrl, curlResult);
      return new NextResponse(new Uint8Array(curlResult.buffer), {
        status: 200,
        headers: {
          "Content-Type": curlResult.contentType,
          "Cache-Control": "public, max-age=86400, s-maxage=86400, immutable",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    return new NextResponse(FALLBACK_SVG, {
      status: 200,
      headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" },
    });
  }
}
