const ALLMANGA_GRAPHQL = "https://api.allanime.day/api";
const ALLMANGA_IMG_BASE = "https://allanime.site";

export interface AllMangaItem {
  id: string; // e.g. "ex9vXC6gWYY9bGkSo"
  title: string;
  coverUrl: string;
  englishName?: string;
  genres: string[];
  totalChapters: number;
  status?: string;
  sourceType: "ALLMANGA";
}

export interface AllMangaChapter {
  id: string;
  chapterNumber: number;
  chapterString: string;
  title: string;
  mangaId: string;
  sourceName: string;
}

export interface AllMangaPagesResult {
  mangaId: string;
  chapterString: string;
  sourceName: string;
  pages: string[];
  proxiedPages: string[];
}

/**
 * Searches AllManga via its GraphQL API
 */
export async function searchAllManga(
  query: string,
  limit = 24
): Promise<AllMangaItem[]> {
  try {
    const q = `query($search: SearchInput, $limit: Int, $translationType: VaildTranslationTypeMangaEnumType) {
      mangas(search: $search, limit: $limit, translationType: $translationType) {
        edges {
          _id
          name
          thumbnail
          englishName
          genres
          availableChapters
        }
      }
    }`;

    const res = await fetch(ALLMANGA_GRAPHQL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Referer: "https://allmanga.to",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      },
      body: JSON.stringify({
        query: q,
        variables: {
          search: { query: query.trim() || "One Piece" },
          limit,
          translationType: "sub",
        },
      }),
    });

    if (!res.ok) return [];
    const json = await res.json();
    const edges = json.data?.mangas?.edges ?? [];

    const mapped = edges.map((item: any) => {
      let cover = "/placeholder-manga.jpg";
      if (item.thumbnail) {
        cover = item.thumbnail.startsWith("http")
          ? item.thumbnail
          : `${ALLMANGA_IMG_BASE}/${item.thumbnail}`;
      }

      return {
        id: `allmanga-${item._id}`,
        title: item.englishName || item.name || "Unknown Manga",
        coverUrl: cover,
        englishName: item.englishName,
        genres: item.genres ?? [],
        totalChapters: item.availableChapters?.sub ?? 0,
        sourceType: "ALLMANGA" as const,
      };
    });

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      mapped.sort((a: any, b: any) => {
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
    }

    return mapped;
  } catch (err) {
    console.warn("searchAllManga error:", err);
    return [];
  }
}

/**
 * Fetches AllManga details and full chapter list
 */
export async function fetchAllMangaDetails(rawId: string) {
  let mangaId = rawId.replace(/^allmanga-/, "");
  // If rawId was a chapter ID like "allmanga-kBuHzCdd5mzk9fvF7-1", extract the series ID
  if (mangaId.includes("-")) {
    mangaId = mangaId.split("-")[0];
  }

  try {
    const q = `query($mangaId: String!) {
      manga(_id: $mangaId) {
        _id
        name
        thumbnail
        description
        status
        authors
        genres
        availableChaptersDetail
      }
    }`;

    const res = await fetch(ALLMANGA_GRAPHQL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Referer: "https://allmanga.to",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      },
      body: JSON.stringify({
        query: q,
        variables: { mangaId },
      }),
    });

    if (!res.ok) return null;
    const json = await res.json();
    const m = json.data?.manga;
    if (!m) return null;

    let cover = "/placeholder-manga.jpg";
    if (m.thumbnail) {
      cover = m.thumbnail.startsWith("http")
        ? m.thumbnail
        : `${ALLMANGA_IMG_BASE}/${m.thumbnail}`;
    }

    const chapterStrings: string[] = m.availableChaptersDetail?.sub ?? [];

    // Convert strings to sorted chapter items
    const chapters: AllMangaChapter[] = chapterStrings.map((chStr) => ({
      id: `allmanga-${mangaId}-${encodeURIComponent(chStr)}`,
      chapterNumber: parseFloat(chStr) || 0,
      chapterString: chStr,
      title: `Chapter ${chStr}`,
      mangaId: `allmanga-${mangaId}`,
      sourceName: "AllManga Engine",
    }));

    return {
      id: `allmanga-${m._id}`,
      rawId: m._id,
      title: m.name,
      description: m.description ? m.description.replace(/<[^>]*>?/gm, "") : "",
      coverUrl: cover,
      status: m.status?.toUpperCase() || "RELEASING",
      authors: m.authors ?? [],
      genres: m.genres ?? [],
      totalChapters: chapters.length,
      chapters,
      sourceType: "ALLMANGA",
    };
  } catch (err) {
    console.error("fetchAllMangaDetails error:", err);
    return null;
  }
}

/**
 * Resolves chapter pages from AllManga using chaptersForRead
 */
export async function fetchAllMangaChapterPages(
  rawMangaId: string,
  chapterString: string
): Promise<AllMangaPagesResult | null> {
  const mangaId = rawMangaId.replace(/^allmanga-/, "");

  try {
    const q = `query($mangaId: String!, $chapterString: String!, $translationType: VaildTranslationTypeMangaEnumType!) {
      chaptersForRead(mangaId: $mangaId, chapterString: $chapterString, translationType: $translationType) {
        edges {
          _id
          sourceName
          pictureUrls
        }
      }
    }`;

    const res = await fetch(ALLMANGA_GRAPHQL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Referer: "https://allmanga.to",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      },
      body: JSON.stringify({
        query: q,
        variables: {
          mangaId,
          chapterString,
          translationType: "sub",
        },
      }),
    });

    if (!res.ok) return null;
    const json = await res.json();
    const edges = json.data?.chaptersForRead?.edges ?? [];
    if (!edges.length) return null;

    // Pick highest priority source with pictureUrls
    const edge = edges.find((e: any) => e.pictureUrls?.length > 0) || edges[0];
    const sourceName = edge.sourceName || "AllManga Scanlation";
    const rawUrls = edge.pictureUrls ?? [];

    const pages: string[] = rawUrls
      .map((item: any) => {
        const urlStr: string = typeof item === "string" ? item : item.url;
        if (!urlStr) return "";
        if (urlStr.startsWith("http")) return urlStr;
        return `${ALLMANGA_IMG_BASE}/${urlStr}`;
      })
      .filter(Boolean);

    const proxiedPages = pages.map((pageUrl) => {
      const referer = pageUrl.includes("planeptune.us")
        ? "https://mangasee123.com/"
        : "https://allmanga.to/";
      return `/api/proxy/image?url=${encodeURIComponent(pageUrl)}&referer=${encodeURIComponent(referer)}`;
    });

    return {
      mangaId,
      chapterString,
      sourceName,
      pages,
      proxiedPages,
    };
  } catch (err) {
    console.error("fetchAllMangaChapterPages error:", err);
    return null;
  }
}
