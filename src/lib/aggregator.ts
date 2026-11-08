import { NormalizedChapter } from "./adapters/mangadex";

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
    .replace(/\b(official|webtoon|colored|color|manga|manhwa|manhua|scanlation|scans|raw|comic)\b/gi, "")
    .replace(/^the\b/gi, "")
    .replace(/[^a-z0-9]/g, "");
}

export function isStrictTitleMatch(candidate: string, targets: string[]): boolean {
  const c = cleanKey(candidate);
  if (!c || c.length < 2) return false;

  for (const t of targets) {
    const target = cleanKey(t);
    if (!target || target.length < 2) continue;

    // Exact cleaned match
    if (c === target) return true;

    // Very close match (prefix match with at most 3 character difference)
    if (c.startsWith(target) || target.startsWith(c)) {
      if (Math.abs(c.length - target.length) <= 3) return true;
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
    // Prioritize high-reliability direct streaming CDNs (MangaPill, WeebCentral), then hosted MangaDex
    list.sort((a, b) => {
      const getPriority = (c: NormalizedChapter) => {
        if ((c.sourceType as string) === "ASURA") return 5;
        if (c.sourceType === "MANGAPILL") return 4;
        if (c.sourceType === "WEEBCENTRAL") return 3;
        if (c.sourceType === "MANGADEX" && !c.externalUrl) return 2;
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
