export interface ReadingProgress {
  mangaId: string;
  mangaTitle: string;
  coverUrl: string;
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string;
  page: number;
  totalPages: number;
  updatedAt: string;
}

export interface Bookmark {
  mangaId: string;
  title: string;
  coverUrl: string;
  status?: string;
  genres?: string[];
  addedAt: string;
}

const PROGRESS_KEY = "vajra_reading_progress";
const BOOKMARKS_KEY = "vajra_bookmarks";

export function getReadingProgress(): Record<string, ReadingProgress> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveReadingProgress(progress: ReadingProgress): void {
  if (typeof window === "undefined") return;
  try {
    const all = getReadingProgress();
    all[progress.mangaId] = progress;
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
  } catch (err) {
    console.error("Failed to save reading progress:", err);
  }
}

export function getBookmarks(): Bookmark[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isBookmarked(mangaId: string): boolean {
  const bookmarks = getBookmarks();
  return bookmarks.some((b) => b.mangaId === mangaId);
}

export function toggleBookmark(bookmark: Bookmark): boolean {
  if (typeof window === "undefined") return false;
  try {
    const bookmarks = getBookmarks();
    const exists = bookmarks.some((b) => b.mangaId === bookmark.mangaId);
    let updated: Bookmark[];
    if (exists) {
      updated = bookmarks.filter((b) => b.mangaId !== bookmark.mangaId);
    } else {
      updated = [bookmark, ...bookmarks];
    }
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
    return !exists;
  } catch {
    return false;
  }
}
