# ॐ VAJRA-NET // Hanuman-Cyberpunk Mystical Manga Reader

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fnarendraborhade-creator%2FManga-reader)
[![GitHub License](https://img.shields.io/badge/License-MIT-gold?style=for-the-badge)](LICENSE)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-cyan?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)

> **मनोजवं मारुततुल्यवेगं जितेन्द्रियं बुद्धिमतां वरिष्ठम्।**  
> **वातात्मजं वानरयूथमुख्यं श्रीरामदूतं शरणं प्रपद्ये॥**  
> *"Swift as the cosmic mind, fleet as the wind, supreme master of senses and leader of the Vanaras: to Lord Hanuman, radiant envoy of Shri Ram, we bow in reverence."*

---

## ⚡ Overview & Vision

**Vajra-Net** is an elite, production-grade manga discovery and reader web application designed with the **Vajra Design System**. It fuses the sacred, mythic iconography of **Lord Hanuman** (*Sundara Kanda*, solar-gold *Gada* motifs, Sanskrit calligraphic glyphs, and Sindoor vermilion neon energy) with high-contrast **cyberpunk HUD telemetry** (holographic glass panels, neon plasma borders, and terminal scanlines).

The platform aggregates live data across the global anime/manga directory ([Public APIs](https://github.com/public-apis/public-apis#anime)) and the 500+ decentralized extension packages of the [Keiyoushi Extensions Repository](https://github.com/keiyoushi/extensions), powered natively by the **MangaDex API v5** and **AniList GraphQL** engines.

---

## 🔱 Key Features & Guarantees

- **100% Real, Readable Manga Pages**: Dynamically resolves [MangaDex@Home Server Nodes](https://api.mangadex.org/docs/04-chapter/retrieving-chapter/) with zero dummy or placeholder pages.
- **Zero-Broken-Image Reader Engine**: Built-in Backend-for-Frontend (BFF) image streaming proxy (`/api/proxy/image`) that injects required `Referer` and `User-Agent` headers with a direct unproxied fallback (`referrerPolicy="no-referrer"`) to eliminate hotlink blocks and CORS errors.
- **Real-Time Latest Releases Feed**: Continuously streams newly uploaded chapters sorted chronologically with publisher scanlator groups and cover art.
- **Vajra Multi-Mode Reader**:
  - **Webtoon Long-Strip**: Continuous, smooth vertical scroll with zero layout shifts.
  - **Single Page (Manga RTL)**: Traditional Japanese Right-to-Left reading navigation.
  - **Single Page (LTR)**: Western Left-to-Right reading layout.
  - **Double-Page Spread**: Side-by-side spread layout.
- **Smart Page Preloader**: Prefetches the next 3 pages in an offscreen buffer and automatically resolves the next chapter ID.
- **Unified Series Codex**: Enriched metadata from **AniList GraphQL**, **Jikan REST (MyAnimeList)**, and **Kitsu API** with filterable chapter ledgers, ascending/descending sort, and chapter search.
- **Keiyoushi Extensions Catalog Browser**: Ingests Protobuf (`index.pb`) and JSON (`index.min.json`) repository indexes with language filters and APK source information.
- **Sanctum Reading Progress & Bookmarks**: Automatically remembers the exact chapter and page position in local storage, enabling one-click "Resume Reading".

---

## 🎨 Vajra-Net Design System ("Cyber-Mandala")

| Token | Hex / Value | Vedic Cyber Inspiration |
| :--- | :--- | :--- |
| **Obsidian Temple Void** | `#07060B` | Deep cosmic stone surface with hex scanline filter |
| **Deep Astral Sanctum** | `#110E1B` | Elevated holographic HUD glass cards (`backdrop-blur-md`) |
| **Sindoor Vermilion Neon** | `#FF3B00` – `#FF5500` | Hanuman's sacred Sindoor energy & glowing plasma conduits |
| **Sovereign Solar Gold** | `#FFB800` – `#FFD700` | Golden *Gada* (mace) borders, completion badges & Yantra corners |
| **Prana Cyan** | `#00F0FF` | Live telemetry status pulses & server health indicators |
| **Ashram Ivory** | `#F4EFE6` | WCAG AAA high-contrast typography |

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js `v18+` or `v20+` or `v24+`
- npm `v9+` or `v11+`

### Installation
```bash
# Clone the repository
git clone https://github.com/narendraborhade-creator/Manga-reader.git
cd Manga-reader

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Optional: Suwayomi Docker Sidecar

To execute compiled Android `.apk` Keiyoushi extensions locally:

```bash
docker compose up -d
```
This runs:
- **Suwayomi-Server (Tachidesk)**: JVM container at `http://localhost:4567` with Keiyoushi repo pre-mounted.
- **FlareSolverr**: Anti-Cloudflare solver at `http://localhost:8191`.
- **Redis**: High-speed caching at `http://localhost:6379`.

---

## 🌐 Deployment Instructions

### Option 1: Deploy on Vercel (Recommended — Full-Stack)

Next.js 15 App Router is natively optimized for Vercel. All serverless API routes (`/api/latest`, `/api/manga/[id]`, `/api/chapter/[id]`, `/api/proxy/image`, `/api/search`) run automatically out of the box with zero configuration!

1. Push this repository to your GitHub account:
   ```bash
   git add .
   git commit -m "feat: complete Hanuman-Cyberpunk Manga Reader"
   git push origin main
   ```
2. Go to [Vercel.com](https://vercel.com/) and click **Add New Project**.
3. Select `Manga-reader` from your GitHub repositories.
4. Click **Deploy**. Vercel will build and deploy the app instantly!

---

### Option 2: Deploy on GitHub Pages (Static Hosting)

GitHub Pages hosts static frontends. Because MangaDex requires serverless routing or CORS handling:

1. Deploy your backend on Vercel (see Option 1 above) to get your live API URL (e.g., `https://your-manga-reader.vercel.app`).
2. In your GitHub repository:
   - Go to **Settings** > **Secrets and variables** > **Actions**.
   - Add a repository variable: `NEXT_PUBLIC_API_URL` set to `https://your-manga-reader.vercel.app`.
3. The included GitHub Actions workflow (`.github/workflows/ci.yml`) automatically builds and verifies every push!

---

## 📁 Project Architecture

```
Manga-reader/
├── .github/workflows/ci.yml        # Continuous Integration build validation
├── docker-compose.yml              # Local Suwayomi-Server, FlareSolverr, & Redis
├── public/                         # Vedic Cyber motifs & fallback cover art
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Vajra-Net layout, HUD frame, Navbar & Footer
│   │   ├── page.tsx                # Home Command Deck (Trending + Latest Releases)
│   │   ├── manga/[id]/page.tsx     # Series Codex & Multi-Source Chapter Ledger
│   │   ├── read/[chapterId]/page.tsx # Vajra Reader Engine (Long-Strip / RTL / Double)
│   │   ├── explore/page.tsx        # Search & Filter by genre matrix
│   │   ├── extensions/page.tsx     # Keiyoushi Extension Catalog browser
│   │   ├── bookmarks/page.tsx      # Reading Progress Ledger & Saved Favorites
│   │   ├── globals.css             # Vedic cyberpunk scanlines & styles
│   │   └── api/
│   │       ├── latest/route.ts     # Real-time chapter releases endpoint
│   │       ├── manga/[id]/route.ts # Unified series metadata & chapters
│   │       ├── chapter/[id]/route.ts # Page URL resolver (MangaDex@Home)
│   │       ├── proxy/image/route.ts # Anti-CORS streaming image proxy
│   │       ├── search/route.ts     # Multi-query title search endpoint
│   │       └── extensions/route.ts # Keiyoushi index sync endpoint
│   ├── lib/
│   │   ├── adapters/
│   │   │   ├── mangadex.ts         # MangaDex v5 API client & @Home resolver
│   │   │   ├── anilist.ts          # AniList GraphQL metadata & trending client
│   │   │   ├── jikan-kitsu.ts      # Jikan v4 & Kitsu fallback clients
│   │   │   ├── keiyoushi-parser.ts # index.pb Protobuf & index.min.json parser
│   │   │   └── suwayomi.ts         # Suwayomi GraphQL client bridge
│   │   ├── aggregator.ts           # Floating chapter deduplication & sorting
│   │   ├── bookmarks.ts            # LocalStorage reading progress tracker
│   │   └── api-client.ts           # Client API layer with hybrid fallback
│   └── components/
│       ├── hud/
│       │   ├── CyberGadaLoader.tsx # Animated solar-gold Gada mace loader
│       │   ├── YantraCard.tsx      # Chamfered HUD polygon card
│       │   ├── MangaCard.tsx       # Manga card with cover art & score
│       │   ├── HeroCarousel.tsx    # Sundara Matrix trending carousel
│       │   ├── Navbar.tsx          # Vedic Cyber HUD header & search
│       │   └── Footer.tsx          # Shloka footer & telemetry indicators
│       └── reader/
│           ├── ReaderControls.tsx  # Floating cyber-mandala toolbar
│           ├── LongStripViewer.tsx # Webtoon continuous scroll viewer
│           ├── PagedViewer.tsx     # Manga RTL / LTR / Double Spread viewer
│           └── ImageWithFallback.tsx # Zero-broken-image streaming component
├── tailwind.config.ts              # Hanuman-Cyberpunk design tokens
├── tsconfig.json                   # Strict TypeScript compiler options
└── package.json
```

---

## ⌨️ Reader Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| `→` / `D` / `Space` | Next Page (or Previous Page in RTL mode) |
| `←` / `A` | Previous Page (or Next Page in RTL mode) |
| `M` | Toggle Floating Cyber-Mandala HUD |
| `F` | Toggle Fullscreen Mode |

---

## 📜 License

This project is open-source and released under the **MIT License**.
All manga images and metadata belong to their respective copyright owners and scanlation groups via the public MangaDex API.
