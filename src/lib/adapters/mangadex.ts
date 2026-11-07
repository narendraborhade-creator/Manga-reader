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
  sourceType: "MANGADEX" | "KEIYOUSHI_SUWAYOMI";
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
  limit = 32,
  lang = "en"
): Promise<NormalizedChapter[]> {
  try {
    const params = new URLSearchParams({
      limit: String(limit),
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

    return chapters.map((ch: any) => {
      const mangaRel = ch.relationships?.find((r: any) => r.type === "manga");
      const groupRel = ch.relationships?.find(
        (r: any) => r.type === "scanlation_group"
      );
      const mangaId = mangaRel?.id ?? "";
      const titleObj = mangaRel?.attributes?.title ?? {};
      const mangaTitle =
        titleObj.en ||
        Object.values(titleObj)[0] ||
        "Unknown Manga";

      const chNumber = parseFloat(ch.attributes?.chapter ?? "0") || 0;
      const volNumber = ch.attributes?.volume
        ? parseFloat(ch.attributes.volume)
        : null;

      return {
        externalChapId: ch.id,
        mangaExternalId: mangaId,
        mangaTitle: String(mangaTitle),
        coverUrl: coverMap.get(mangaId) || "/placeholder-manga.jpg",
        chapterNumber: chNumber,
        volumeNumber: volNumber,
        title: ch.attributes?.title || `Chapter ${ch.attributes?.chapter ?? chNumber}`,
        language: ch.attributes?.translatedLanguage ?? lang,
        scanlator: groupRel?.attributes?.name ?? "Scanlation Collective",
        publishedAt:
          ch.attributes?.readableAt ?? ch.attributes?.publishAt ?? new Date().toISOString(),
        sourceId: "mangadex",
        sourceType: "MANGADEX",
        pageCount: ch.attributes?.pages || 0,
        externalUrl: ch.attributes?.externalUrl || null,
      };
    });
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
      "contentRating[]": "safe",
    });
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

  // Fallback: If 0 chapters found for requested language (e.g. en), fetch all languages
  if (allChapters.length === 0 && lang !== "all") {
    return fetchMangaDexChapterFeed(mangaId, "all");
  }

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
      "contentRating[]": "safe",
      "order[relevance]": "desc",
    });
    params.append("includes[]", "cover_art");
    params.append("includes[]", "author");
    params.append("includes[]", "artist");

    if (query.trim()) {
      params.append("title", query.trim());
    } else {
      params.append("order[followedCount]", "desc");
    }

    const res = await fetch(`${MANGADEX_BASE}/manga?${params.toString()}`, {
      headers: { "User-Agent": "VajraMangaReader/1.0" },
    });

    if (!res.ok) {
      throw new Error(`MangaDex search failed with status ${res.status}`);
    }

    const json = await res.json();
    const items = json.data ?? [];

    return items.map((manga: any) => {
      const titleObj = manga.attributes?.title ?? {};
      const title =
        titleObj.en ||
        Object.values(titleObj)[0] ||
        "Unknown Series";

      const altTitles = (manga.attributes?.altTitles ?? []).map(
        (alt: Record<string, string>) => Object.values(alt)[0]
      );

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
    const title =
      titleObj.en ||
      Object.values(titleObj)[0] ||
      "Unknown Series";

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
