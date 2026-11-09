/**
 * Awesome Anime & Manga Sources Adapter
 * Integrates: https://github.com/anshumanv/awesome-anime-sources
 * Provides a categorized, community-curated directory of manga readers,
 * official publishers, tracking databases, and anime streaming mirrors.
 */

export interface AwesomeSourceItem {
  id: string;
  name: string;
  url: string;
  category: "manga" | "official" | "database" | "anime" | "apps";
  categoryLabel: string;
  description: string;
  tags: string[];
  inAppSupported: boolean;
  featured?: boolean;
}

const BUNDLED_AWESOME_SOURCES: AwesomeSourceItem[] = [
  // Online Manga Readers
  {
    id: "mangadex",
    name: "MangaDex",
    url: "https://mangadex.org/",
    category: "manga",
    categoryLabel: "Manga Readers",
    description: "Open-source, non-profit community manga platform with millions of chapters in multi-languages.",
    tags: ["Open Source", "Global", "Verified API"],
    inAppSupported: true,
    featured: true,
  },
  {
    id: "asura",
    name: "Asura Scans",
    url: "https://asurascans.com/",
    category: "manga",
    categoryLabel: "Manga Readers",
    description: "High-definition scanlator specializing in Korean manhwa, action, and fantasy webtoons.",
    tags: ["Manhwa", "HD Scans", "Action"],
    inAppSupported: true,
    featured: true,
  },
  {
    id: "weebcentral",
    name: "WeebCentral",
    url: "https://weebcentral.com/",
    category: "manga",
    categoryLabel: "Manga Readers",
    description: "Fast English manga image stream with official digital color and complete chapter archives.",
    tags: ["Color Manga", "Fast CDN", "Full Archive"],
    inAppSupported: true,
    featured: true,
  },
  {
    id: "mangapill",
    name: "MangaPill",
    url: "https://mangapill.com/",
    category: "manga",
    categoryLabel: "Manga Readers",
    description: "Direct clean image mirror for weekly Shonen Jump, Seinen, and Kodansha series.",
    tags: ["Shonen", "High Speed", "Zero Ads"],
    inAppSupported: true,
    featured: true,
  },
  {
    id: "batoto",
    name: "Bato.to",
    url: "https://bato.to/",
    category: "manga",
    categoryLabel: "Manga Readers",
    description: "Crowdsourced scanlation host with community groups and manhwa releases.",
    tags: ["Community", "Manhwa", "Webtoons"],
    inAppSupported: false,
  },
  {
    id: "mangasee",
    name: "MangaSee",
    url: "https://mangasee123.com/",
    category: "manga",
    categoryLabel: "Manga Readers",
    description: "Long-standing high-quality archive known for official digital rips and volumes.",
    tags: ["Official Rips", "Volumes", "Archive"],
    inAppSupported: false,
  },
  {
    id: "mangakakalot",
    name: "MangaKakalot",
    url: "https://mangakakalot.com/",
    category: "manga",
    categoryLabel: "Manga Readers",
    description: "Extensive web catalog of shonen, romance, isekai, and martial arts series.",
    tags: ["Isekai", "Shonen", "Popular"],
    inAppSupported: false,
  },
  {
    id: "manganelo",
    name: "Manganelo",
    url: "https://manganelo.com/",
    category: "manga",
    categoryLabel: "Manga Readers",
    description: "Sister site to MangaKakalot with rapid release updates for ongoing series.",
    tags: ["Fast Updates", "Manga", "Manhwa"],
    inAppSupported: false,
  },
  {
    id: "mangapark",
    name: "MangaPark",
    url: "https://mangapark.net/",
    category: "manga",
    categoryLabel: "Manga Readers",
    description: "Aggregator indexing multiple scanlation teams per chapter with multi-version choice.",
    tags: ["Multi-Version", "Aggregator"],
    inAppSupported: false,
  },
  {
    id: "readcomiconline",
    name: "ReadComicOnline",
    url: "https://readcomiconline.li/",
    category: "manga",
    categoryLabel: "Manga Readers",
    description: "Premier archive for Western comics, Marvel, DC, and independent graphic novels.",
    tags: ["Comics", "Graphic Novels", "Western"],
    inAppSupported: false,
  },
  {
    id: "readm",
    name: "ReadM",
    url: "https://readm.org/",
    category: "manga",
    categoryLabel: "Manga Readers",
    description: "Clean reader interface for trending manga, manhwa, and colored webtoons.",
    tags: ["Clean UI", "Webtoons"],
    inAppSupported: false,
  },

  // Official Publishers & Legal Portals
  {
    id: "mangaplus",
    name: "MangaPlus by Shueisha",
    url: "https://mangaplus.shueisha.co.jp/",
    category: "official",
    categoryLabel: "Official Publishers",
    description: "Official global platform by Shueisha. Read latest chapters of One Piece, JJK, and MHA simultaneously with Japan.",
    tags: ["Official", "Simulpub", "Free Chapters"],
    inAppSupported: false,
    featured: true,
  },
  {
    id: "vizmedia",
    name: "VIZ Media / Shonen Jump",
    url: "https://www.viz.com/shonenjump",
    category: "official",
    categoryLabel: "Official Publishers",
    description: "Official English publisher for Shonen Jump with digital vault and recent free releases.",
    tags: ["Official", "Shonen Jump", "Digital Vault"],
    inAppSupported: false,
    featured: true,
  },
  {
    id: "webtoons",
    name: "WEBTOON Official",
    url: "https://www.webtoons.com/en/",
    category: "official",
    categoryLabel: "Official Publishers",
    description: "Global creator platform for digital comics and original manhwa (Tower of God, Lore Olympus).",
    tags: ["Official", "Originals", "Webtoons"],
    inAppSupported: false,
  },
  {
    id: "wuxiaworld",
    name: "WuxiaWorld",
    url: "https://wuxiaworld.site/",
    category: "official",
    categoryLabel: "Official Publishers",
    description: "Leading portal for Chinese cultivation manhua, martial arts, and translated web novels.",
    tags: ["Cultivation", "Manhua", "Web Novels"],
    inAppSupported: false,
  },

  // Databases & Trackers
  {
    id: "anilist",
    name: "AniList",
    url: "https://anilist.co/",
    category: "database",
    categoryLabel: "Databases & Trackers",
    description: "Modern anime & manga tracking platform with GraphQL API, custom lists, and rich social stats.",
    tags: ["GraphQL API", "Metadata Engine", "Tracking"],
    inAppSupported: true,
    featured: true,
  },
  {
    id: "myanimelist",
    name: "MyAnimeList (MAL)",
    url: "https://myanimelist.net/",
    category: "database",
    categoryLabel: "Databases & Trackers",
    description: "The world's largest anime and manga database with reviews, score distributions, and global rankings.",
    tags: ["Global Rankings", "Reviews", "Largest Database"],
    inAppSupported: false,
  },
  {
    id: "mangaupdates",
    name: "MangaUpdates (Baka-Updates)",
    url: "https://www.mangaupdates.com/",
    category: "database",
    categoryLabel: "Databases & Trackers",
    description: "Exhaustive directory tracking scanlation release dates, release groups, and publisher licenses.",
    tags: ["Scanlation Info", "Releases Tracker", "Licensing"],
    inAppSupported: false,
  },
  {
    id: "kitsu",
    name: "Kitsu.io",
    url: "https://kitsu.io/",
    category: "database",
    categoryLabel: "Databases & Trackers",
    description: "Content discovery platform for anime and manga with clean mobile UI and community ratings.",
    tags: ["Social Tracking", "Recommendations"],
    inAppSupported: false,
  },
  {
    id: "animeplanet",
    name: "Anime-Planet",
    url: "https://www.anime-planet.com/",
    category: "database",
    categoryLabel: "Databases & Trackers",
    description: "Community recommendations and legal streaming partnerships for 45,000+ anime & manga entries.",
    tags: ["Recommendations", "Legal Links"],
    inAppSupported: false,
  },

  // Anime Streaming Sources
  {
    id: "aniwatch",
    name: "AniWatch (formerly Zoro)",
    url: "https://aniwatchtv.to/",
    category: "anime",
    categoryLabel: "Anime Streaming",
    description: "High-definition anime streaming with Japanese sub and English dub, auto-next, and skip intro.",
    tags: ["HD Streaming", "Sub/Dub", "No Buffering"],
    inAppSupported: false,
  },
  {
    id: "animepahe",
    name: "AnimePahe",
    url: "https://animepahe.ru/",
    category: "anime",
    categoryLabel: "Anime Streaming",
    description: "Minimalist anime streamer known for extremely compact encoding and bandwidth-friendly HD videos.",
    tags: ["Compact 720p/1080p", "Fast CDN"],
    inAppSupported: false,
  },
  {
    id: "crunchyroll",
    name: "Crunchyroll",
    url: "https://www.crunchyroll.com/",
    category: "anime",
    categoryLabel: "Anime Streaming",
    description: "World's largest legal anime streaming service with simulcasts, dubs, and official manga library.",
    tags: ["Official", "Simulcast", "Legal"],
    inAppSupported: false,
  },

  // Open Source Ecosystem Apps
  {
    id: "mangayomi-app",
    name: "Mangayomi",
    url: "https://github.com/kodjodevf/mangayomi",
    category: "apps",
    categoryLabel: "Apps & Ecosystem",
    description: "Free, open-source multi-platform manga, manhwa, and anime app built with Flutter.",
    tags: ["Flutter", "Open Source", "Multi-Source"],
    inAppSupported: true,
    featured: true,
  },
  {
    id: "tachiyomi",
    name: "Tachiyomi / Mihon",
    url: "https://github.com/mihonapp/mihon",
    category: "apps",
    categoryLabel: "Apps & Ecosystem",
    description: "The gold standard open-source manga reader for Android with custom extensions support.",
    tags: ["Android", "Mihon", "Pioneer"],
    inAppSupported: false,
  },
  {
    id: "lnreader",
    name: "LNReader",
    url: "https://github.com/LNReader/lnreader",
    category: "apps",
    categoryLabel: "Apps & Ecosystem",
    description: "Open-source reader for light novels and web novels with multi-language scraper plugins.",
    tags: ["Light Novels", "Web Novels", "Open Source"],
    inAppSupported: false,
  },
];

let cachedAwesomeSources: AwesomeSourceItem[] | null = null;
let lastAwesomeFetch = 0;
const CACHE_TTL = 3600 * 1000; // 1 hour

export async function fetchAwesomeSources(): Promise<AwesomeSourceItem[]> {
  const now = Date.now();
  if (cachedAwesomeSources && now - lastAwesomeFetch < CACHE_TTL) {
    return cachedAwesomeSources;
  }

  // Use bundled curated sources as bedrock
  cachedAwesomeSources = BUNDLED_AWESOME_SOURCES;
  lastAwesomeFetch = now;
  return cachedAwesomeSources;
}

export async function getFilteredAwesomeSources(
  category = "all",
  query = ""
): Promise<AwesomeSourceItem[]> {
  const sources = await fetchAwesomeSources();
  const q = query.toLowerCase().trim();

  return sources.filter((item) => {
    const matchesCategory =
      category === "all" || item.category === category;
    const matchesQuery =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.tags.some((t) => t.toLowerCase().includes(q)) ||
      item.url.toLowerCase().includes(q);

    return matchesCategory && matchesQuery;
  });
}
