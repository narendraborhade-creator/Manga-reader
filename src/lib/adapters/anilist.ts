import { fetchJikanManga, fetchKitsuManga, FallbackMetadata } from "./jikan-kitsu";

const ANILIST_ENDPOINT = "https://graphql.anilist.co";

export interface AniListMedia {
  id: number;
  idMal?: number;
  title: {
    romaji: string;
    english: string | null;
    native: string | null;
  };
  description: string | null;
  bannerImage: string | null;
  coverImage: {
    extraLarge: string | null;
    large: string | null;
    color: string | null;
  };
  genres: string[];
  averageScore: number | null;
  status: string;
  chapters?: number | null;
  volumes?: number | null;
}

export async function fetchAniListTrending(perPage = 10): Promise<AniListMedia[]> {
  const query = `
    query ($perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(type: MANGA, sort: TRENDING_DESC) {
          id
          idMal
          title { romaji english native }
          description(asHtml: false)
          bannerImage
          coverImage { extraLarge large color }
          genres
          averageScore
          status
          chapters
          volumes
        }
      }
    }
  `;

  try {
    const res = await fetch(ANILIST_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { perPage } }),
    });

    if (!res.ok) return [];
    const json = await res.json();
    return json.data?.Page?.media ?? [];
  } catch (err) {
    console.error("fetchAniListTrending failed:", err);
    return [];
  }
}

export async function fetchAniListPopular(perPage = 12): Promise<AniListMedia[]> {
  const query = `
    query ($perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(type: MANGA, sort: POPULARITY_DESC) {
          id
          idMal
          title { romaji english native }
          description(asHtml: false)
          bannerImage
          coverImage { extraLarge large color }
          genres
          averageScore
          status
          chapters
          volumes
        }
      }
    }
  `;

  try {
    const res = await fetch(ANILIST_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { perPage } }),
    });

    if (!res.ok) return [];
    const json = await res.json();
    return json.data?.Page?.media ?? [];
  } catch (err) {
    console.error("fetchAniListPopular failed:", err);
    return [];
  }
}

export async function fetchRichMangaMetadata(
  searchTitle: string
): Promise<{
  source: "ANILIST" | "JIKAN" | "KITSU" | "NONE";
  data: AniListMedia | FallbackMetadata | null;
}> {
  const query = `
    query ($search: String) {
      Media(search: $search, type: MANGA, sort: POPULARITY_DESC) {
        id
        idMal
        title { romaji english native }
        description(asHtml: false)
        bannerImage
        coverImage { extraLarge large color }
        genres
        averageScore
        status
        chapters
        volumes
      }
    }
  `;

  try {
    const res = await fetch(ANILIST_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { search: searchTitle } }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.data?.Media) {
        return { source: "ANILIST", data: json.data.Media };
      }
    }
  } catch (err) {
    console.warn("AniList query failed, falling back to Jikan v4:", err);
  }

  // Fallback 1: Jikan v4
  const jikan = await fetchJikanManga(searchTitle);
  if (jikan) {
    return { source: "JIKAN", data: jikan };
  }

  // Fallback 2: Kitsu
  const kitsu = await fetchKitsuManga(searchTitle);
  if (kitsu) {
    return { source: "KITSU", data: kitsu };
  }

  return { source: "NONE", data: null };
}
