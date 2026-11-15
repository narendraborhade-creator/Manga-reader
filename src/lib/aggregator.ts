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
    .replace(/\b(official|webtoon|colored|color|digital colored comics|manga|manhwa|manhua|scanlation|scans|raw|comic|full color|hd)\b/gi, "")
    .replace(/^the\b/gi, "")
    .replace(/[^a-z0-9]/g, "");
}

const STOP_WORDS = new Set(["the", "a", "an", "of", "in", "to", "and", "is", "for", "with", "no", "na", "ga", "wo", "wa", "ni", "de"]);

export function extractCoreTokens(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[’‘`]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

const SPINOFF_INDICATORS = new Set([
  "dj", "doujin", "doujinshi", "omake", "futanari", "hentai", "anthology",
  "party", "academy", "ragnarok", "gaiden", "prequel", "sequel", "reboot",
  "spinoff", "side", "story", "stories", "chronicles", "tales", "origins",
  "shokugeki", "aftermath", "alter", "another", "cross", "crossover",
]);

export function isDoujinshiOrSpinoff(title: string): boolean {
  if (!title) return false;
  const t = title.toLowerCase();
  return (
    /\b(dj|doujin|doujinshi|omake|futanari|hentai|fan-comic|fancomic|anthology)\b/i.test(t) ||
    t.includes(" dj ") ||
    t.includes(" dj -") ||
    t.includes("dj -") ||
    t.includes("(dj)") ||
    t.includes("fan comic") ||
    t.includes("doujin anthology")
  );
}

export function isNovelTitle(t: string): boolean {
  if (!t) return false;
  const lower = t.toLowerCase();
  return (
    /\b(light\s*novel|web\s*novel|webnovel)\b/i.test(lower) ||
    /\((novel|light\s*novel|web\s*novel|ln|wn|book\s*version|volume|volume\s*version)\)/i.test(lower) ||
    /\[(novel|light\s*novel|web\s*novel|ln|wn|book\s*version|volume)\]/i.test(lower) ||
    /\s*-\s*(novel|light\s*novel|web\s*novel)\b/i.test(lower) ||
    /:\s*(novel|light\s*novel|web\s*novel)\b/i.test(lower) ||
    /\b(novel\s*version)\b/i.test(lower) ||
    /\b(novel)\b/i.test(lower) ||
    /\b(light\s*novel)\b/i.test(lower)
  );
}

/**
 * Strict cross-source title matcher: returns true only if the candidate is the exact same series
 * (not a spinoff, sequel, prequel, anthology, or completely different title sharing a few keywords).
 */
export function isStrictTitleMatch(candidate: string, targets: string[]): boolean {
  const candidateIsNovel = isNovelTitle(candidate);
  const targetIsNovel = targets.some((t) => isNovelTitle(t));
  if (candidateIsNovel !== targetIsNovel) return false;

  const candidateIsDoujin = isDoujinshiOrSpinoff(candidate);
  const targetIsDoujin = targets.some((t) => isDoujinshiOrSpinoff(t));
  if (candidateIsDoujin && !targetIsDoujin) return false;

  const cKey = cleanKey(candidate);
  if (!cKey || cKey.length < 2) return false;

  const candTokens = extractCoreTokens(candidate);
  const candTokenSet = new Set(candTokens);

  for (const t of targets) {
    const tKey = cleanKey(t);
    if (!tKey || tKey.length < 2) continue;

    // 1. Exact cleaned key match (handles casing, punctuation, coloring/official tags)
    if (cKey === tKey) return true;

    // 2. Token evaluation
    const targTokens = extractCoreTokens(t);
    if (targTokens.length === 0) continue;

    // If candidate has spinoff/doujin indicators that target doesn't have, REJECT!
    const targetTokenSet = new Set(targTokens);
    const hasSpinoffToken = candTokens.some((tok) => SPINOFF_INDICATORS.has(tok) && !targetTokenSet.has(tok));
    if (hasSpinoffToken) continue;

    // Check if target is a clean subset without stray words
    const allTargTokensPresent = targTokens.every((tok) => candTokenSet.has(tok));
    if (allTargTokensPresent) {
      const extraTokens = candTokens.filter((tok) => !targetTokenSet.has(tok));
      // Only allow extra tokens if they are version/format numbers or harmless descriptors
      const allowedExtras = new Set(["season", "s1", "s2", "s3", "vol", "volume", "ch", "chapter", "edition", "deluxe"]);
      const invalidExtras = extraTokens.filter((tok) => !allowedExtras.has(tok) && !/^\d+$/.test(tok));
      if (invalidExtras.length === 0) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Validates search query relevance to prevent false positives and random keyword matches
 */
export function isRelevantToSearch(
  title: string,
  altTitles: string[] = [],
  query: string
): boolean {
  if (!title || !query) return false;

  const q = query.trim().toLowerCase();
  const qClean = cleanKey(q);
  if (!qClean) return false;

  const queryAllowsDoujin = /\b(dj|doujin|doujinshi|hentai|omake|fancomic)\b/i.test(q);
  const queryAllowsNovel = /\b(novel|ln|wn)\b/i.test(q);

  // If query does not ask for novels, reject novels
  if (!queryAllowsNovel && isNovelTitle(title)) return false;

  // If query does not ask for doujinshis/hentai, reject doujinshis/hentai/fancomics
  if (!queryAllowsDoujin && isDoujinshiOrSpinoff(title)) return false;

  const candidatePool = [title, ...altTitles];

  // 1. Direct match check
  for (const cand of candidatePool) {
    if (!cand) continue;
    const cClean = cleanKey(cand);
    if (!cClean || cClean.length < 2) continue;
    if (cClean === qClean) return true;
    if (cClean.startsWith(qClean)) return true;
    if (cand.toLowerCase().includes(q)) return true;
  }

  // 2. Token-level check
  const qTokens = extractCoreTokens(q);
  if (qTokens.length === 0) return false;

  for (const cand of candidatePool) {
    if (!cand) continue;
    const candTokens = extractCoreTokens(cand);
    if (candTokens.length === 0) continue;
    const candTokenSet = new Set(candTokens);

    // If query has <= 4 tokens, EVERY token in the query MUST exist in the candidate!
    // (e.g. "World's Strongest Troll" requires "world", "strongest", AND "troll")
    if (qTokens.length <= 4) {
      const allPresent = qTokens.every((tok) => candTokenSet.has(tok));
      if (allPresent) return true;
    } else {
      // For longer queries, at least 80% of query tokens must exist
      const matchCount = qTokens.filter((tok) => candTokenSet.has(tok)).length;
      if (matchCount / qTokens.length >= 0.8) return true;
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
    // Prioritize high-reliability direct streaming CDNs (MangaKatana, Asura, MangaPill, WeebCentral), then hosted MangaDex
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
