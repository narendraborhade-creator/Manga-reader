import * as cheerio from "cheerio";
import { NormalizedChapter } from "./mangadex";

export interface MangaKatanaItem {
  id: string; // e.g. "mangakatana-worlds-strongest-troll.26644"
  rawSlug: string; // e.g. "worlds-strongest-troll.26644"
  title: string;
  altTitles?: string[];
  coverUrl: string;
  genres: string[];
  totalChapters?: number;
  status?: string;
  description?: string;
  sourceType: "MANGAKATANA";
  source: "MANGAKATANA";
}

export interface MangaKatanaChapter {
  id: string; // e.g. "mangakatana-worlds-strongest-troll.26644/c197"
  chapterNumber: number;
  chapterString: string;
  title: string;
  mangaId: string;
  sourceName: string;
}

export interface MangaKatanaPagesResult {
  chapterId: string;
  pages: string[];
  proxiedPages: string[];
  directPages: string[];
  sourceName: string;
}

const BASE_URL = "https://mangakatana.com";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export function extractChapterNum(title: string, href: string): number {
  const hrefMatch = href.match(/\/c([0-9]+(?:\.[0-9]+)?)/i);
  if (hrefMatch) return parseFloat(hrefMatch[1]);
  const titleMatch = title.match(/(?:chapter|ch\.|ch|ep\.|ep)\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (titleMatch) return parseFloat(titleMatch[1]);
  return 0;
}

/**
 * Searches MangaKatana catalog
 */
export async function searchMangaKatana(
  query: string,
  limit = 24
): Promise<MangaKatanaItem[]> {
  try {
    if (!query || !query.trim()) return [];
    const searchUrl = `${BASE_URL}/?search=${encodeURIComponent(query.trim())}`;
    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        Referer: `${BASE_URL}/`,
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];

    const html = await res.text();
    const $ = cheerio.load(html);

    // Case 1: Direct redirect to Manga Detail Page
    if ($("div.chapters tr").length > 0) {
      const canonical = $('link[rel="canonical"]').attr("href") || "";
      const slug = canonical.split("/manga/")[1] || query.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const title =
        $("h1.heading").text().trim() ||
        $('meta[property="og:title"]').attr("content") ||
        query.trim();

      const coverUrl =
        $("div.media div.cover img").attr("src") ||
        $('meta[property="og:image"]').attr("content") ||
        "/placeholder-manga.jpg";

      const genres = $("div.genres a")
        .map((_, el) => $(el).text().trim())
        .get();

      const totalChapters = $("div.chapters tr div.chapter a").length;
      const status = $("div.media div.status").text().trim().toUpperCase() || "ONGOING";
      const description = $("div.summary p").text().trim() || $("div.summary").text().trim();

      return [
        {
          id: `mangakatana-${slug}`,
          rawSlug: slug,
          title,
          altTitles: [],
          coverUrl,
          genres,
          totalChapters,
          status,
          description,
          sourceType: "MANGAKATANA",
          source: "MANGAKATANA",
        },
      ];
    }

    // Case 2: Multi-Item Search Results List
    const items: MangaKatanaItem[] = [];
    $("#book_list .item").each((_, el) => {
      if (items.length >= limit) return false;

      const a = $(el).find("h3.title a");
      const href = a.attr("href") || "";
      const slug = href.split("/manga/")[1];
      if (!slug) return;

      const title = a.text().trim();
      const coverUrl =
        $(el).find(".wrap_img picture source").first().attr("srcset") ||
        $(el).find(".wrap_img img").attr("src") ||
        "/placeholder-manga.jpg";

      const genres = $(el)
        .find(".genres a")
        .map((_, g) => $(g).text().trim())
        .get();

      const status = $(el).find(".status").text().trim().toUpperCase() || "ONGOING";
      const description = $(el).find(".summary").text().trim();

      // Extract approximate total chapters
      const firstChapText = $(el).find("div.chapters .chapter a").first().text().trim();
      const numMatch = firstChapText.match(/(?:chapter|ch\.|ch)\s*([0-9.]+)/i);
      const totalChapters = numMatch ? Math.floor(parseFloat(numMatch[1])) : 0;

      items.push({
        id: `mangakatana-${slug}`,
        rawSlug: slug,
        title,
        altTitles: [],
        coverUrl,
        genres,
        totalChapters,
        status,
        description,
        sourceType: "MANGAKATANA",
        source: "MANGAKATANA",
      });
    });

    return items;
  } catch (err) {
    console.error("searchMangaKatana error:", err);
    return [];
  }
}

/**
 * Fetches full Manga Details and Chapter List from MangaKatana
 */
export async function fetchMangaKatanaDetails(id: string) {
  try {
    const rawSlug = id.replace(/^mangakatana-/, "");
    const url = `${BASE_URL}/manga/${rawSlug}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Referer: `${BASE_URL}/`,
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;

    const html = await res.text();
    const $ = cheerio.load(html);

    const title =
      $("h1.heading").text().trim() ||
      $('meta[property="og:title"]').attr("content") ||
      "Manga";

    const coverUrl =
      $("div.media div.cover img").attr("src") ||
      $('meta[property="og:image"]').attr("content") ||
      "/placeholder-manga.jpg";

    const description = $("div.summary p").text().trim() || $("div.summary").text().trim();
    const genres = $("div.genres a")
      .map((_, el) => $(el).text().trim())
      .get();
    const status = $("div.media div.status").text().trim().toUpperCase() || "ONGOING";

    const chapters: MangaKatanaChapter[] = [];
    $("div.chapters tr").each((_, el) => {
      const a = $(el).find("div.chapter a");
      if (!a.length) return;

      const href = a.attr("href") || "";
      const rawPath = href.replace(/^https?:\/\/mangakatana\.com\/manga\//i, "");
      const chTitle = a.text().trim();
      const chapterNumber = extractChapterNum(chTitle, href);

      chapters.push({
        id: `mangakatana-${rawPath}`,
        chapterNumber,
        chapterString: String(chapterNumber),
        title: chTitle,
        mangaId: `mangakatana-${rawSlug}`,
        sourceName: "MangaKatana Stream",
      });
    });

    return {
      id: `mangakatana-${rawSlug}`,
      title,
      coverUrl,
      description,
      genres,
      status,
      chapters,
      totalChapters: chapters.length,
    };
  } catch (err) {
    console.error("fetchMangaKatanaDetails error:", err);
    return null;
  }
}

/**
 * Fetches all image pages for a MangaKatana chapter
 */
export async function fetchMangaKatanaPages(chapterId: string): Promise<MangaKatanaPagesResult | null> {
  try {
    const rawPath = chapterId.replace(/^mangakatana-/, "");
    const url = `${BASE_URL}/manga/${rawPath}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Referer: `${BASE_URL}/`,
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;

    const html = await res.text();
    let pages: string[] = [];

    // Parse var thzq = [...]
    const thzqMatch = html.match(/var\s+thzq\s*=\s*\[([^\]]+)\]/);
    if (thzqMatch) {
      const matches = thzqMatch[1].match(/'([^']+)'|"([^"]+)"/g);
      if (matches) {
        pages = matches.map((s) => s.replace(/['"]/g, ""));
      }
    }

    // Fallback: parse any variable holding image URLs array
    if (!pages.length) {
      const anyArr = html.match(/var\s+[a-zA-Z0-9_]+\s*=\s*\[([^\]]*http[^\]]*)\]/);
      if (anyArr) {
        const matches = anyArr[1].match(/'([^']+)'|"([^"]+)"/g);
        if (matches) {
          pages = matches.map((s) => s.replace(/['"]/g, ""));
        }
      }
    }

    if (!pages.length) return null;

    const proxiedPages = pages.map(
      (p) => `/api/proxy/image?url=${encodeURIComponent(p)}&referer=${encodeURIComponent(`${BASE_URL}/`)}`
    );

    return {
      chapterId: `mangakatana-${rawPath}`,
      pages,
      proxiedPages,
      directPages: pages,
      sourceName: "MangaKatana Stream",
    };
  } catch (err) {
    console.error("fetchMangaKatanaPages error:", err);
    return null;
  }
}

/**
 * Fetches latest updated chapters from MangaKatana
 */
export async function fetchMangaKatanaLatestChapters(limit = 24): Promise<NormalizedChapter[]> {
  try {
    const url = `${BASE_URL}/latest`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Referer: `${BASE_URL}/`,
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];

    const html = await res.text();
    const $ = cheerio.load(html);

    const items: NormalizedChapter[] = [];
    $("#book_list .item").each((_, el) => {
      if (items.length >= limit) return false;

      const a = $(el).find("h3.title a");
      const rawTitle = a.text().trim();
      const title = rawTitle
        .replace(/\s*-\s*update\s+chapter\s+.*$/i, "")
        .replace(/\s*-\s*update.*$/i, "")
        .trim() || rawTitle;
      const href = a.attr("href") || "";
      const slug = href.split("/manga/")[1];
      if (!title || !slug) return;

      const cover =
        $(el).find(".wrap_img picture source").first().attr("srcset") ||
        $(el).find(".wrap_img img").attr("src") ||
        "/placeholder-manga.jpg";

      const latestChA = $(el).find("div.chapters .chapter a").first();
      const latestChTitle = latestChA.text().trim();
      const latestChHref = latestChA.attr("href") || "";
      const rawPath = latestChHref.replace(/^https?:\/\/mangakatana\.com\/manga\//i, "");

      const chNum = extractChapterNum(latestChTitle, latestChHref);

      items.push({
        externalChapId: `mangakatana-${rawPath || `${slug}/c${chNum}`}`,
        mangaExternalId: `mangakatana-${slug}`,
        mangaTitle: title,
        coverUrl: cover,
        chapterNumber: chNum,
        volumeNumber: null,
        title: latestChTitle || `Chapter ${chNum}`,
        language: "en",
        scanlator: "Mihon / MangaKatana Stream",
        publishedAt: new Date().toISOString(),
        sourceId: "mangakatana",
        sourceType: "MANGAKATANA",
        pageCount: 0,
      });
    });

    return items;
  } catch (err) {
    console.error("fetchMangaKatanaLatestChapters failed:", err);
    return [];
  }
}
