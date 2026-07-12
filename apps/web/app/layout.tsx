import type { Metadata } from "next";
import Link from "next/link";
import localFont from "next/font/local";
import { getLang, t } from "../lib/i18n";
import { LangToggle } from "../components/lang-toggle";
import "./globals.css";

const marcellus = localFont({
  src: "../assets/fonts/Marcellus-Regular.ttf",
  variable: "--font-marcellus",
  display: "swap",
});

const plexMono = localFont({
  src: [
    { path: "../assets/fonts/IBMPlexMono-Regular.ttf", weight: "400" },
    { path: "../assets/fonts/IBMPlexMono-SemiBold.ttf", weight: "600" },
  ],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://fineness.xyz"),
  title: "fineness — assay office for tokenized repos",
  description:
    "Scan the repo behind any token. Your fineness score: verifiable GitHub data, not vibes. Fork detection, AI-slop detection, rug watch.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  const d = t(lang);

  return (
    <html lang={lang} className={`${marcellus.variable} ${plexMono.variable}`}>
      <body className="min-h-screen">
        <header className="border-b hairline-gold">
          <div className="mx-auto flex max-w-6xl items-end justify-between px-5 py-5">
            <Link href="/" className="flex flex-col gap-1">
              <span className="wordmark text-3xl leading-none">fineness</span>
              <span className="font-mono text-[10px] tracking-[0.3em] text-faint">{d.layout.tagline}</span>
            </Link>
            <div className="flex items-center gap-7">
              <nav className="flex gap-7 font-mono text-[11px] tracking-[0.2em] text-sage">
                <Link href="/methodology" className="transition hover:text-gold">
                  {d.layout.methodology}
                </Link>
                <a href="/api/stats" className="transition hover:text-gold">
                  API
                </a>
                <a href="https://github.com" target="_blank" rel="noreferrer" className="transition hover:text-gold">
                  GITHUB
                </a>
              </nav>
              <LangToggle current={lang} />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-5 py-10">{children}</main>
        <footer className="mt-16 border-t hairline">
          <div className="mx-auto max-w-6xl px-5 py-8 font-mono text-[11px] leading-relaxed tracking-wide text-faint">
            {d.layout.footer1}
            <br />
            {d.layout.footer2}
          </div>
        </footer>
      </body>
    </html>
  );
}
