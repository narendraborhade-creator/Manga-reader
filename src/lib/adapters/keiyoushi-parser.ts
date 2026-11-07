import protobuf from "protobufjs";

export interface KeiyoushiSource {
  id: string;
  name: string;
  lang: string;
  baseUrl: string;
}

export interface KeiyoushiExtension {
  name: string;
  pkg: string;
  apk: string;
  lang: string;
  code: number;
  version: string;
  nsfw: number;
  sources: KeiyoushiSource[];
}

const KEIYOUSHI_JSON_URL =
  "https://raw.githubusercontent.com/keiyoushi/extensions/repo/index.min.json";
const KEIYOUSHI_PB_URL =
  "https://raw.githubusercontent.com/keiyoushi/extensions/repo/index.pb";

const REPO_PROTO_SCHEMA = `
syntax = "proto3";
message RepoIndex {
  repeated Extension extensions = 1;
}
message Extension {
  string name = 1;
  string pkg = 2;
  string apk = 3;
  string lang = 4;
  int64 code = 5;
  string version = 6;
  int32 nsfw = 7;
  repeated Source sources = 9;
}
message Source {
  string name = 1;
  string lang = 2;
  int64 id = 3;
  string baseUrl = 4;
}
`;

export async function fetchKeiyoushiCatalog(
  preferProtobuf = true
): Promise<KeiyoushiExtension[]> {
  if (preferProtobuf) {
    try {
      const res = await fetch(KEIYOUSHI_PB_URL);
      if (res.ok) {
        const buffer = new Uint8Array(await res.arrayBuffer());
        const root = protobuf.parse(REPO_PROTO_SCHEMA).root;
        const RepoIndex = root.lookupType("RepoIndex");
        const decoded = RepoIndex.decode(buffer) as unknown as {
          extensions: any[];
        };
        if (decoded?.extensions?.length) {
          return decoded.extensions.map((ext) => ({
            name: ext.name || "Unknown Extension",
            pkg: ext.pkg || "",
            apk: ext.apk || "",
            lang: ext.lang || "all",
            code: typeof ext.code === "object" ? Number(ext.code) : ext.code || 1,
            version: ext.version || "1.0",
            nsfw: ext.nsfw || 0,
            sources: (ext.sources || []).map((s: any) => ({
              id: String(s.id || ""),
              name: s.name || ext.name,
              lang: s.lang || ext.lang,
              baseUrl: s.baseUrl || "",
            })),
          }));
        }
      }
    } catch (err) {
      console.warn("index.pb decode fallback to index.min.json:", err);
    }
  }

  try {
    const jsonRes = await fetch(KEIYOUSHI_JSON_URL);
    if (jsonRes.ok) {
      const data = (await jsonRes.json()) as any[];
      return data.map((ext) => ({
        name: ext.name || "Unknown Extension",
        pkg: ext.pkg || "",
        apk: ext.apk || "",
        lang: ext.lang || "all",
        code: ext.code || 1,
        version: ext.version || "1.0",
        nsfw: ext.nsfw || 0,
        sources: (ext.sources || []).map((s: any) => ({
          id: String(s.id || ""),
          name: s.name || ext.name,
          lang: s.lang || ext.lang,
          baseUrl: s.baseUrl || "",
        })),
      }));
    }
  } catch (err) {
    console.warn("Keiyoushi JSON fetch failed:", err);
  }

  // Curated fallback if both remote indexes are unreachable
  return [
    {
      name: "MangaDex (Official)",
      pkg: "eu.kanade.tachiyomi.extension.all.mangadex",
      apk: "mangadex.apk",
      lang: "all",
      code: 100,
      version: "1.4.12",
      nsfw: 0,
      sources: [
        {
          id: "mangadex",
          name: "MangaDex",
          lang: "all",
          baseUrl: "https://mangadex.org",
        },
      ],
    },
    {
      name: "MangaSee",
      pkg: "eu.kanade.tachiyomi.extension.en.mangasee",
      apk: "mangasee.apk",
      lang: "en",
      code: 101,
      version: "1.4.8",
      nsfw: 0,
      sources: [
        {
          id: "mangasee",
          name: "MangaSee",
          lang: "en",
          baseUrl: "https://mangasee123.com",
        },
      ],
    },
    {
      name: "Asura Scans",
      pkg: "eu.kanade.tachiyomi.extension.en.asurascans",
      apk: "asurascans.apk",
      lang: "en",
      code: 102,
      version: "1.4.20",
      nsfw: 0,
      sources: [
        {
          id: "asurascans",
          name: "Asura Scans",
          lang: "en",
          baseUrl: "https://asuracomic.net",
        },
      ],
    },
    {
      name: "Flame Comics",
      pkg: "eu.kanade.tachiyomi.extension.en.flamecomics",
      apk: "flamecomics.apk",
      lang: "en",
      code: 103,
      version: "1.4.15",
      nsfw: 0,
      sources: [
        {
          id: "flamecomics",
          name: "Flame Comics",
          lang: "en",
          baseUrl: "https://flamecomics.xyz",
        },
      ],
    },
  ];
}
