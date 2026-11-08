import { NormalizedChapter } from "./adapters/mangadex";

export interface ChapterGroup {
  chapterNumber: number;
  volumeNumber: number | null;
  primary: NormalizedChapter;
  alternatives: NormalizedChapter[];
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
        if (c.sourceType === "MANGAPILL") return 4;
        if (c.sourceType === "ALLMANGA") return 3;
        if (c.sourceType === "WEEBCENTRAL") return 2;
        if (c.sourceType === "MANGADEX" && !c.externalUrl) return 1;
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
