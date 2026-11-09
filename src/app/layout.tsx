import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/hud/Navbar";
import { Footer } from "@/components/hud/Footer";

export const metadata: Metadata = {
  title: "Mangayomi Web | Multi-Source Manga & Manhwa Reader",
  description:
    "Free, modern, open-source manga reader inspired by Mangayomi. Browse and read thousands of manga, manhwa, and manhua from top community sources.",
  keywords: ["mangayomi", "manga", "manhwa", "manga reader", "webtoon", "mangadex", "asura", "weebcentral"],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-dark text-slate-100 selection:bg-brand selection:text-white antialiased">
        <Navbar />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}
