/**
 * Mangayomi Extension Adapter
 * Connects to the official Mangayomi repository: https://github.com/kodjodevf/mangayomi
 * Extension index: https://kodjodevf.github.io/mangayomi-extensions/index.json
 */

export interface MangayomiExtension {
  id: number;
  name: string;
  baseUrl: string;
  lang: string;
  typeSource: string;
  iconUrl: string;
  version: string;
  isNsfw: boolean;
  hasCloudflare: boolean;
  sourceCodeUrl: string;
  isManga: boolean;
}

let cachedExtensions: MangayomiExtension[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 3600 * 1000; // 1 hour

export async function fetchMangayomiExtensions(): Promise<MangayomiExtension[]> {
  const now = Date.now();
  if (cachedExtensions && now - lastFetchTime < CACHE_TTL) {
    return cachedExtensions;
  }

  try {
    const res = await fetch("https://kodjodevf.github.io/mangayomi-extensions/index.json", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) MangayomiWeb/1.0",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch Mangayomi index: ${res.statusText}`);
    }

    const json = await res.json();
    if (Array.isArray(json)) {
      cachedExtensions = json.map((item: any) => ({
        id: item.id,
        name: item.name,
        baseUrl: item.baseUrl || "",
        lang: item.lang || "en",
        typeSource: item.typeSource || "single",
        iconUrl: item.iconUrl || "",
        version: item.version || "1.0.0",
        isNsfw: Boolean(item.isNsfw),
        hasCloudflare: Boolean(item.hasCloudflare),
        sourceCodeUrl: item.sourceCodeUrl || "",
        isManga: item.isManga ?? true,
      }));
      lastFetchTime = now;
      return cachedExtensions;
    }
  } catch (err) {
    console.error("fetchMangayomiExtensions error:", err);
  }

  return cachedExtensions || [];
}

/**
 * Filter Mangayomi extensions by language and query
 */
export async function getFilteredMangayomiExtensions(
  lang = "all",
  query = ""
): Promise<MangayomiExtension[]> {
  const all = await fetchMangayomiExtensions();
  let filtered = all;

  if (lang && lang !== "all") {
    filtered = filtered.filter((ext) => ext.lang.toLowerCase() === lang.toLowerCase());
  }

  if (query.trim()) {
    const q = query.toLowerCase().trim();
    filtered = filtered.filter(
      (ext) =>
        ext.name.toLowerCase().includes(q) ||
        ext.typeSource.toLowerCase().includes(q) ||
        ext.baseUrl.toLowerCase().includes(q)
    );
  }

  return filtered;
}
