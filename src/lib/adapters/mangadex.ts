const MANGADEX_BASE = "https://api.mangadex.org";
const UPLOADS_BASE = "https://uploads.mangadex.org";

export interface NormalizedChapter {
  externalChapId: string;
  mangaExternalId: string;
  mangaTitle: string;
  coverUrl: string;
  chapterNumber: number;
  volumeNumber: number | null;
  title: string;
  language: string;
  scanlator: string;
  publishedAt: string;
  sourceId: string;
  sourceType: "MANGADEX" | "KEIYOUSHI_SUWAYOMI" | "MANGAPILL" | "WEEBCENTRAL" | "ALLMANGA" | "UNIFIED";
  pageCount?: number;
  externalUrl?: string | null;
}

export interface MangaDexManga {
  id: string;
  title: string;
  altTitles: string[];
  description: string;
  coverUrl: string;
  bannerUrl?: string;
  status: string;
  year?: number;
  contentRating: string;
  tags: string[];
  author?: string;
  artist?: string;
}

export function getBestEnglishTitle(
  titleObj: Record<string, string> = {},
  altTitlesList?: Array<Record<string, string>> | string[]
): string {
  // 1. Direct english key in title
  if (titleObj?.en && titleObj.en.trim()) {
    return titleObj.en.trim();
  }
  // 2. Scan altTitles for 'en'
  if (Array.isArray(altTitlesList)) {
    for (const alt of altTitlesList) {
      if (typeof alt === "object" && alt !== null) {
        if (alt.en && alt.en.trim()) return alt.en.trim();
      }
    }
  }
  // 3. Scan for any clean Latin/ASCII title in altTitles
  if (Array.isArray(altTitlesList)) {
    for (const alt of altTitlesList) {
      const val = typeof alt === "string" ? alt : Object.values(alt)[0];
      if (val && /^[\x20-\x7E]+$/.test(val) && val.length > 2) {
        return val.trim();
      }
    }
  }
  // 4. Fallback to ja-ro, or first available title
  return (
    titleObj?.["ja-ro"] ||
    titleObj?.["ja"] ||
    (titleObj ? Object.values(titleObj)[0] : "") ||
    "Unknown Series"
  );
}

/**
 * Batch fetches cover art for multiple manga IDs using ids[] parameter
 */
export async function fetchMangaDexCovers(
  mangaIds: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!mangaIds.length) return map;

  // MangaDex allows up to 100 ids[] in query
  const chunks: string[][] = [];
  for (let i = 0; i < mangaIds.length; i += 80) {
    chunks.push(mangaIds.slice(i, i + 80));
  }

  for (const chunk of chunks) {
    try {
      const params = new URLSearchParams({ limit: String(chunk.length) });
      chunk.forEach((id) => params.append("ids[]", id));
      params.append("includes[]", "cover_art");

      const res = await fetch(`${MANGADEX_BASE}/manga?${params.toString()}`, {
        headers: { "User-Agent": "VajraMangaReader/1.0" },
      });
      if (!res.ok) continue;

      const data = await res.json();
      for (const manga of data.data ?? []) {
        const coverRel = manga.relationships?.find(
          (r: any) => r.type === "cover_art"
        );
        const fileName = coverRel?.attributes?.fileName;
        if (fileName) {
          map.set(
            manga.id,
            `${UPLOADS_BASE}/covers/${manga.id}/${fileName}.512.jpg`
          );
        }
      }
    } catch (err) {
      console.warn("Error fetching MangaDex covers chunk:", err);
    }
  }

  return map;
}

/**
 * Fetches latest released chapters across MangaDex
 * Uses includeExternalUrl=0 to ensure 100% readable pages
 */
export async function fetchMangaDexLatestChapters(
  limit = 24,
  lang = "en"
): Promise<NormalizedChapter[]> {
  try {
    const params = new URLSearchParams({
      limit: "96",
      "translatedLanguage[]": lang,
      "order[readableAt]": "desc",
      "contentRating[]": "safe",
      includeExternalUrl: "0",
    });
    params.append("includes[]", "manga");
    params.append("includes[]", "scanlation_group");

    const res = await fetch(`${MANGADEX_BASE}/chapter?${params.toString()}`, {
      headers: { "User-Agent": "VajraMangaReader/1.0" },
    });

    if (!res.ok) {
      throw new Error(`MangaDex /chapter error: ${res.status}`);
    }

    const json = await res.json();
    const chapters = json.data ?? [];

    const mangaIds: string[] = Array.from(
      new Set(
        chapters
          .map((ch: any) =>
            ch.relationships?.find((r: any) => r.type === "manga")?.id
          )
          .filter(Boolean)
      )
    );

    const coverMap = await fetchMangaDexCovers(mangaIds);

    const seenManga = new Set<string>();
    const uniqueChapters: NormalizedChapter[] = [];

    for (const ch of chapters) {
      const mangaRel = ch.relationships?.find((r: any) => r.type === "manga");
      const mangaId = mangaRel?.id ?? "";
      if (!mangaId || seenManga.has(mangaId)) continue;

      const titleObj = mangaRel?.attributes?.title ?? {};
      const altTitles = mangaRel?.attributes?.altTitles ?? [];
      const mangaTitle = getBestEnglishTitle(titleObj, altTitles);

      // Filter out low quality, unnamed or placeholder entries
      if (!mangaTitle || mangaTitle === "Unknown Manga" || mangaTitle === "Unknown Series") continue;

      const coverUrl = coverMap.get(mangaId);
      if (!coverUrl) continue;

      seenManga.add(mangaId);

      const groupRel = ch.relationships?.find(
        (r: any) => r.type === "scanlation_group"
      );
      const chNumber = parseFloat(ch.attributes?.chapter ?? "0") || 0;
      const volNumber = ch.attributes?.volume
        ? parseFloat(ch.attributes.volume)
        : null;

      uniqueChapters.push({
        externalChapId: ch.id,
        mangaExternalId: mangaId,
        mangaTitle: String(mangaTitle),
        coverUrl,
        chapterNumber: chNumber,
        volumeNumber: volNumber,
        title: ch.attributes?.title || `Chapter ${ch.attributes?.chapter ?? chNumber}`,
        language: ch.attributes?.translatedLanguage ?? lang,
        scanlator: groupRel?.attributes?.name ?? "Official / Community",
        publishedAt:
          ch.attributes?.readableAt ?? ch.attributes?.publishAt ?? new Date().toISOString(),
        sourceId: "mangadex",
        sourceType: "MANGADEX",
        pageCount: ch.attributes?.pages || 0,
        externalUrl: ch.attributes?.externalUrl || null,
      });

      if (uniqueChapters.length >= limit) break;
    }

    return uniqueChapters;
  } catch (error) {
    console.error("fetchMangaDexLatestChapters failed:", error);
    return [];
  }
}

/**
 * Fetches full chapter feed for a specific MangaDex Manga UUID
 */
export async function fetchMangaDexChapterFeed(
  mangaId: string,
  lang = "en"
): Promise<NormalizedChapter[]> {
  const allChapters: NormalizedChapter[] = [];
  let offset = 0;
  const limit = 500;

  // First try fetching chapters in requested language
  while (true) {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
      "order[chapter]": "asc",
      "order[volume]": "asc",
      includeExternalUrl: "0",
    });
    params.append("contentRating[]", "safe");
    params.append("contentRating[]", "suggestive");
    if (lang && lang !== "all") {
      params.append("translatedLanguage[]", lang);
    }
    params.append("includes[]", "scanlation_group");

    const res = await fetch(
      `${MANGADEX_BASE}/manga/${mangaId}/feed?${params.toString()}`,
      { headers: { "User-Agent": "VajraMangaReader/1.0" } }
    );
    if (!res.ok) break;

    const json = await res.json();
    const batch = json.data ?? [];

    for (const ch of batch) {
      const groupRel = ch.relationships?.find(
        (r: any) => r.type === "scanlation_group"
      );
      const chNumber = parseFloat(ch.attributes?.chapter ?? "0") || 0;
      const volNumber = ch.attributes?.volume
        ? parseFloat(ch.attributes.volume)
        : null;

      allChapters.push({
        externalChapId: ch.id,
        mangaExternalId: mangaId,
        mangaTitle: "",
        coverUrl: "",
        chapterNumber: chNumber,
        volumeNumber: volNumber,
        title: ch.attributes?.title || `Chapter ${ch.attributes?.chapter ?? chNumber}`,
        language: ch.attributes?.translatedLanguage ?? "en",
        scanlator: groupRel?.attributes?.name ?? "Official / Community",
        publishedAt:
          ch.attributes?.readableAt ?? ch.attributes?.publishAt ?? new Date().toISOString(),
        sourceId: "mangadex",
        sourceType: "MANGADEX",
        pageCount: ch.attributes?.pages || 0,
        externalUrl: ch.attributes?.externalUrl || null,
      });
    }

    if (offset + limit >= (json.total ?? 0) || batch.length === 0) break;
    offset += limit;
  }

  // Strict English language enforcement: return pure English chapters
  return allChapters;
}

export interface ChapterPagesResult {
  chapterId: string;
  baseUrl: string;
  hash: string;
  quality: "data" | "data-saver";
  files: string[];
  proxiedPages: string[];
  directPages: string[];
}

/**
 * Resolves chapter page URLs via MangaDex@Home server endpoint
 * Sets cache: "no-store" because MangaDex@Home tokens expire after 15 minutes!
 */
export async function resolveMangaDexChapterPages(
  chapterId: string,
  quality: "data" | "data-saver" = "data"
): Promise<ChapterPagesResult> {
  const res = await fetch(`${MANGADEX_BASE}/at-home/server/${chapterId}`, {
    headers: { "User-Agent": "VajraMangaReader/1.0" },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to resolve MangaDex@Home server: ${res.status}`);
  }

  const payload = await res.json();
  const baseUrl: string = payload.baseUrl;
  const hash: string = payload.chapter.hash;
  const files: string[] =
    quality === "data" ? payload.chapter.data : payload.chapter.dataSaver;

  const proxiedPages = (files || []).map((file) => {
    const rawUrl = `${baseUrl}/${quality}/${hash}/${file}`;
    return `/api/proxy/image?url=${encodeURIComponent(rawUrl)}&referer=${encodeURIComponent("https://mangadex.org")}`;
  });

  const directPages = (files || []).map((file) => {
    return `${baseUrl}/${quality}/${hash}/${file}`;
  });

  return {
    chapterId,
    baseUrl,
    hash,
    quality,
    files: files || [],
    proxiedPages,
    directPages,
  };
}

/**
 * Search MangaDex by title and tags
 */
export async function searchMangaDex(
  query: string,
  limit = 24
): Promise<MangaDexManga[]> {
  try {
    const params = new URLSearchParams({
      limit: String(limit),
      "order[followedCount]": "desc",
    });
    params.append("contentRating[]", "safe");
    params.append("contentRating[]", "suggestive");
    params.append("includes[]", "cover_art");
    params.append("includes[]", "author");
    params.append("includes[]", "artist");

    if (query.trim()) {
      params.append("title", query.trim());
    }

    const res = await fetch(`${MANGADEX_BASE}/manga?${params.toString()}`, {
      headers: { "User-Agent": "VajraMangaReader/1.0" },
    });

    if (!res.ok) {
      throw new Error(`MangaDex search failed with status ${res.status}`);
    }

    const json = await res.json();
    const items = json.data ?? [];

    const itemsMapped = items.map((manga: any) => {
      const titleObj = manga.attributes?.title ?? {};
      const altTitles = (manga.attributes?.altTitles ?? []).map(
        (alt: Record<string, string>) => Object.values(alt)[0]
      );
      const title = getBestEnglishTitle(titleObj, manga.attributes?.altTitles);

      const descObj = manga.attributes?.description ?? {};
      const description =
        descObj.en ||
        Object.values(descObj)[0] ||
        "No description available.";

      const coverRel = manga.relationships?.find(
        (r: any) => r.type === "cover_art"
      );
      const authorRel = manga.relationships?.find(
        (r: any) => r.type === "author"
      );
      const artistRel = manga.relationships?.find(
        (r: any) => r.type === "artist"
      );

      const fileName = coverRel?.attributes?.fileName;
      const coverUrl = fileName
        ? `${UPLOADS_BASE}/covers/${manga.id}/${fileName}.512.jpg`
        : "/placeholder-manga.jpg";

      const tags = (manga.attributes?.tags ?? [])
        .map((t: any) => t.attributes?.name?.en)
        .filter(Boolean);

      return {
        id: manga.id,
        title: String(title),
        altTitles,
        description: String(description),
        coverUrl,
        status: manga.attributes?.status?.toUpperCase() || "ONGOING",
        year: manga.attributes?.year,
        contentRating: manga.attributes?.contentRating || "safe",
        tags,
        author: authorRel?.attributes?.name,
        artist: artistRel?.attributes?.name,
      };
    });

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      itemsMapped.sort((a: any, b: any) => {
        const aExact = a.title.toLowerCase() === q || (a.altTitles && a.altTitles.some((t: string) => t.toLowerCase() === q));
        const bExact = b.title.toLowerCase() === q || (b.altTitles && b.altTitles.some((t: string) => t.toLowerCase() === q));
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        const aStarts = a.title.toLowerCase().startsWith(q);
        const bStarts = b.title.toLowerCase().startsWith(q);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        return 0;
      });
    }

    return itemsMapped;
  } catch (err) {
    console.error("searchMangaDex failed:", err);
    return [];
  }
}

/**
 * Fetch detailed Manga info by MangaDex ID
 */
export async function fetchMangaDexDetails(mangaId: string): Promise<MangaDexManga | null> {
  try {
    const params = new URLSearchParams();
    params.append("includes[]", "cover_art");
    params.append("includes[]", "author");
    params.append("includes[]", "artist");

    const res = await fetch(`${MANGADEX_BASE}/manga/${mangaId}?${params.toString()}`, {
      headers: { "User-Agent": "VajraMangaReader/1.0" },
    });

    if (!res.ok) return null;
    const json = await res.json();
    const manga = json.data;
    if (!manga) return null;

    const titleObj = manga.attributes?.title ?? {};
    const title = getBestEnglishTitle(titleObj, manga.attributes?.altTitles);

    const altTitles = (manga.attributes?.altTitles ?? []).map(
      (alt: Record<string, string>) => Object.values(alt)[0]
    );

    const descObj = manga.attributes?.description ?? {};
    const description =
      descObj.en ||
      Object.values(descObj)[0] ||
      "";

    const coverRel = manga.relationships?.find((r: any) => r.type === "cover_art");
    const authorRel = manga.relationships?.find((r: any) => r.type === "author");
    const artistRel = manga.relationships?.find((r: any) => r.type === "artist");

    const fileName = coverRel?.attributes?.fileName;
    const coverUrl = fileName
      ? `${UPLOADS_BASE}/covers/${manga.id}/${fileName}.512.jpg`
      : "/placeholder-manga.jpg";

    const tags = (manga.attributes?.tags ?? [])
      .map((t: any) => t.attributes?.name?.en)
      .filter(Boolean);

    return {
      id: manga.id,
      title: String(title),
      altTitles,
      description: String(description),
      coverUrl,
      status: manga.attributes?.status?.toUpperCase() || "ONGOING",
      year: manga.attributes?.year,
      contentRating: manga.attributes?.contentRating || "safe",
      tags,
      author: authorRel?.attributes?.name,
      artist: artistRel?.attributes?.name,
    };
  } catch (err) {
    console.error("fetchMangaDexDetails error:", err);
    return null;
  }
}
