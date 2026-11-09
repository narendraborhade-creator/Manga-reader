import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";

export const dynamic = "force-dynamic";

const imageCache = new Map<string, { buffer: Buffer; contentType: string; time: number }>();
const MAX_CACHE_SIZE = 500;

function getCached(key: string) {
  const item = imageCache.get(key);
  if (!item) return null;
  // Cache in memory for 12 hours
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

  const strStart = buffer.slice(0, 80).toString("utf-8").trimStart().toLowerCase();
  if (
    strStart.startsWith("<") ||
    strStart.startsWith("<!--") ||
    strStart.startsWith("<!doctype") ||
    strStart.includes("<html") ||
    strStart.includes("<script") ||
    strStart.includes("cf-challenge") ||
    strStart.includes("ddos") ||
    strStart.includes("cloudflare")
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

  // AVIF: ftypavif
  const magicStr = buffer.slice(4, 12).toString("utf-8");
  if (magicStr.includes("ftypavif") || magicStr.includes("ftypavis")) {
    return { isValid: true, contentType: "image/avif" };
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
    const args = [
      "-s",
      "-L",
      "--max-time",
      "10",
      "-A",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    ];

    let effectiveReferer = referer;
    if (!effectiveReferer) {
      if (url.includes("mangadex")) effectiveReferer = "https://mangadex.org/";
      else if (url.includes("weebcentral") || url.includes("compsci88")) effectiveReferer = "https://weebcentral.com/";
      else if (url.includes("mangapill") || url.includes("readdetectiveconan")) effectiveReferer = "https://mangapill.com/";
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
    return new NextResponse(null, {
      status: 400,
      statusText: "Bad Request - Missing or invalid image URL",
    });
  }

  // 1. Fast In-Memory Cache Check
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

  // 2. Determine effective Referer and User-Agent per upstream domain
  let referer = refererParam || "";
  let userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

  if (targetUrl.includes("mangadex")) {
    referer = "https://mangadex.org/";
    userAgent = "MangayomiWeb/1.0";
  } else if (targetUrl.includes("weebcentral") || targetUrl.includes("compsci88")) {
    referer = "https://weebcentral.com/";
  } else if (targetUrl.includes("mangapill") || targetUrl.includes("readdetectiveconan")) {
    referer = "https://mangapill.com/";
  } else if (targetUrl.includes("allanime") || targetUrl.includes("allmanga")) {
    referer = "https://allmanga.to/";
  } else if (targetUrl.includes("asura")) {
    referer = "https://asurascans.com/";
  }

  // 3. High-Speed Native Fetch
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
      signal: AbortSignal.timeout(12000),
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

  // 4. Fallback to curl subprocess (handles TLS fingerprinted hosts)
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

  // 5. Explicit error status so client <img onError> triggers immediate fallback
  return new NextResponse(null, {
    status: 502,
    statusText: "Bad Gateway - Image stream currently unavailable",
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
