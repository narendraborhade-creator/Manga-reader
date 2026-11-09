import * as cheerio from "cheerio";

export interface WeebCentralItem {
  id: string; // e.g. "weebcentral-01J76XY7E9FNDZ1DBBM6PBJPFK/One-Piece"
  rawId: string;
  title: string;
  coverUrl: string;
  genres: string[];
  totalChapters?: number;
  sourceType: "WEEBCENTRAL";
  source: "WEEBCENTRAL";
}

export interface WeebCentralChapter {
  id: string; // e.g. "weebcentral-01M6RHBP1Y3A03BK0TZMBJ2YZN"
  chapterNumber: number;
  chapterString: string;
  title: string;
  mangaId: string;
  sourceName: string;
}

export interface WeebCentralPagesResult {
  chapterId: string;
  pages: string[];
  proxiedPages: string[];
  sourceName: string;
}

const BASE_URL = "https://weebcentral.com";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/**
 * Searches WeebCentral catalog
 */
export async function searchWeebCentral(
  query: string,
  limit = 24
): Promise<WeebCentralItem[]> {
  try {
    if (!query.trim()) return [];
    const searchUrl = `${BASE_URL}/search/data?limit=${limit}&offset=0&text=${encodeURIComponent(
      query.trim()
    )}&sort=Best+Match&order=Descending&official=Any&anime=Any&adult=Any&display_mode=Full+Display`;

    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        "HX-Request": "true",
      },
    });
    if (!res.ok) return [];

    const html = await res.text();
    const $ = cheerio.load(html);

    const items: WeebCentralItem[] = $("article.bg-base-300")
      .map((_, el) => {
        const link = $(el).find("section a").first();
        const href = link.attr("href");
        const rawId = href ? href.split("/series/")[1] : "";
        if (!rawId) return null;

        const title =
          $(el).find("section.hidden.lg\\:block .tooltip a").text().trim() ||
          $(el).find("section a .text-ellipsis").text().trim() ||
          "Manga";

        const image =
          $(el).find("picture source").first().attr("srcset") ||
          $(el).find("picture img").attr("src") ||
          "/placeholder-manga.jpg";

        return {
          id: `weebcentral-${rawId}`,
          rawId,
          title,
          coverUrl: image,
          genres: [] as string[],
          sourceType: "WEEBCENTRAL" as const,
          source: "WEEBCENTRAL" as const,
        };
      })
      .get()
      .filter((x): x is WeebCentralItem => Boolean(x))
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
    console.warn("WeebCentral search error:", err);
    return [];
  }
}

/**
 * Fetches full manga details & chapter feed from WeebCentral
 */
export async function fetchWeebCentralDetails(rawId: string) {
  const cleanId = rawId.replace(/^weebcentral-/, "");
  try {
    const seriesId = cleanId.split("/")[0];
    const [mainRes, chRes] = await Promise.all([
      fetch(`${BASE_URL}/series/${cleanId}`, {
        headers: { "User-Agent": USER_AGENT },
      }),
      fetch(`${BASE_URL}/series/${seriesId}/full-chapter-list`, {
        headers: { "User-Agent": USER_AGENT, "HX-Request": "true" },
      }),
    ]);

    if (!mainRes.ok) return null;

    const mainHtml = await mainRes.text();
    const chHtml = chRes.ok ? await chRes.text() : "";

    const $ = cheerio.load(mainHtml);
    const $ch = cheerio.load(chHtml);

    const title =
      $("h1.text-2xl.font-bold").first().text().trim() ||
      $("h1").first().text().trim() ||
      "Manga";

    const cover =
      $("picture source").first().attr("srcset") ||
      $("picture img").first().attr("src") ||
      "/placeholder-manga.jpg";

    const description = $('strong:contains("Description")')
      .parent()
      .find("p")
      .text()
      .trim();

    const authors = $('strong:contains("Author(s)")')
      .parent()
      .find("a")
      .map((_, el) => $(el).text().trim())
      .get();

    const genres = $('strong:contains("Tags")')
      .parent()
      .find("a")
      .map((_, el) => $(el).text().trim())
      .get();

    const chapters: WeebCentralChapter[] = $ch("a[href*='/chapters/']")
      .map((_, el) => {
        const href = $ch(el).attr("href");
        const chapId = href ? href.split("/chapters/")[1] : "";
        if (!chapId) return null;

        const rawText = $ch(el).text().replace(/\s+/g, " ").trim();
        const numMatch = rawText.match(/Chapter\s+([0-9.]+)/i);
        const num = numMatch
          ? parseFloat(numMatch[1])
          : parseFloat(rawText.replace(/[^0-9.]/g, "")) || 0;
        const cleanTitle = num > 0 ? `Chapter ${num}` : "Chapter 1";

        return {
          id: `weebcentral-${chapId}`,
          chapterNumber: num,
          chapterString: String(num),
          title: cleanTitle,
          mangaId: `weebcentral-${cleanId}`,
          sourceName: "WeebCentral Stream",
        };
      })
      .get()
      .filter((c): c is WeebCentralChapter => Boolean(c));

    return {
      id: `weebcentral-${cleanId}`,
      rawId: cleanId,
      title,
      description: description || "No synopsis available.",
      coverUrl: cover,
      status: "RELEASING",
      authors,
      genres,
      totalChapters: chapters.length,
      chapters,
      sourceType: "WEEBCENTRAL" as const,
    };
  } catch (err) {
    console.error("WeebCentral details error:", err);
    return null;
  }
}

/**
 * Resolves chapter page images from WeebCentral
 */
export async function fetchWeebCentralChapterPages(
  rawChapterId: string
): Promise<WeebCentralPagesResult | null> {
  const cleanChapId = rawChapterId.replace(/^weebcentral-/, "");
  try {
    const res = await fetch(
      `${BASE_URL}/chapters/${cleanChapId}/images?is_prev=False&current_page=1&reading_style=long_strip`,
      {
        headers: { "User-Agent": USER_AGENT },
      }
    );
    if (!res.ok) return null;

    const html = await res.text();
    const $ = cheerio.load(html);

    const directPages: string[] = $("img")
      .map((_, el) => $(el).attr("src"))
      .get()
      .filter((url): url is string => Boolean(url));

    if (!directPages.length) return null;

    const proxiedPages: string[] = directPages.map((url) => {
      return `/api/proxy/image?url=${encodeURIComponent(url)}&referer=${encodeURIComponent("https://weebcentral.com/")}`;
    });

    return {
      chapterId: rawChapterId,
      pages: directPages,
      proxiedPages,
      sourceName: "WeebCentral Stream",
    };
  } catch (err) {
    console.error("WeebCentral chapter pages error:", err);
    return null;
  }
}
