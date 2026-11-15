import { fetchMangaDexLatestChapters, NormalizedChapter } from "./adapters/mangadex";
import { fetchMangaKatanaLatestChapters } from "./adapters/mangakatana";
import { fetchMangaPillLatestChapters } from "./adapters/mangapill";

export interface ChapterGroup {
  chapterNumber: number;
  volumeNumber: number | null;
  primary: NormalizedChapter;
  alternatives: NormalizedChapter[];
}

const IRREGULAR_VERBS: Record<string, string> = {
  began: "begin",
  begun: "begin",
  begins: "begin",
  beginning: "begin",
  became: "becom",
  becomes: "becom",
  becoming: "becom",
  came: "come",
  comes: "come",
  coming: "come",
  went: "go",
  goes: "go",
  going: "go",
  gone: "go",
  died: "die",
  dies: "die",
  dying: "die",
  knew: "know",
  known: "know",
  took: "take",
  taken: "take",
  fell: "fall",
  fallen: "fall",
  returned: "return",
  returning: "return",
  returns: "return",
  reincarnated: "reincarnat",
  reincarnating: "reincarnat",
  reincarnation: "reincarnat",
  awakened: "awaken",
  awakening: "awaken",
  awakens: "awaken",
  leveling: "level",
  leveled: "level",
  levels: "level",
  raised: "rais",
  raising: "rais",
  raises: "rais",
  lives: "life",
  lived: "life",
  living: "life",
};

export function stemToken(word: string): string {
  if (!word) return "";
  const w = word.toLowerCase().trim();
  if (IRREGULAR_VERBS[w]) return IRREGULAR_VERBS[w];

  if (w.endsWith("ies") && w.length > 4) return w.slice(0, -3) + "y";
  if (w.endsWith("ing") && w.length > 5) return w.slice(0, -3);
  if (w.endsWith("ed") && w.length > 4) return w.slice(0, -2);
  if (w.endsWith("es") && w.length > 4) return w.slice(0, -2);
  if (w.endsWith("s") && !w.endsWith("ss") && w.length > 3) return w.slice(0, -1);
  return w;
}

export function cleanKey(t: string): string {
  if (!t) return "";
  return t
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/['’]s\b/g, "")
    .replace(/\b(official|webtoon|colored|color|digital colored comics|manga|manhwa|manhua|scanlation|scans|raw|comic|full color|hd)\b/gi, "")
    .replace(/^the\b/gi, "")
    .replace(/[^a-z0-9]/g, "");
}

const STOP_WORDS = new Set([
  "the", "a", "an", "of", "in", "to", "and", "is", "for", "with",
  "no", "na", "ga", "wo", "wa", "ni", "de", "her", "his", "my",
  "their", "our", "its"
]);

export function extractCoreTokensStemmed(title: string): string[] {
  const words = title
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/['’]s\b/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));

  const tokens = new Set<string>();

  for (let i = 0; i < words.length; i++) {
    const raw = words[i];
    const stemmed = stemToken(raw);
    tokens.add(raw);
    tokens.add(stemmed);

    // Compound word joining (e.g. "step" + "mother" -> "stepmother")
    if (i < words.length - 1) {
      const compound = raw + words[i + 1];
      tokens.add(compound);
      tokens.add(stemToken(compound));
    }
  }

  return Array.from(tokens);
}

export function extractCoreTokens(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[’‘`]/g, "")
    .replace(/['’]s\b/g, "")
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

  const candTokens = extractCoreTokensStemmed(candidate);
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
    const allTargTokensPresent = targTokens.every((tok) => candTokenSet.has(tok) || candTokenSet.has(stemToken(tok)));
    if (allTargTokensPresent) {
      const extraTokens = candTokens.filter((tok) => !targetTokenSet.has(tok));
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
 * Validates search query relevance with stemming, compound word resolution, and anti-noise checks
 */
export function isRelevantToSearch(
  title: string,
  altTitles: string[] = [],
  query: string
): boolean {
  if (!title || !query) return false;

  const q = query.trim().toLowerCase();
  const qClean = cleanKey(q);
  if (!qClean || qClean.length < 2) return false;

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
    if (cClean.startsWith(qClean) || qClean.startsWith(cClean)) {
      if (Math.abs(cClean.length - qClean.length) <= 6) return true;
    }
    if (cand.toLowerCase().includes(q) || q.includes(cand.toLowerCase())) return true;
  }

  // 2. Token-level check with stemming and compound matching
  const qBaseTokens = q
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/['’]s\b/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map(stemToken)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));

  if (qBaseTokens.length === 0) return false;

  for (const cand of candidatePool) {
    if (!cand) continue;
    const candTokens = extractCoreTokensStemmed(cand);
    if (candTokens.length === 0) continue;
    const candTokenSet = new Set(candTokens);

    const matchedBases = qBaseTokens.filter((tok) => candTokenSet.has(tok));
    const coverage = matchedBases.length / qBaseTokens.length;

    // For 2-token queries: require both (e.g. "Solo Leveling" -> "solo", "level")
    if (qBaseTokens.length <= 2) {
      if (coverage >= 1.0) return true;
    }
    // For 3-4 token queries: require at least 75% coverage
    else if (qBaseTokens.length <= 4) {
      if (coverage >= 0.75) return true;
    }
    // For 5+ token queries: require at least 60% coverage
    else {
      if (coverage >= 0.6) return true;
    }

    // Substring verification on compound keys
    const cClean = cleanKey(cand);
    if (qClean.length >= 8 && (cClean.includes(qClean) || qClean.includes(cClean))) {
      return true;
    }
  }

  return false;
}

/**
 * Generates natural search variants for multi-word queries
 * to ensure upstream APIs with rigid exact-matching don't return 0 results
 */
export function getSearchQueryVariants(rawQuery: string): string[] {
  const clean = rawQuery.replace(/[’‘`]/g, "'").trim();
  const variants = new Set<string>();
  variants.add(clean);

  // 1. Remove possessive 's
  const noPossessive = clean.replace(/['’]s\b/gi, "").replace(/\s+/g, " ").trim();
  if (noPossessive !== clean) variants.add(noPossessive);

  // 2. Normalize common compound words
  let compoundNormalized = noPossessive
    .replace(/\bstep\s+mother\b/gi, "stepmother")
    .replace(/\bstep\s+mom\b/gi, "stepmom")
    .replace(/\bsword\s+master\b/gi, "swordmaster")
    .replace(/\bdragon\s+king\b/gi, "dragonking")
    .replace(/\bdemon\s+king\b/gi, "demonking")
    .replace(/\bmartial\s+peak\b/gi, "martialpeak");
  if (compoundNormalized !== noPossessive) variants.add(compoundNormalized);

  // 3. Normalize common tense verbs
  let tenseNormalized = compoundNormalized
    .replace(/\bbegan\b/gi, "begins")
    .replace(/\bbegun\b/gi, "begins")
    .replace(/\bbecame\b/gi, "becomes")
    .replace(/\breturned\b/gi, "returns")
    .replace(/\breincarnated\b/gi, "reincarnation");
  if (tenseNormalized !== compoundNormalized) variants.add(tenseNormalized);

  // 4. Drop leading filler words (the, a, an)
  const noLeadingArticle = tenseNormalized.replace(/^(the|a|an)\s+/i, "").trim();
  if (noLeadingArticle !== tenseNormalized) variants.add(noLeadingArticle);

  // 5. Short core keywords without filler words
  const coreWords = noLeadingArticle
    .split(/\s+/)
    .filter((w) => !STOP_WORDS.has(w.toLowerCase()));
  if (coreWords.length >= 2 && coreWords.length < noLeadingArticle.split(/\s+/).length) {
    variants.add(coreWords.join(" "));
  }

  return Array.from(variants);
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

  return groups.sort((a, b) => b.chapterNumber - a.chapterNumber);
}

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
