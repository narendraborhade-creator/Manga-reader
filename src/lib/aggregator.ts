import { fetchMangaDexLatestChapters, NormalizedChapter } from "./adapters/mangadex";
import { fetchMangaKatanaLatestChapters } from "./adapters/mangakatana";
import { fetchMangaPillLatestChapters } from "./adapters/mangapill";

export interface ChapterGroup {
  chapterNumber: number;
  volumeNumber: number | null;
  primary: NormalizedChapter;
  alternatives: NormalizedChapter[];
}

export function cleanKey(t: string): string {
  if (!t) return "";
  return t
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/\b(official|webtoon|colored|color|manga|manhwa|manhua|scanlation|scans|raw|comic)\b/gi, "")
    .replace(/^the\b/gi, "")
    .replace(/[^a-z0-9]/g, "");
}

export function isStrictTitleMatch(candidate: string, targets: string[]): boolean {
  const c = cleanKey(candidate);
  if (!c || c.length < 2) return false;

  const candidateWords = new Set(
    candidate
      .toLowerCase()
      .replace(/[’‘`]/g, "'")
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !["the", "and", "of", "in", "to", "for", "with"].includes(w))
  );

  for (const t of targets) {
    const target = cleanKey(t);
    if (!target || target.length < 2) continue;

    // Exact cleaned match
    if (c === target) return true;

    // Very close match
    if (c.startsWith(target) || target.startsWith(c)) {
      if (Math.abs(c.length - target.length) <= 5) return true;
    }

    // Substring containment for long titles
    if (c.length >= 8 && target.length >= 8) {
      if (c.includes(target) || target.includes(c)) return true;
    }

    // Token overlap
    const targetWords = t
      .toLowerCase()
      .replace(/[’‘`]/g, "'")
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !["the", "and", "of", "in", "to", "for", "with"].includes(w));

    if (candidateWords.size > 0 && targetWords.length > 0) {
      const common = targetWords.filter((w) => candidateWords.has(w));
      if (common.length >= 2 && common.length >= Math.min(candidateWords.size, targetWords.length) * 0.6) {
        return true;
      }
    }
  }

  return false;
}

export function unifyAndSortChapters(
  chapters: NormalizedChapter[]
): ChapterGroup[] {
  const byNumber = new Map<number, NormalizedChapter[]>();

  for (const ch of chapters) {
    const num = Number(ch.chapterNumber.toFixed(2));
    const existing = byNumber.get(num) ?? [];
    existing.push(ch);
    byNumber.set(num, existing);
  }

  const groups: ChapterGroup[] = [];
  for (const [chapterNumber, list] of byNumber.entries()) {
    // Prioritize high-reliability direct streaming CDNs (Asura, MangaPill, WeebCentral), then hosted MangaDex
    list.sort((a, b) => {
      const getPriority = (c: NormalizedChapter) => {
        if (c.externalUrl) return -1;
        if ((c.sourceType as string) === "MANGAKATANA") return 6;
        if ((c.sourceType as string) === "ASURA") return 5;
        if (c.sourceType === "MANGAPILL") return 4;
        if (c.sourceType === "WEEBCENTRAL") return 3;
        if (c.sourceType === "MANGADEX") return 2;
        if (c.sourceType === "ALLMANGA") return 1;
        return 0;
      };
      const diff = getPriority(b) - getPriority(a);
      if (diff !== 0) return diff;
      return (
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
    });

    groups.push({
      chapterNumber,
      volumeNumber: list[0].volumeNumber,
      primary: list[0],
      alternatives: list.slice(1),
    });
  }

  // Sort descending for the Chapter Ledger UI (latest chapter at top)
  return groups.sort((a, b) => b.chapterNumber - a.chapterNumber);
}

/**
 * Concurrently queries MangaKatana, MangaPill, and MangaDex for latest releases,
 * interleaving sources and deduplicating by title to guarantee a rich, non-failing latest feed.
 */
export async function fetchUnifiedLatestChapters(limit = 24, lang = "en"): Promise<NormalizedChapter[]> {
  try {
    const [katanaChapters, pillChapters, dexChapters] = await Promise.all([
      fetchMangaKatanaLatestChapters(limit).catch(() => []),
      fetchMangaPillLatestChapters(limit).catch(() => []),
      fetchMangaDexLatestChapters(limit, lang).catch(() => []),
    ]);

    const seen = new Set<string>();
    const unified: NormalizedChapter[] = [];

    const maxLen = Math.max(katanaChapters.length, pillChapters.length, dexChapters.length);
    for (let i = 0; i < maxLen; i++) {
      if (katanaChapters[i]) {
        const k = cleanKey(katanaChapters[i].mangaTitle);
        if (k && !seen.has(k) && katanaChapters[i].coverUrl && !katanaChapters[i].coverUrl.includes("placeholder")) {
          seen.add(k);
          unified.push(katanaChapters[i]);
        }
      }
      if (pillChapters[i]) {
        const k = cleanKey(pillChapters[i].mangaTitle);
        if (k && !seen.has(k) && pillChapters[i].coverUrl && !pillChapters[i].coverUrl.includes("placeholder")) {
          seen.add(k);
          unified.push(pillChapters[i]);
        }
      }
      if (dexChapters[i]) {
        const k = cleanKey(dexChapters[i].mangaTitle);
        if (k && !seen.has(k) && dexChapters[i].coverUrl && !dexChapters[i].coverUrl.includes("placeholder")) {
          seen.add(k);
          unified.push(dexChapters[i]);
        }
      }
    }

    return unified.slice(0, limit);
  } catch (err) {
    console.error("fetchUnifiedLatestChapters error:", err);
    return [];
  }
}
