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
    // Prioritize English language, then MangaDex direct CDN, then newest upload
    list.sort((a, b) => {
      if (a.sourceType !== b.sourceType) {
        return a.sourceType === "MANGADEX" ? -1 : 1;
      }
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
