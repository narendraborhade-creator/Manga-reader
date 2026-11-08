import * as cheerio from "cheerio";

export interface AsuraItem {
  id: string; // e.g. "asura-solo-farming-in-the-tower"
  rawSlug: string; // e.g. "solo-farming-in-the-tower"
  title: string;
  altTitles: string[];
  description: string;
  coverUrl: string;
  bannerUrl?: string;
  status: string;
  score?: number;
  totalChapters: number;
  genres: string[];
  sourceType: "ASURA";
}

export interface AsuraChapter {
  id: string; // e.g. "asura-solo-farming-in-the-tower/167141/66e058fe-0e79-4d14-adfd-956660e9300e"
  chapterNumber: number;
  title: string;
  seriesSlug: string;
  chapterSlug: string;
  chapterId: number;
  publishedAt: string;
}

export interface AsuraPagesResult {
  chapterId: string;
  pages: string[];
  proxiedPages: string[];
  sourceName: string;
}

const ASURA_API = "https://api.asurascans.com";
const ASURA_BASE = "https://asurascans.com";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export async function searchAsura(query: string, limit = 24): Promise<AsuraItem[]> {
  try {
    if (!query.trim()) return [];
    const res = await fetch(`${ASURA_API}/api/search?q=${encodeURIComponent(query.trim())}`, {
      headers: {
        "User-Agent": USER_AGENT,
        Referer: `${ASURA_BASE}/`,
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) return [];
    const json = await res.json();
    const data = Array.isArray(json.data) ? json.data : [];

    return data.slice(0, limit).map((item: any) => ({
      id: `asura-${item.slug}`,
      rawSlug: item.slug,
      title: item.title || "Unknown Manhwa",
      altTitles: item.alt_titles || [],
      description: (item.description || "").replace(/<[^>]*>?/gm, ""),
      coverUrl: item.cover || "/placeholder-manga.jpg",
      bannerUrl: item.banner || undefined,
      status: (item.status || "ongoing").toUpperCase(),
      score: item.rating ? Math.round(item.rating * 10) : undefined,
      totalChapters: item.chapter_count || item.latest_chapters?.length || 0,
      genres: (item.genres || []).map((g: any) => g.name || g),
      sourceType: "ASURA",
    }));
  } catch (err) {
    console.warn("searchAsura error:", err);
    return [];
  }
}

export async function fetchAsuraDetails(rawSlug: string) {
  const slug = rawSlug.replace(/^asura-/, "");
  try {
    const [seriesRes, chaptersRes] = await Promise.all([
      fetch(`${ASURA_API}/api/series/${slug}`, {
        headers: { "User-Agent": USER_AGENT, Referer: `${ASURA_BASE}/` },
        signal: AbortSignal.timeout(6000),
      }).catch(() => null),
      fetch(`${ASURA_API}/api/series/${slug}/chapters`, {
        headers: { "User-Agent": USER_AGENT, Referer: `${ASURA_BASE}/` },
        signal: AbortSignal.timeout(6000),
      }).catch(() => null),
    ]);

    if (!seriesRes || !seriesRes.ok) return null;
    const seriesJson = await seriesRes.json();
    const series = seriesJson.series;
    if (!series) return null;

    let rawChapters: any[] = [];
    if (chaptersRes && chaptersRes.ok) {
      const chapJson = await chaptersRes.json();
      rawChapters = Array.isArray(chapJson.data) ? chapJson.data : [];
    }

    const publicUrlSlug = series.public_url ? series.public_url.replace("/comics/", "") : slug;

    const chapters: AsuraChapter[] = rawChapters.map((ch: any) => ({
      id: `asura-${publicUrlSlug}/${ch.slug || ch.number}`,
      chapterNumber: ch.number || 0,
      title: ch.title ? `Chapter ${ch.number}: ${ch.title}` : `Chapter ${ch.number}`,
      seriesSlug: publicUrlSlug,
      chapterSlug: ch.slug || String(ch.number),
      chapterId: ch.id,
      publishedAt: ch.published_at || new Date().toISOString(),
    }));

    return {
      id: `asura-${slug}`,
      rawSlug: slug,
      title: series.title,
      altTitles: series.alt_titles || [],
      description: (series.description || "").replace(/<[^>]*>?/gm, ""),
      coverUrl: series.cover || "/placeholder-manga.jpg",
      bannerUrl: series.banner || null,
      status: (series.status || "ongoing").toUpperCase(),
      genres: (series.genres || []).map((g: any) => g.name || g),
      totalChapters: chapters.length,
      chapters,
      sourceType: "ASURA" as const,
    };
  } catch (err) {
    console.warn("fetchAsuraDetails error:", err);
    return null;
  }
}

export async function fetchAsuraChapterPages(
  seriesSlug: string,
  chapterIdOrSlug: string
): Promise<AsuraPagesResult | null> {
  try {
    const cleanSeries = seriesSlug.replace(/^asura-/, "").replace(/^\/+|\/+$/g, "");
    const cleanChapter = chapterIdOrSlug.split("/").filter(Boolean).pop() || chapterIdOrSlug;
    // Chapter URL format: https://asurascans.com/comics/{seriesSlug}/chapter/{chapterSlug}
    const targetUrl = `${ASURA_BASE}/comics/${cleanSeries}/chapter/${cleanChapter}`;

    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        Referer: `${ASURA_BASE}/`,
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;
    const html = await res.text();

    // Parse Astro island props
    const regex = /props="([^"]+)"/g;
    let match;
    let foundPages: string[] = [];

    while ((match = regex.exec(html)) !== null) {
      const decoded = match[1].replace(/&quot;/g, '"');
      if (decoded.includes("asura-images/chapters") || decoded.includes("asura-images/chapters-merged")) {
        try {
          const obj = JSON.parse(decoded);
          const rawPages = obj.pages;
          // Astro props are serialized like [1, [[0, {"url": [0, "..."]}]]]
          if (Array.isArray(rawPages) && Array.isArray(rawPages[1])) {
            for (const item of rawPages[1]) {
              const urlVal = item?.[1]?.url;
              const pageUrl = Array.isArray(urlVal) ? urlVal[1] : urlVal;
              if (pageUrl && typeof pageUrl === "string") {
                foundPages.push(pageUrl);
              }
            }
          }
        } catch {
          // Continue searching other props
        }
      }
    }

    // Fallback: Cheerio HTML scan for images
    if (foundPages.length === 0) {
      const $ = cheerio.load(html);
      $("img").each((_, el) => {
        const src = $(el).attr("src") || $(el).attr("data-src");
        if (src && (src.includes("chapters") || src.includes("asura-images"))) {
          foundPages.push(src);
        }
      });
    }

    if (foundPages.length === 0) return null;

    const proxiedPages = foundPages.map(
      (url) =>
        `/api/proxy/image?url=${encodeURIComponent(url)}&referer=${encodeURIComponent(`${ASURA_BASE}/`)}`
    );

    return {
      chapterId: `${seriesSlug}/${chapterIdOrSlug}`,
      pages: foundPages,
      proxiedPages,
      sourceName: "Asura Scans HD Stream",
    };
  } catch (err) {
    console.warn("fetchAsuraChapterPages error:", err);
    return null;
  }
}
