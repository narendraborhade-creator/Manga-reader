import * as cheerio from "cheerio";

export interface MangaPillItem {
  id: string; // e.g. "mangapill-2/one-piece"
  rawId: string; // e.g. "2/one-piece"
  title: string;
  coverUrl: string;
  genres: string[];
  totalChapters?: number;
  sourceType: "MANGAPILL";
  source: "MANGAPILL";
}

export interface MangaPillChapter {
  id: string; // e.g. "mangapill-2-11198000/one-piece-chapter-1198"
  chapterNumber: number;
  chapterString: string;
  title: string;
  mangaId: string;
  sourceName: string;
}

export interface MangaPillPagesResult {
  chapterId: string;
  pages: string[];
  proxiedPages: string[];
  sourceName: string;
}

const BASE_URL = "https://mangapill.com";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export function getMangaPillCover(rawId: string): string {
  const clean = rawId.replace(/^mangapill-/, "");
  const num = clean.split("/")[0];
  if (!num) return "/placeholder-manga.jpg";
  return `https://cdn.readdetectiveconan.com/file/mangapill/i/${num}.webp`;
}

/**
 * Searches MangaPill catalog using cheerio
 */
export async function searchMangaPill(
  query: string,
  limit = 24
): Promise<MangaPillItem[]> {
  try {
    if (!query.trim()) return [];
    const res = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(query.trim())}`, {
      headers: {
        "User-Agent": USER_AGENT,
        Referer: `${BASE_URL}/`,
      },
    });
    if (!res.ok) return [];

    const html = await res.text();
    const $ = cheerio.load(html);

    const items: MangaPillItem[] = $("div.container div.my-3.justify-end > div")
      .map((_, el) => {
        const a = $(el).find("a");
        const href = a.attr("href");
        const rawId = href ? href.split("/manga/")[1] : "";
        if (!rawId) return null;

        const rawTitle = $(el).find("div > a > div").text().trim() || "Manga Title";
        const titleLines = rawTitle.split("\n").map((s) => s.trim()).filter(Boolean);
        const title = titleLines.length > 1 ? titleLines[titleLines.length - 1] : (titleLines[0] || "Manga Title");
        const image = $(el).find("a img").attr("data-src") || getMangaPillCover(rawId);

        return {
          id: `mangapill-${rawId}`,
          rawId,
          title,
          coverUrl: image,
          genres: [] as string[],
          sourceType: "MANGAPILL" as const,
          source: "MANGAPILL" as const,
        };
      })
      .get()
      .filter((x): x is MangaPillItem => Boolean(x))
      .slice(0, limit);

    // Prioritize exact match
    const q = query.trim().toLowerCase();
    items.sort((a, b) => {
      const aExact = a.title.toLowerCase() === q;
      const bExact = b.title.toLowerCase() === q;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      const aStarts = a.title.toLowerCase().startsWith(q);
      const bStarts = b.title.toLowerCase().startsWith(q);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      return 0;
    });

    return items;
  } catch (err) {
    console.warn("MangaPill search error:", err);
    return [];
  }
}

/**
 * Fetches full manga details & chapter feed from MangaPill
 */
export async function fetchMangaPillDetails(rawId: string) {
  const cleanId = rawId.replace(/^mangapill-/, "");
  try {
    const res = await fetch(`${BASE_URL}/manga/${cleanId}`, {
      headers: {
        "User-Agent": USER_AGENT,
        Referer: `${BASE_URL}/`,
      },
    });
    if (!res.ok) return null;

    const html = await res.text();
    const $ = cheerio.load(html);

    const title = $("div.container div.my-3 div.flex-col div.mb-3 h1").text().trim() || "Manga";
    const description = $("div.container div.my-3 div.flex-col p.text--secondary")
      .text()
      .replace(/\s+/g, " ")
      .trim();

    const genres = $("div.container div.my-3 div.flex-col div.mb-3:contains('Genres')")
      .text()
      .split("\n")
      .map((g) => g.trim())
      .filter((g) => g && g !== "Genres");

    const chapters: MangaPillChapter[] = $("div.container div.border-border div#chapters div.grid-cols-1 a")
      .map((_, el) => {
        const href = $(el).attr("href");
        const chapId = href ? href.split("/chapters/")[1] : "";
        if (!chapId) return null;
        const chapTitle = $(el).text().trim();
        const numStr = chapTitle.split("Chapter ")[1] || chapTitle.replace(/[^0-9.]/g, "") || "0";
        const num = parseFloat(numStr) || 0;

        return {
          id: `mangapill-${chapId}`,
          chapterNumber: num,
          chapterString: String(num),
          title: chapTitle || `Chapter ${num}`,
          mangaId: `mangapill-${cleanId}`,
          sourceName: "MangaPill Cloud",
        };
      })
      .get()
      .filter((c): c is MangaPillChapter => Boolean(c));

    const cover = getMangaPillCover(cleanId);

    return {
      id: `mangapill-${cleanId}`,
      rawId: cleanId,
      title,
      description: description || "No synopsis available.",
      coverUrl: cover,
      status: "RELEASING",
      genres,
      totalChapters: chapters.length,
      chapters,
      sourceType: "MANGAPILL" as const,
    };
  } catch (err) {
    console.error("MangaPill details error:", err);
    return null;
  }
}

/**
 * Resolves chapter page images from MangaPill
 */
export async function fetchMangaPillChapterPages(
  rawChapterId: string
): Promise<MangaPillPagesResult | null> {
  const cleanChapId = rawChapterId.replace(/^mangapill-/, "");
  try {
    const res = await fetch(`${BASE_URL}/chapters/${cleanChapId}`, {
      headers: {
        "User-Agent": USER_AGENT,
        Referer: `${BASE_URL}/`,
      },
    });
    if (!res.ok) return null;

    const html = await res.text();
    const $ = cheerio.load(html);

    const directPages: string[] = $("chapter-page")
      .map((_, el) => $(el).find("div picture img").attr("data-src"))
      .get()
      .filter((url): url is string => Boolean(url));

    if (!directPages.length) return null;

    const proxiedPages: string[] = directPages.map((url) => {
      return `/api/proxy/image?url=${encodeURIComponent(url)}&referer=${encodeURIComponent("https://mangapill.com/")}`;
    });

    return {
      chapterId: rawChapterId,
      pages: directPages,
      proxiedPages,
      sourceName: "MangaPill Cloud",
    };
  } catch (err) {
    console.error("MangaPill chapter pages error:", err);
    return null;
  }
}
