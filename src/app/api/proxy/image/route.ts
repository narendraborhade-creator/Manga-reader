import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";

export const dynamic = "force-dynamic";

function generateFallbackSvg(title = "Manga Stream"): string {
  const cleanTitle = title.replace(/[<>&"]/g, "").slice(0, 32);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600" fill="#0B0E14">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#161c2e" />
      <stop offset="100%" stop-color="#0b0e14" />
    </linearGradient>
    <linearGradient id="indigo" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366F1" />
      <stop offset="100%" stop-color="#4F46E5" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#grad)"/>
  <rect x="8" y="8" width="384" height="584" rx="16" fill="none" stroke="#23293e" stroke-width="1.5" stroke-dasharray="6 3"/>
  <circle cx="200" cy="250" r="50" fill="#121622" stroke="#6366F1" stroke-width="2"/>
  <path d="M185 235 h30 v30 h-30 z M180 235 l20 -15 l20 15" fill="none" stroke="#6366F1" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="200" y="340" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="700" fill="#F8FAFC" text-anchor="middle">${cleanTitle}</text>
  <text x="200" y="370" font-family="monospace" font-size="11" font-weight="600" fill="#818CF8" text-anchor="middle" letter-spacing="2">MANGAYOMI ARCHIVE</text>
  <text x="200" y="395" font-family="system-ui, sans-serif" font-size="10" fill="#64748B" text-anchor="middle">STREAM VERIFIED</text>
</svg>`;
}

const imageCache = new Map<string, { buffer: Buffer; contentType: string; time: number }>();
const MAX_CACHE_SIZE = 500;

function getCached(key: string) {
  const item = imageCache.get(key);
  if (!item) return null;
  // Cache for 12 hours
  if (Date.now() - item.time > 12 * 3600 * 1000) {
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

function isValidImageBuffer(buffer: Buffer): { isValid: boolean; contentType: string } {
  if (!buffer || buffer.length < 8) return { isValid: false, contentType: "" };

  const strStart = buffer.slice(0, 50).toString("utf-8").trimStart().toLowerCase();
  if (
    strStart.startsWith("<") ||
    strStart.startsWith("<!--") ||
    strStart.startsWith("<!doctype") ||
    strStart.includes("<html") ||
    strStart.includes("<script") ||
    strStart.includes("cf-challenge") ||
    strStart.includes("ddos")
  ) {
    return { isValid: false, contentType: "" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { isValid: true, contentType: "image/png" };
  }
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { isValid: true, contentType: "image/jpeg" };
  }
  // WebP: RIFF .... WEBP
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
    return { isValid: true, contentType: "image/webp" };
  }
  // GIF: GIF87a or GIF89a
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return { isValid: true, contentType: "image/gif" };
  }

  if (buffer.length > 512 && !strStart.includes("html") && !strStart.includes("script")) {
    return { isValid: true, contentType: "image/jpeg" };
  }

  return { isValid: false, contentType: "" };
}

function fetchWithCurl(
  url: string,
  referer?: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  return new Promise((resolve) => {
    const args = ["-s", "-L", "--max-time", "10", "-A", "MangayomiWeb/1.0 (https://github.com/kodjodevf/mangayomi)"];
    
    let effectiveReferer = referer;
    if (!effectiveReferer) {
      if (url.includes("mangadex")) effectiveReferer = "https://mangadex.org/";
      else if (url.includes("weebcentral")) effectiveReferer = "https://weebcentral.com/";
      else if (url.includes("mangapill")) effectiveReferer = "https://mangapill.com/";
      else if (url.includes("asura")) effectiveReferer = "https://asurascans.com/";
      else if (url.includes("allanime") || url.includes("allmanga")) effectiveReferer = "https://allmanga.to/";
    }

    if (effectiveReferer) {
      args.push("-e", effectiveReferer);
    }
    args.push(url);

    const cp = spawn("curl.exe", args);
    const chunks: Buffer[] = [];
    cp.stdout.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    cp.on("close", (code) => {
      if (code === 0 && chunks.length > 0) {
        const buffer = Buffer.concat(chunks);
        const check = isValidImageBuffer(buffer);
        if (check.isValid) {
          resolve({ buffer, contentType: check.contentType });
        } else {
          resolve(null);
        }
      } else {
        resolve(null);
      }
    });
    cp.on("error", () => resolve(null));
  });
}

export async function GET(req: NextRequest) {
  const targetUrl = req.nextUrl.searchParams.get("url");
  const refererParam = req.nextUrl.searchParams.get("referer");

  if (!targetUrl || !targetUrl.startsWith("http")) {
    return new NextResponse(generateFallbackSvg(), {
      status: 200,
      headers: { "Content-Type": "image/svg+xml" },
    });
  }

  // Fast Memory Cache Check
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

  // Determine effective Referer and User-Agent
  let referer = refererParam || "";
  let userAgent = "MangayomiWeb/1.0 (https://github.com/kodjodevf/mangayomi)";

  if (targetUrl.includes("mangadex")) {
    referer = "https://mangadex.org/";
    userAgent = "MangayomiWeb/1.0";
  } else if (targetUrl.includes("weebcentral")) {
    referer = "https://weebcentral.com/";
    userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
  } else if (targetUrl.includes("mangapill")) {
    referer = "https://mangapill.com/";
    userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
  } else if (targetUrl.includes("allanime") || targetUrl.includes("allmanga")) {
    referer = "https://allmanga.to/";
    userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
  } else if (targetUrl.includes("asura")) {
    referer = "https://asurascans.com/";
    userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
  }

  // 1. Try standard high-speed Node fetch
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
      signal: AbortSignal.timeout(6000),
    });

    if (upstream.ok && upstream.body) {
      const declaredType = (upstream.headers.get("content-type") || "").toLowerCase();
      if (!declaredType.includes("text/html") && !declaredType.includes("application/json")) {
        const buffer = Buffer.from(await upstream.arrayBuffer());
        const check = isValidImageBuffer(buffer);
        if (check.isValid) {
          const finalType = check.contentType || declaredType || "image/jpeg";
          setCached(targetUrl, { buffer, contentType: finalType });
          return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
              "Content-Type": finalType,
              "Cache-Control": "public, max-age=86400, s-maxage=86400, immutable",
              "Access-Control-Allow-Origin": "*",
            },
          });
        }
      }
    }
  } catch {}

  // 2. Upstream fetch failed or bot-blocked -> Try curl
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

  // 3. Fallback to clean Mangayomi SVG card
  return new NextResponse(generateFallbackSvg(), {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
