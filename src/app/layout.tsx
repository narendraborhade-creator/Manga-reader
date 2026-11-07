import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/hud/Navbar";
import { Footer } from "@/components/hud/Footer";

export const metadata: Metadata = {
  title: "Vajra-Net // Hanuman Cyberpunk Manga Reader",
  description:
    "Mythical Vedic Hanuman x Cyberpunk Manga Reader powered by MangaDex v5 and multi-source Keiyoushi extensions.",
  keywords: ["manga", "manga reader", "mangadex", "cyberpunk", "hanuman", "vajra"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-void text-ashram selection:bg-sindoor selection:text-white antialiased">
        {/* Subtle Cyber Scanline Overlay */}
        <div className="fixed inset-0 cyber-scanlines z-50 pointer-events-none opacity-40" />

        <Navbar />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}
