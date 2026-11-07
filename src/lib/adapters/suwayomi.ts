const SUWAYOMI_URL = process.env.SUWAYOMI_URL || "http://localhost:4567";

async function suwayomiGraphQL<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const res = await fetch(`${SUWAYOMI_URL}/api/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`Suwayomi GraphQL HTTP error: ${res.status}`);
  }
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }
  return json.data as T;
}

/**
 * Check if local Suwayomi container is reachable
 */
export async function isSuwayomiOnline(): Promise<boolean> {
  try {
    const res = await fetch(`${SUWAYOMI_URL}/api/v1/about`, {
      method: "GET",
      signal: AbortSignal.timeout(1500),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Fetches latest updated manga from a specific Keiyoushi Extension Source ID
 */
export async function fetchKeiyoushiSourceLatest(
  sourceId: string,
  page = 1
) {
  const mutation = `
    mutation FetchLatest($source: LongString!, $page: Int!) {
      fetchSourceManga(input: { source: $source, type: LATEST, page: $page }) {
        hasNextPage
        mangas {
          id
          title
          thumbnailUrl
          inLibrary
          sourceId
        }
      }
    }
  `;
  return suwayomiGraphQL<{
    fetchSourceManga: {
      hasNextPage: boolean;
      mangas: Array<{
        id: number;
        title: string;
        thumbnailUrl: string;
        sourceId: string;
      }>;
    };
  }>(mutation, { source: sourceId, page });
}

/**
 * Fetches and syncs all chapters for a manga from a Keiyoushi Extension
 */
export async function fetchKeiyoushiMangaChapters(mangaId: number) {
  const mutation = `
    mutation FetchChapters($mangaId: Int!) {
      fetchChapters(input: { mangaId: $mangaId }) {
        chapters {
          id
          name
          chapterNumber
          uploadDate
          scanlator
          pageCount
          index
        }
      }
    }
  `;
  const data = await suwayomiGraphQL<{
    fetchChapters: {
      chapters: Array<{
        id: number;
        name: string;
        chapterNumber: number;
        uploadDate: string;
        scanlator: string | null;
        pageCount: number;
        index: number;
      }>;
    };
  }>(mutation, { mangaId });

  // Sort strictly by chapterNumber ascending for accurate reading order
  return (data.fetchChapters?.chapters ?? []).sort(
    (a, b) => a.chapterNumber - b.chapterNumber
  );
}

/**
 * Resolves proxied page image URLs for a Suwayomi chapter
 */
export async function resolveKeiyoushiChapterPages(
  chapterId: number
): Promise<string[]> {
  const mutation = `
    mutation FetchPages($chapterId: Int!) {
      fetchChapterPages(input: { chapterId: $chapterId }) {
        pages
      }
    }
  `;
  const data = await suwayomiGraphQL<{
    fetchChapterPages: { pages: string[] };
  }>(mutation, { chapterId });

  return (data.fetchChapterPages?.pages ?? []).map((pagePath) => {
    const fullUrl = pagePath.startsWith("http")
      ? pagePath
      : `${SUWAYOMI_URL}${pagePath}`;
    return `/api/proxy/image?url=${encodeURIComponent(fullUrl)}`;
  });
}
