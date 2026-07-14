import type { Metadata } from "next";
import Link from "next/link";
import localFont from "next/font/local";
import { t } from "../lib/i18n";
import { LogoMark } from "../components/logo";
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
  const d = t();

  return (
    <html lang="en" className={`${marcellus.variable} ${plexMono.variable}`}>
      <body className="min-h-screen">
        <header className="border-b hairline-gold">
          <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-x-6 gap-y-3 px-4 py-4 sm:px-5 sm:py-5">
            <Link href="/" className="flex min-w-0 items-center gap-3">
              <LogoMark className="h-9 w-auto shrink-0 sm:h-10" />
              <span className="flex min-w-0 flex-col gap-1">
                <span className="wordmark text-2xl leading-none sm:text-3xl">fineness</span>
                <span className="hidden font-mono text-[10px] tracking-[0.3em] text-faint sm:block">
                  {d.layout.tagline}
                </span>
              </span>
            </Link>
            <nav className="flex flex-wrap items-center gap-4 font-mono text-[10px] tracking-[0.15em] text-sage sm:gap-7 sm:text-[11px] sm:tracking-[0.2em]">
              <Link href="/methodology" className="transition hover:text-gold">
                {d.layout.methodology}
              </Link>
              <Link href="/docs" className="transition hover:text-gold">
                API
              </Link>
              <a
                href="https://github.com/aliihsanto/fineness"
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-gold"
              >
                GITHUB
              </a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-5 sm:py-10">{children}</main>
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
