const JIKAN_ENDPOINT = "https://api.jikan.moe/v4";
const KITSU_ENDPOINT = "https://kitsu.io/api/edge";

export interface FallbackMetadata {
  source: "JIKAN" | "KITSU";
  title: string;
  synopsis: string;
  coverImage?: string;
  bannerImage?: string;
  score?: number;
  genres: string[];
  status?: string;
}

export async function fetchJikanManga(title: string): Promise<FallbackMetadata | null> {
  try {
    const res = await fetch(
      `${JIKAN_ENDPOINT}/manga?q=${encodeURIComponent(title)}&limit=1`,
      {
        headers: { "User-Agent": "VajraMangaReader/1.0" },
      }
    );
    if (!res.ok) return null;

    const json = await res.json();
    const item = json.data?.[0];
    if (!item) return null;

    return {
      source: "JIKAN",
      title: item.title_english || item.title || title,
      synopsis: item.synopsis || "",
      coverImage: item.images?.webp?.large_image_url || item.images?.jpg?.large_image_url,
      score: item.score ? Math.round(item.score * 10) : undefined,
      genres: (item.genres ?? []).map((g: any) => g.name),
      status: item.status,
    };
  } catch (err) {
    console.warn("Jikan fetch failed:", err);
    return null;
  }
}

export async function fetchKitsuManga(title: string): Promise<FallbackMetadata | null> {
  try {
    const res = await fetch(
      `${KITSU_ENDPOINT}/manga?filter[text]=${encodeURIComponent(title)}&page[limit]=1`,
      {
        headers: { Accept: "application/vnd.api+json" },
      }
    );
    if (!res.ok) return null;

    const json = await res.json();
    const item = json.data?.[0];
    if (!item?.attributes) return null;

    const attr = item.attributes;
    return {
      source: "KITSU",
      title: attr.canonicalTitle || attr.titles?.en || title,
      synopsis: attr.synopsis || "",
      coverImage: attr.posterImage?.large || attr.posterImage?.original,
      bannerImage: attr.coverImage?.large || attr.coverImage?.original,
      score: attr.averageRating ? Math.round(parseFloat(attr.averageRating)) : undefined,
      genres: [],
      status: attr.status,
    };
  } catch (err) {
    console.warn("Kitsu fetch failed:", err);
    return null;
  }
}
