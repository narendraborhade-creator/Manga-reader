import { NormalizedChapter, MangaDexManga, ChapterPagesResult } from "./adapters/mangadex";
import { ChapterGroup } from "./aggregator";
import { KeiyoushiExtension } from "./adapters/keiyoushi-parser";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export interface MangaDetailsResponse {
  id: string;
  title: string;
  altTitles: string[];
  description: string;
  coverUrl: string;
  bannerUrl: string | null;
  status: string;
  score: number | null;
  year: number | null;
  author: string;
  artist: string;
  genres: string[];
  totalChapters: number;
  chapterGroups: ChapterGroup[];
}

export async function getLatestChapters(limit = 32, lang = "en"): Promise<NormalizedChapter[]> {
  try {
    const res = await fetch(`${API_BASE}/api/latest?limit=${limit}&lang=${lang}`);
    if (!res.ok) throw new Error("Failed to fetch latest chapters");
    const json = await res.json();
    return json.data ?? [];
  } catch (err) {
    console.error("getLatestChapters client error:", err);
    return [];
  }
}

export async function getMangaDetails(id: string, lang = "en"): Promise<MangaDetailsResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/api/manga/${id}?lang=${lang}`);
    if (!res.ok) throw new Error("Failed to fetch manga details");
    const json = await res.json();
    return json.data ?? null;
  } catch (err) {
    console.error("getMangaDetails client error:", err);
    return null;
  }
}

export async function getChapterPages(
  chapterId: string,
  quality: "data" | "data-saver" = "data"
): Promise<ChapterPagesResult | null> {
  try {
    const res = await fetch(`${API_BASE}/api/chapter/${chapterId}?quality=${quality}`);
    if (!res.ok) throw new Error("Failed to fetch chapter pages");
    const json = await res.json();
    return json.data ?? null;
  } catch (err) {
    console.error("getChapterPages client error:", err);
    return null;
  }
}

export async function searchManga(query: string, limit = 24): Promise<MangaDexManga[]> {
  try {
    const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    if (!res.ok) throw new Error("Failed to search manga");
    const json = await res.json();
    return json.data ?? [];
  } catch (err) {
    console.error("searchManga client error:", err);
    return [];
  }
}

export async function getExtensionsCatalog(): Promise<KeiyoushiExtension[]> {
  try {
    const res = await fetch(`${API_BASE}/api/extensions`);
    if (!res.ok) throw new Error("Failed to fetch extensions");
    const json = await res.json();
    return json.data ?? [];
  } catch (err) {
    console.error("getExtensionsCatalog client error:", err);
    return [];
  }
}
